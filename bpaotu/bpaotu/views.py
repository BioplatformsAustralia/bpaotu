import csv
import math
import numpy as np
import pandas as pd
import hmac
import io
import json
import logging
import os
import re
import time
import uuid
from collections import OrderedDict, defaultdict
from functools import wraps
from operator import itemgetter
from io import BytesIO
from xhtml2pdf import pisa

from sqlalchemy import Float, Integer

from bpaingest.projects.amdb.contextual import \
    AustralianMicrobiomeSampleContextual
from django.conf import settings
from django.core.mail import send_mail
from django.http import (Http404, HttpResponse, JsonResponse, HttpResponseServerError,
                         StreamingHttpResponse)
from django.template import loader
from django.urls import reverse
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from django.core.cache import caches

from celery import current_app

from . import tasks_minimal
from .biom import biom_zip_file_generator
from .ckan_auth import require_CKAN_auth
from .galaxy_client import galaxy_ensure_user, get_krona_workflow
from .importer import DataImporter
from .krona import KronaPlot
from .models import NonDenoisedDataRequest, MetagenomeRequest
from .otu import (Environment, OTUAmplicon, SampleContext, TaxonomySource, format_taxonomy_name)
from .params import clean_amplicon_filter, make_clean_taxonomy_filter, param_to_filters, selected_contextual_filters
from .query import (ContextualFilter, ContextualFilterTermDate, ContextualFilterTermTime,
                    ContextualFilterTermFloat, ContextualFilterTermLongitude,
                    ContextualFilterTermOntology,
                    ContextualFilterTermSampleID, ContextualFilterTermString,
                    MetadataInfo, OntologyInfo, OTUQueryParams, SampleQuery,
                    TaxonomyFilter, TaxonomyOptions, get_sample_ids,
                    SampleSchemaDefinition, make_cache_key, CACHE_7DAYS)
from .site_images import fetch_image, get_site_image_lookup_table, make_ckan_remote
from .spatial import spatial_query
from .submission import Submission
from .tabular import tabular_zip_file_generator
from .util import make_timestamp, parse_date, parse_time, parse_float, log_msg, mem_usage_obj

from .sample_run_id_dict import sample_run_id_dict

from mixpanel import Mixpanel
import hashlib

logger = logging.getLogger('bpaotu')

mp = Mixpanel(settings.MIXPANEL_TOKEN) if getattr(settings, "MIXPANEL_TOKEN", None) else None

# See datatables.net serverSide documentation for details
ORDERING_PATTERN = re.compile(r'^order\[(\d+)\]\[(dir|column)\]$')
COLUMN_PATTERN = re.compile(r'^columns\[(\d+)\]\[(data|name|searchable|orderable)\]$')

CACHE_1DAY = (60 * 60 * 24)
CACHE_7DAYS = (60 * 60 * 24 * 7)


class OTUError(Exception):
    def __init__(self, *errors):
        self.errors = errors

class HttpResponseNoContent(HttpResponse):
    """
    Special HTTP response with no content, just headers.
    The content operations are ignored.
    """

    def __init__(self, content="", mimetype=None, status=None, content_type=None):
        super().__init__(status=204)

        if "content-type" in self._headers:
            del self._headers["content-type"]

    def _set_content(self, value):
        pass

    def _get_content(self, value):
        pass


def make_environment_lookup():
    with OntologyInfo() as info:
        return dict(info.get_values(Environment))


def normalise_blast_search_string(s):
    cleaned = s.strip().upper()
    used_chars = set(cleaned)
    permitted_chars = set('GATC')
    invalid = used_chars - permitted_chars
    if invalid:
        raise OTUError("BLAST search string contains invalid characters: {}".format(invalid))
    return cleaned


@require_GET
@ensure_csrf_cookie
def api_config(request):
    config = {
        'version': settings.VERSION,
        'reference_data_endpoint': reverse('reference_data_options'),
        'trait_endpoint': reverse('trait_options'),
        'taxonomy_endpoint': reverse('taxonomy_options'),
        'contextual_endpoint': reverse('contextual_fields'),
        'contextual_graph_endpoint': reverse('contextual_graph_fields'),
        'taxonomy_graph_endpoint': reverse('taxonomy_graph_fields'),
        'taxonomy_search_endpoint': reverse('taxonomy_search'),
        'search_endpoint': reverse('otu_search'),
        'export_endpoint': reverse('otu_export'),
        'export_biom_endpoint': reverse('otu_biom_export'),
        'submit_to_galaxy_endpoint': reverse('submit_to_galaxy'),
        'execute_workflow_on_galaxy_endpoint': reverse('execute_workflow_on_galaxy'),
        'galaxy_submission_endpoint': reverse('galaxy_submission'),
        'nondenoised_request_endpoint': reverse('nondenoised_request'),
        'krona_request_endpoint': reverse('krona_request'),
        'submit_blast_endpoint': reverse('submit_blast'),
        'cancel_blast_endpoint': reverse('cancel_blast'),
        'blast_submission_endpoint': reverse('blast_submission'),
        'search_sample_sites_endpoint': reverse('otu_search_sample_sites'),
        'submit_comparison_endpoint': reverse('submit_comparison'),
        'cancel_comparison_endpoint': reverse('cancel_comparison'),
        'comparison_submission_endpoint': reverse('comparison_submission'),
        'search_blast_otus_endpoint': reverse('otu_search_blast_otus'),
        'required_table_headers_endpoint': reverse('required_table_headers'),
        'contextual_csv_download_endpoint': reverse('contextual_csv_download_endpoint'),
        'contextual_schema_definition': reverse('contextual_schema_definition'),
        'mixpanel_token': settings.MIXPANEL_TOKEN,
        'cookie_consent_accepted_endpoint': reverse('cookie_consent_accepted'),
        'cookie_consent_declined_endpoint': reverse('cookie_consent_declined'),
        'base_url': settings.BASE_URL,
        'static_base_url': settings.STATIC_URL,
        'galaxy_base_url': settings.GALAXY_BASE_URL,
        'ckan_base_url': settings.CKAN_SERVER['base_url'],
        'ckan_check_permissions': (
            settings.CKAN_CHECK_PERMISSIONS_URL if settings.PRODUCTION
            else reverse('dev_only_ckan_check_permissions')),
        'galaxy_integration': settings.GALAXY_INTEGRATION,
        'default_amplicon': settings.DEFAULT_AMPLICON,
        'default_taxonomies': [format_taxonomy_name(db, method)
                               for db, method in settings.DEFAULT_TAXONOMIES],
        'metaxa_amplicon': 'metaxa_from_metagenomes',
    }
    return JsonResponse(config)

@require_CKAN_auth
@require_GET
def cookie_consent_declined(request):
    if settings.MIXPANEL_TOKEN:
        mp = Mixpanel(settings.MIXPANEL_TOKEN)
        mp.track('None', 'Cookie consent declined')
    else:
        logger.info("No MIXPANEL_TOKEN")

    return HttpResponseNoContent()

@require_CKAN_auth
@require_GET
def cookie_consent_accepted(request):
    if settings.MIXPANEL_TOKEN:
        mp = Mixpanel(settings.MIXPANEL_TOKEN)
        mp.track('None', 'Cookie consent accepted')
    else:
        logger.info("No MIXPANEL_TOKEN")

    return HttpResponseNoContent()

@require_CKAN_auth
@require_GET
def reference_data_options(request):
    """
    private API: return the available amplicons and taxonomic rank names
    """
    with OntologyInfo() as options:
        amplicons = options.get_values(OTUAmplicon)
        taxonomy_labels = options.get_taxonomy_labels()
    return JsonResponse({
        'amplicons': amplicons,
        'ranks': taxonomy_labels
    })


@require_CKAN_auth
@require_GET
def trait_options(request):
    """
    private API: return the possible traits
    """
    with SampleQuery(OTUQueryParams(
            None,
            TaxonomyFilter(None, [], None),
            None)) as query:
        amplicon_filter = clean_amplicon_filter(json.loads(request.GET['amplicon']))
        vals = [[x[0], x[0]] for x in query.import_traits(amplicon_filter)]
    return JsonResponse({
        'possibilities': vals
    })


@require_CKAN_auth
@require_GET
def taxonomy_options(request):
    """
    private API: given taxonomy constraints, return the possible options
    """

    with TaxonomyOptions() as options:
        taxonomy_filter = make_clean_taxonomy_filter(
            json.loads(request.GET['amplicon']),
            json.loads(request.GET['selected']),
            json.loads(request.GET['trait']))
        possibilities = options.possibilities(taxonomy_filter)

    # if no taxa fields are selected, then determine a preferred initial
    # selection for rank1 (kingdom/domain)
    try:
        rank1_selection = json.loads(request.GET['selected'])[1]['value']
    except KeyError as e:
        rank1_selection = None

    if rank1_selection:
        initial = None
    else:
        def extract_first_word(string):
            parts = string.split('_')
            for part in parts:
                if part.isalpha():
                    return part
            return None

        def extract_full_word(string):
            parts = string.split('_')
            for part in parts:
                if len(part) > 1:
                    return part
            return None

        # match the first part of the word component of the amplicon with the domain/kingdom name
        initial = None
        with OntologyInfo() as options:
            amplicons = options.get_values(OTUAmplicon)

            amplicon_filter = json.loads(request.GET['amplicon'])
            id_to_find = amplicon_filter['value']
            matching = next((a for a in amplicons if a[0] == id_to_find), None)
            amplicon_text = matching[1]
            amplicon_word = extract_first_word(amplicon_text)

            for p in possibilities['new_options']['possibilities']:
                match_amplicon = amplicon_word[:5].lower()
                match_kingdom = extract_full_word(p[1])[:5].lower()
                if match_amplicon == match_kingdom:
                    initial = p[0]
                    break

    return JsonResponse({
        'possibilities': possibilities,
        'initial': initial,
    })


@require_CKAN_auth
@require_GET
def contextual_fields(request):
    """
    private API: return the available fields, and their types, so that
    the contextual filtering UI can be built
    """
    field_definitions, classifications, ontology_classes, fields_by_type = {}, {}, {}, defaultdict(list)
    field_units = AustralianMicrobiomeSampleContextual.units_for_fields()
    contextual_schema_definition = get_contextual_schema_definition().get("definition", {})
    for key, field in contextual_schema_definition.get("Field", {}).items():
        if field in DataImporter.amd_ontologies:
            field += '_id'
        elif field == 'sample_id':
            field = 'id'
        field_definitions[field] = contextual_schema_definition.get("Field_Definition", {}).get(key)
        am_environment = contextual_schema_definition.get("AM_enviro", {}).get(key).lstrip().rstrip()
        am_environment_lookup = dict((t[1], t[0]) for t in make_environment_lookup().items())
        am_environment_id = am_environment_lookup.get(am_environment, "")
        if am_environment_id:
            classifications[field] = am_environment_id


    # TODO Note TS: I don't understand why do we group columns together by their type.
    # Why can't we just got through them once and map them to the definitions?

    # group together columns by their type. note special case
    # handling for our ontology linkage columns
    for column in SampleContext.__table__.columns:
        if column.name == 'id':
            continue
        if hasattr(column, "ontology_class"):
            ty = '_ontology'
            ontology_classes[column.name] = column.ontology_class
        else:
            ty = str(column.type)
        fields_by_type[ty].append(column.name)

    def make_defn(typ, name, **kwargs):
        r = kwargs.copy()
        r.update({
            'type': typ,
            'name': name,
            'environment': classifications.get(name),
            'display_name': SampleContext.display_name(name),
            'units': field_units.get(name),
            'definition': field_definitions.get(name),
        })
        return r

    with OntologyInfo() as info:
        fields_with_values = [
            (field_name, info.get_values_filtered(ontology_classes[field_name], field_name))
            for field_name in fields_by_type['_ontology']]

    definitions = (
        [make_defn('sample_id', 'id', display_name='Sample ID', values=get_sample_ids())] +
        [make_defn('date', field_name) for field_name in fields_by_type['DATE']] +
        [make_defn('time', field_name) for field_name in fields_by_type['TIME']] +
        [make_defn('float', field_name) for field_name in fields_by_type['FLOAT']] +
        [make_defn('string', field_name) for field_name in fields_by_type['CITEXT']] +
        [make_defn('ontology', field_name, values=values) for field_name, values in fields_with_values])
    definitions.sort(key=lambda a: a['display_name'].lower())

    return JsonResponse({
        'definitions': definitions,
        'definitions_url': get_contextual_schema_definition().get("download_url"),
        'scientific_manual_url': get_scientific_manual_url()
    })

@require_CKAN_auth
@require_POST
def contextual_graph_fields(request, contextual_filtering=True):
    additional_headers = selected_contextual_filters(request.POST['otu_query'], contextual_filtering=contextual_filtering)
    all_headers = ['id', 'am_environment_id', 'vegetation_type_id', 'env_broad_scale_id', 'env_local_scale_id', 'ph',
                   'organic_carbon', 'nitrate_nitrogen', 'ammonium_nitrogen_wt', 'phosphorus_colwell', 'sample_type_id',
                   'temp', 'nitrate_nitrite', 'nitrite', 'chlorophyll_ctd', 'salinity', 'silicate'] + additional_headers
    params, errors = param_to_filters(request.POST['otu_query'], contextual_filtering=contextual_filtering)

    if errors:
        return JsonResponse({
            'errors': [str(t) for t in errors],
            'graphdata': {}
        })

    # Note: this is in here rather than taxonomy_graph_fields for no particular reason
    track(request, 'otu_interactive_graph_search', search_params_track_args(params))

    graph_results = {}
    sample_results = {}

    with SampleQuery(params) as query:
        results = query.matching_sample_graph_data(all_headers)

    if results:
        ndata = np.array(results)
        tdata = np.array(results).T
        for i, h in enumerate(all_headers):
            column = SampleContext.__table__.columns[h]
            # skip sentinel values but not for ontologies, strings etc.
            skip_sentinels = isinstance(column.type, (Integer, Float)) and not column.foreign_keys
            cleaned_data = [x for x in tdata[i]
                            if (x != None and not
                            (skip_sentinels and math.isclose(x, settings.BPAOTU_MISSING_VALUE_SENTINEL)))]
            graph_results[h] = [xy.tolist() for xy in np.unique(cleaned_data, return_counts=True)]

        for x in ndata:
            sample_id_column = all_headers.index('id')
            sample_id = x[sample_id_column]
            sample_data = dict(zip(all_headers, x.tolist()))
            sample_results[sample_id] = sample_data

    return JsonResponse({
        'graphdata': graph_results,
        'sampledata': sample_results,
    })

@require_CKAN_auth
@require_POST
def taxonomy_graph_fields(request, contextual_filtering=True):
    # Exclude environment field of contextual_filters
    am_environment_selected = None
    otu_query = request.POST['otu_query']
    otu_query_dict = json.loads(otu_query)
    if(otu_query_dict.get('contextual_filters') and otu_query_dict.get('contextual_filters').get('environment')):
        am_environment_selected = otu_query_dict['contextual_filters']['environment']
        otu_query_dict['contextual_filters']['environment'] = None
        otu_query = json.dumps(otu_query_dict)

    params_all, errors_all = param_to_filters(otu_query, contextual_filtering=False)
    if errors_all:
        return JsonResponse({
            'errors': [str(t) for t in errors_all],
            'graphdata': {}
        })

    with SampleQuery(params_all) as query:
        results_all = query.matching_taxonomy_graph_data()

    params_selected, errors_selected = param_to_filters(request.POST['otu_query'], contextual_filtering=contextual_filtering)
    if errors_selected:
        return JsonResponse({
            'errors': [str(t) for t in errors_selected],
            'graphdata': {}
        })

    with SampleQuery(params_selected) as query:
        results_selected = query.matching_taxonomy_graph_data()

    df_results_all = pd.DataFrame(results_all, columns=['amplicon', 'taxonomy', 'am_environment', 'traits', 'sum'])
    df_results_selected = pd.DataFrame(results_selected, columns=['amplicon', 'taxonomy', 'am_environment', 'traits', 'sum'])
    taxonomy_results = dict(df_results_selected.groupby('taxonomy').agg({'sum': ['sum']}).itertuples(index=True, name=None))
    amplicon_results = dict(df_results_selected.groupby('amplicon').agg({'sum': ['sum']}).itertuples(index=True, name=None))

    df_traits = df_results_selected.explode('traits')
    df_traits_group = df_traits.groupby('traits')
    traits_results = dict(df_traits_group.agg({'sum': ['sum']}).itertuples(index=True, name=None))

    am_environment_results_all = []
    for taxonomy_am_environment, sum in df_results_all.groupby(['taxonomy']).agg({'sum': ['sum']}).itertuples(index=True, name=None):
        am_environment_results_all.append([taxonomy_am_environment, sum])

    am_environment_results = {}
    if am_environment_selected and am_environment_selected.get('value', None):
        df_results_all = df_results_all.query('am_environment == @am_environment_selected.get("value", None)')
    for taxonomy_am_environment, sum in df_results_all.groupby(['am_environment', 'taxonomy']).agg({'sum': ['sum']}).itertuples(index=True, name=None):
        if am_environment_results.get(taxonomy_am_environment[0]):
            am_environment_results[taxonomy_am_environment[0]].append([taxonomy_am_environment[1], sum])
        else:
            am_environment_results[taxonomy_am_environment[0]] = [[taxonomy_am_environment[1], sum]]

    am_environment_results_selected = {}
    for taxonomy_am_environment, sum in df_results_selected.groupby(['am_environment', 'taxonomy']).agg({'sum': ['sum']}).itertuples(index=True, name=None):
        if am_environment_results_selected.get(taxonomy_am_environment[0]):
            am_environment_results_selected[taxonomy_am_environment[0]].append([taxonomy_am_environment[1], sum])
        else:
            am_environment_results_selected[taxonomy_am_environment[0]] = [[taxonomy_am_environment[1], sum]]

    am_environment_results_non_selected = {}
    for taxonomy_am_environment in am_environment_results:
        if am_environment_results_selected.get(taxonomy_am_environment):
            tlist = []
            for taxa in am_environment_results.get(taxonomy_am_environment):
                for taxa_selected in am_environment_results_selected.get(taxonomy_am_environment):
                    if taxa[0] == taxa_selected[0]:
                        tlist.append([taxa[0], taxa[1]-taxa_selected[1]])
            if am_environment_results_non_selected.get(taxonomy_am_environment):
                am_environment_results_non_selected[taxonomy_am_environment].append(tlist)
            else:
                am_environment_results_non_selected[taxonomy_am_environment] = tlist
        else:
            am_environment_results_non_selected[taxonomy_am_environment] = am_environment_results[taxonomy_am_environment]

    # Traits calculations
    traits_df_results_all = df_results_all.explode('traits')
    traits_am_environment_results_all = []
    for traits_am_environment, sum in traits_df_results_all.groupby(['traits']).agg({'sum': ['sum']}).itertuples(index=True, name=None):
        traits_am_environment_results_all.append([traits_am_environment, sum])

    traits_am_environment_results = {}
    if am_environment_selected and am_environment_selected.get('value', None):
        traits_df_results_all = traits_df_results_all.query('am_environment == @am_environment_selected.get("value", None)')
    for traits_am_environment, sum in traits_df_results_all.groupby(['am_environment', 'traits']).agg({'sum': ['sum']}).itertuples(index=True, name=None):
        if traits_am_environment_results.get(traits_am_environment[0]):
            traits_am_environment_results[traits_am_environment[0]].append([traits_am_environment[1], sum])
        else:
            traits_am_environment_results[traits_am_environment[0]] = [[traits_am_environment[1], sum]]

    df_results_selected = df_results_selected.explode("traits")
    traits_am_environment_results_selected = {}
    for traits_am_environment, sum in df_results_selected.groupby(['am_environment', 'traits']).agg({'sum': ['sum']}).itertuples(index=True, name=None):
        if traits_am_environment_results_selected.get(traits_am_environment[0]):
            traits_am_environment_results_selected[traits_am_environment[0]].append([traits_am_environment[1], sum])
        else:
            traits_am_environment_results_selected[traits_am_environment[0]] = [[traits_am_environment[1], sum]]

    traits_am_environment_results_non_selected = {}
    for traits_am_environment in traits_am_environment_results:
        if traits_am_environment_results_selected.get(traits_am_environment):
            tlist = []
            for trait in traits_am_environment_results.get(traits_am_environment):
                for trait_selected in traits_am_environment_results_selected.get(traits_am_environment):
                    if trait[0] == trait_selected[0]:
                        tlist.append([trait[0], trait[1]-trait_selected[1]])
            if traits_am_environment_results_non_selected.get(traits_am_environment):
                traits_am_environment_results_non_selected[traits_am_environment].append(tlist)
            else:
                traits_am_environment_results_non_selected[traits_am_environment] = tlist
        else:
            traits_am_environment_results_non_selected[traits_am_environment] = traits_am_environment_results[traits_am_environment]

    return JsonResponse({
        'graphdata': {
            "traits": traits_results,
            "amplicon": amplicon_results,
            "taxonomy": taxonomy_results,
            "am_environment_all": am_environment_results_all,
            "am_environment": am_environment_results,
            "am_environment_selected": am_environment_results_selected,
            "am_environment_non_selected": am_environment_results_non_selected,
            "traits_am_environment_all": traits_am_environment_results_all,
            "traits_am_environment": traits_am_environment_results,
            "traits_am_environment_selected": traits_am_environment_results_selected,
            "traits_am_environment_non_selected": traits_am_environment_results_non_selected
        }
    })


@require_CKAN_auth
@require_GET
def taxonomy_search(request):
    """
    private API: given taxonomy constraints, return the possible options
    """

    selected_amplicon = json.loads(request.GET['selected_amplicon'])
    taxonomy_search_string = json.loads(request.GET['taxonomy_search_string'])

    if not taxonomy_search_string:
        return JsonResponse({
            'error': 'No search string',
            'results': [],
        })

    track(request, 'otu_taxonomy_search', { 'taxonomy_search_string': taxonomy_search_string })

    with TaxonomyOptions() as options:
        results = options.search(selected_amplicon, taxonomy_search_string)
        serialized_results = [serialize_taxa_search_result(result) for result in results]

    return JsonResponse({
        'results': serialized_results,
    })

def serialize_taxa_search_result(result):
    return {
        'taxonomy': result[0].to_dict(),
    }


def _parse_contextual_term(filter_spec):
    field_name = filter_spec['field']

    operator = filter_spec.get('operator')
    column = SampleContext.__table__.columns[field_name]
    typ = str(column.type)
    if column.name == 'id':
        if len(filter_spec['is']) == 0:
            raise ValueError("Value can't be empty")
        return ContextualFilterTermSampleID(field_name, operator, [t for t in filter_spec['is']])
    elif hasattr(column, 'ontology_class'):
        return ContextualFilterTermOntology(field_name, operator, int(filter_spec['is']))
    elif typ == 'DATE':
        return ContextualFilterTermDate(
            field_name, operator, parse_date(filter_spec['from']), parse_date(filter_spec['to']))
    elif typ == 'TIME':
        return ContextualFilterTermTime(
            field_name, operator, parse_time(filter_spec['from']), parse_time(filter_spec['to']))
    elif typ == 'FLOAT':
        return (ContextualFilterTermLongitude
                if field_name == 'longitude'
                else ContextualFilterTermFloat)(
            field_name, operator, parse_float(filter_spec['from']), parse_float(filter_spec['to']))
    elif typ == 'CITEXT':
        value = str(filter_spec['contains'])
        # if value == '':
        #     raise ValueError("Value can't be empty")
        return ContextualFilterTermString(field_name, operator, value)
    else:
        raise ValueError("invalid filter term type: %s", typ)



@require_POST
def required_table_headers(request):
    return otu_search(request, contextual_filtering=False)


ACKNOWLEDGEMENT_EMAIL_TEMPLATE = """\
Your request for non-denoised data from the Australian Microbiome has been received.

We will be in touch once the data is available, or if we require further information.

The details of your request are provided below for your reference.

User email: {email}

Request ID:
{id}

Requested amplicon:
{amplicon}

Requested samples:
{selected_samples}

Match sequence:
{match_sequence}

Taxonomy string:
{taxonomy_string}
"""


NONDENOISED_EMAIL_TEMPLATE = """\
A request for non-denoised data has been received.

User email: {email}

Request ID:
{id}

Requested amplicon:
{amplicon}

Requested samples:
{selected_samples}

Match sequence:
{match_sequence}

Taxonomy string:
{taxonomy_string}
"""


@require_CKAN_auth
@require_POST
def nondenoised_request(request):
    attrs = {
        k: request.POST.get(k, '')
        for k in ('match_sequence', 'taxonomy_string')
    }
    with OntologyInfo() as info:
        amplicon_id = request.POST.get('selected_amplicon', '')
        attrs['amplicon'] = info.id_to_value(OTUAmplicon, amplicon_id)
    attrs['email'] = request.ckan_data.get('email')
    attrs['selected_samples'] = '\n'.join(json.loads(request.POST.get('selected_samples', '[]')))

    request_object = NonDenoisedDataRequest(**attrs)
    request_object.save()
    attrs['id'] = request_object.id

    track(request, 'otu_nondenoised_data_request')

    send_mail(
        "[ND#{}] Australian Microbiome: Data request received".format(request_object.id),
        ACKNOWLEDGEMENT_EMAIL_TEMPLATE.format(**attrs),
        "Australian Microbiome Data Requests <am-data-requests@bioplatforms.com>", [attrs['email']])
    send_mail(
        "[ND#{}] Non-denoised data request".format(request_object.id),
        NONDENOISED_EMAIL_TEMPLATE.format(**attrs),
        "Australian Microbiome Data Requests <am-data-requests@bioplatforms.com>", [settings.NONDENOISED_REQUEST_EMAIL])
    return JsonResponse({'okay': True})


@require_CKAN_auth
@require_POST
def krona_request(request):
    params, errors = param_to_filters(request.POST['query'])

    sample_id = request.POST["sample_id"].strip('"')
    if not sample_id:
        return JsonResponse({ "error": "sample_id is required as param" }, status=400)

    krona = KronaPlot(params, sample_id)
    html, krona_params_hash = krona.produce_krona_html()

    track(request, "otu_krona_plot_request", krona_params_hash)

    return JsonResponse({ "sample_id": sample_id, "html": html })

@require_CKAN_auth
@require_POST
def otu_search_sample_sites(request):
    params, errors = param_to_filters(request.POST['otu_query'])
    if errors:
        return JsonResponse({
            'errors': [str(e) for e in errors],
            'data': [],
            'sample_otus': []
        })
    data, sample_otus = spatial_query(params)

    site_image_lookup_table = get_site_image_lookup_table()

    for d in data:
        key = (str(d['latitude']), str(d['longitude']))
        d['site_images'] = site_image_lookup_table.get(key)

    track(request, 'otu_interactive_map_search', search_params_track_args(params))

    return JsonResponse({ 'data': data, 'sample_otus': sample_otus })


@require_CKAN_auth
@require_POST
def otu_search_blast_otus(request):
    params, errors = param_to_filters(request.POST['otu_query'], contextual_filtering=True)
    if errors:
        return JsonResponse({
            'errors': [str(e) for e in errors],
            'rowsCount': 0,
        })

    with SampleQuery(params) as query:
        results = query.matching_sample_headers()

    result_count = len(results)

    return JsonResponse({
        'rowsCount': result_count,
    })

# technically we should be using GET, but the specification
# of the query (plus the datatables params) is large: so we
# avoid the issues of long URLs by simply POSTing the query
@require_CKAN_auth
@require_POST
def otu_search(request, contextual_filtering=True):
    def _int_get_param(param_name):
        param = request.POST.get(param_name)
        try:
            return int(param) if param is not None else None
        except ValueError:
            return None

    start = _int_get_param('start')
    length = _int_get_param('length')

    additional_headers = json.loads(request.POST.get('columns', '[]'))
    all_headers = ['sample_id', 'environment'] + additional_headers

    environment_lookup = make_environment_lookup()

    sorting = _parse_table_sorting(json.loads(request.POST.get('sorting', '[]')), all_headers)

    params, errors = param_to_filters(request.POST['otu_query'], contextual_filtering=contextual_filtering)
    if errors:
        return JsonResponse({
            'errors': [str(t) for t in errors],
            'data': [],
            'rowsCount': 0,
        })

    with SampleQuery(params) as query:
        results = query.matching_sample_headers(additional_headers, sorting)

    result_count = len(results)

    if start >= result_count:
        start = (result_count // length) * length
    results = results[start:start + length]

    def get_environment(environment_id):
        if environment_id is None:
            return None
        return environment_lookup[environment_id]

    def map_result(row):
        d = dict(zip(all_headers, row))
        d['environment'] = get_environment(d['environment'])
        d['run_id'] = sample_run_id_dict.get(d['sample_id'])
        return d

    # only send event once per actual search
    # - exclude other request paths that call this method (e.g. contextual export)
    # - only after clicking 'Sample search' (not when using pagination controls, i.e. start is 0)
    if request.path.split('/')[-1] == 'search' and start == 0:
        if params.contextual_filter.metagenome_only:
            event = 'otu_sample_search_metagenome'
        else:
            event = 'otu_sample_search'

        track(request, event, search_params_track_args(params))

    return JsonResponse({
        'data': [map_result(row) for row in results],
        'rowsCount': result_count,
    })


@require_CKAN_auth
@require_GET
def otu_biom_export(request):
    timestamp = make_timestamp()
    params, errors = param_to_filters(request.GET['q'])

    track(request, 'otu_export_BIOM', search_params_track_args(params))

    zf = biom_zip_file_generator(params, timestamp)
    response = StreamingHttpResponse(zf, content_type='application/zip')
    filename = params.filename(timestamp, '.biom.zip')
    response['Content-Disposition'] = 'attachment; filename="%s"' % filename

    return response


@require_CKAN_auth
@require_GET
def otu_export(request):
    """
    this view takes:
     - contextual filters
     - taxonomic filters
    produces a Zip file containing:
      - an CSV of all the contextual data samples matching the query
      - an CSV of all the OTUs matching the query, with counts against Sample IDs
    """
    timestamp = make_timestamp()
    params, errors = param_to_filters(request.GET['q'])
    only_contextual = request.GET['only_contextual']

    # many endpoints make use of this, so determine the purpose
    if only_contextual == 't':
        if params.contextual_filter.metagenome_only:
            event = 'otu_export_CSV_only_contextual_metagenome'
        else:
            event = 'otu_export_CSV_only_contextual'
    else:
        event = 'otu_export_CSV'

    track(request, event, search_params_track_args(params))

    zf = tabular_zip_file_generator(params, only_contextual)
    response = StreamingHttpResponse(zf, content_type='application/zip')
    filename = params.filename(timestamp, '-csv.zip')
    response['Content-Disposition'] = 'attachment; filename="%s"' % filename

    return response


def do_on_galaxy(galaxy_action):

    @wraps(galaxy_action)
    def galaxy_wrapper_view(request):
        try:
            ckan_data = request.ckan_data

            email = ckan_data.get('email')
            if not email:
                raise OTUError("Could not retrieve user's email")

            params, errors = param_to_filters(request.POST['query'])

            if errors:
                raise OTUError(*errors)

            submission_id, user_created = galaxy_action(request, email)

            return JsonResponse({
                'success': True,
                'submission_id': submission_id,
                'user_created': user_created,
            })
        except OTUError as exc:
            logger.exception('Error in submit to Galaxy')
            return JsonResponse({
                'success': False,
                'errors': exc.errors,
            })

    return galaxy_wrapper_view


@require_CKAN_auth
@require_POST
@do_on_galaxy
def submit_to_galaxy(request, email):
    '''Submits the search results as a biom file into a new history in Galaxy.'''
    user_created = galaxy_ensure_user(email)
    submission_id = tasks_minimal.submit_to_galaxy.delay(email, request.POST['query'])
    return submission_id, user_created


@require_CKAN_auth
@require_POST
@do_on_galaxy
def execute_workflow_on_galaxy(request, email):
    user_created = galaxy_ensure_user(email)
    workflow_id = get_krona_workflow(email)
    submission_id = tasks_minimal.execute_workflow_on_galaxy(email, request.POST['query'], workflow_id)
    return submission_id, user_created


@require_CKAN_auth
@require_GET
def galaxy_submission(request):
    submission_id = request.GET['submission_id']
    submission = Submission(submission_id)

    if not submission.history_id or not submission.file_id:
        state = 'pending'
    else:
        state = submission.upload_state

    return JsonResponse({
        'success': True,
        'submission': {
            'id': submission_id,
            'history_id': submission.history_id,
            'file_id': submission.file_id,
            'state': state,
        }
    })


@require_CKAN_auth
@require_POST
def submit_blast(request):
    try:
        query = request.POST['query']
        params, errors = param_to_filters(query)
        if errors:
            raise OTUError(*errors)

        search_string = normalise_blast_search_string(request.POST['search_string'])
        blast_params_string = request.POST['blast_params']

        submission_id = str(uuid.uuid4())
        result = tasks_minimal.submit_blast.delay(submission_id, query, search_string, blast_params_string)

        track(request, 'otu_blast_search', { 'blast_params': json.loads(blast_params_string) })

        return JsonResponse({
            'success': True,
            'submission_id': submission_id,
        })
    except OTUError as exc:
        logger.exception('Error in submit BLAST')
        logger.exception(exc)
        return JsonResponse({
            'success': False,
            'errors': exc.errors,
        })

@require_CKAN_auth
@require_POST
def cancel_blast(request):
    try:
        body_unicode = request.body.decode('utf-8')
        body_data = json.loads(body_unicode)
        submission_id = body_data['submissionId']

        result = tasks_minimal.cancel_blast(submission_id)

        if result:
            return JsonResponse({
                'success': True,
                'submission_id': submission_id,
                'cancelled': True,
            })
        else:
            return JsonResponse({
                'success': False,
                'submission_id': submission_id,
                'cancelled': False,
            })
    except OTUError as exc:
        logger.exception('Error in cancel BLAST search')
        logger.exception(exc)
        return JsonResponse({
            'success': False,
            'cancelled': False,
            'errors': exc.errors,
        })

@require_CKAN_auth
@require_GET
def blast_submission(request):
    submission_id = request.GET['submission_id']
    submission = Submission(submission_id)
    state = submission.status
    timestamps = timestamps_relative(json.loads(submission.timestamps))

    response = {
        'success': True,
        'submission': {
            'id': submission_id,
            'state': state,
            'duration': None,
            'timestamps': timestamps,
            'row_count': submission.row_count,
            'result_url': submission.result_url,
            'image_contents': submission.image_contents,
        }
    }

    if state == 'complete':
        try:
            duration = timestamps_duration(timestamps)
            response['submission']['duration'] = duration
            logger.info(f"duration: {duration}")
            logger.info(f"timestamps: {timestamps}")
        except Exception as e:
            logger.warning("Could not calculate duration of BLAST search; %s" % getattr(e, 'message', repr(e)))

        tasks_minimal.cleanup_blast(submission_id)

    elif state == 'error':
        response['submission']['error'] = submission.error
        tasks_minimal.cleanup_blast(submission_id)

    else:
        # still ongoing
        pass

    return JsonResponse(response)


@require_CKAN_auth
@require_POST
def submit_comparison(request):
    try:
        params, errors = param_to_filters(request.POST['query'])
        if errors:
            raise OTUError(*errors)

        # we pass the query and not the params to avoid serialising the params to json
        query = request.POST.get('query')
        umap_params_string = request.POST.get('umap_params', "{}")

        # because the initial submit task call has to be with delay we need to create the Submission id here
        # the submit task will create the Submission in cache and start the rest of the task
        submission_id = str(uuid.uuid4())
        result = tasks_minimal.submit_sample_comparison.delay(submission_id, query, umap_params_string)

        track(request, 'otu_sample_comparison', search_params_track_args(params))

        return JsonResponse({
            'success': True,
            'submission_id': submission_id,
        })
    except OTUError as exc:
        logger.exception('Error in submit to sample comparison')
        logger.exception(exc)
        return JsonResponse({
            'success': False,
            'errors': [str(t) for t in exc.errors],
        })

@require_CKAN_auth
@require_POST
def cancel_comparison(request):
    try:
        body_unicode = request.body.decode('utf-8')
        body_data = json.loads(body_unicode)
        submission_id = body_data['submissionId']

        result = tasks_minimal.cancel_sample_comparison(submission_id)

        if result:
            return JsonResponse({
                'success': True,
                'submission_id': submission_id,
                'cancelled': True,
            })
        else:
            return JsonResponse({
                'success': False,
                'submission_id': submission_id,
                'cancelled': False,
            })
    except OTUError as exc:
        logger.exception('Error in cancel sample comparison')
        logger.exception(exc)
        return JsonResponse({
            'success': False,
            'cancelled': False,
            'errors': exc.errors,
        })

@require_CKAN_auth
@require_GET
def comparison_submission(request):
    submission_id = request.GET['submission_id']
    submission = Submission(submission_id)
    state = submission.status
    timestamps = timestamps_relative(json.loads(submission.timestamps))

    # look for an active task with the submission_id in the task args
    active_tasks = get_active_celery_tasks()
    task_found = any(submission_id in task["args"] for task in active_tasks)

    results = { 'abundanceMatrix': {}, 'contextual': {} }
    response = {
        'success': True,
        'mem_usage': mem_usage_obj(),
        'submission': {
            'id': submission_id,
            'state': state,
            'duration': None,
            'results': results,
            'timestamps': timestamps,
            'task_found': task_found,
        }
    }

    # testing to see if both get set
    # this is set in the cancel() method
    if submission.cancelled:
        response['submission']["cancelled"] = True
        logger.info("***** submission.cancelled")

    if state == 'cancelled':
        logger.info("***** state == cancelled")


    if state == 'complete':
        try:
            duration = timestamps_duration(timestamps)
            response['submission']['duration'] = duration

            logger.info(f"duration: {duration}")
            logger.info(f"timestamps: {timestamps}")
        except Exception as e:
            logger.warning("Could not calculate duration of sample comparison; %s" % getattr(e, 'message', repr(e)))

        try:
            results_files = json.loads(submission.results_files)
            results = {
                'abundanceMatrix': json.load(open(results_files['abundance_matrix_file'])),
                'contextual': json.load(open(results_files['contextual_file'])),
            }
            response['submission']['results'] = results
        except Exception as e:
            logger.error(f"Could not load result files for submission {submission_id}: {e}")

        tasks_minimal.cleanup_comparison(submission_id)

    elif state == 'error':
        response['submission']['error'] = submission.error
        tasks_minimal.cleanup_comparison(submission_id)

    elif not task_found:
        response['submission']['state'] = 'error'
        response['submission']['error'] = 'Server-side error. It is possible that the result set is too large! Please run a search with fewer samples.'
        tasks_minimal.cleanup_comparison(submission_id)

    else:
        # still ongoing
        pass


    return JsonResponse(response)

def otu_log(request):
    template = loader.get_template('bpaotu/otu_log.html')
    missing = {}
    with MetadataInfo() as info:
        for obj in info.excluded_samples():
            missing[obj.reason] = sorted(obj.samples)
        import_meta = info.import_metadata()
        context = {
            'ckan_base_url': settings.CKAN_SERVER['base_url'],
            'files': sorted(info.file_logs(), key=lambda x: x.filename),
            'ontology_errors': sorted(info.ontology_errors(), key=lambda x: x.ontology_name),
            'metadata': import_meta,
            'pdf': request.GET.get('pdf')
        }
        context.update(missing)
    html = template.render(context, request)
    if request.GET.get("pdf"):
        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(html.encode("ISO-8859-1")), result)
        if not pdf.err:
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            filename = "out_log_%s.pdf" %(str(import_meta.revision_date))
            content = "inline; filename=%s" %(filename)
            download = request.GET.get("download")
            if download:
                content = "attachment; filename=%s" %(filename)
            response['Content-Disposition'] = content
    else:
        response = HttpResponse(html)
    return response

@require_GET
def otu_log_download(request):
    missing = {}
    with MetadataInfo() as info:
        for obj in info.excluded_samples():
            missing[obj.reason] = sorted(obj.samples)
        metadata = info.import_metadata()
        file_logs = []
        for file in sorted(info.file_logs(), key=lambda x: x.filename):
            file_log = {
                'File name': file.filename,
                'File type': file.file_type,
                'File size': file.file_size,
                'Rows imported': file.rows_imported,
                'Rows skipped': file.rows_skipped
            }
            file_logs.append(file_log)
        context = {
            'ckan_base_url': settings.CKAN_SERVER['base_url'],
            'files': file_logs,
            'ontology_errors': sorted(info.ontology_errors(), key=lambda x: x.ontology_name),
            'metadata': {
                'Methodology': metadata.methodology,
                'Analysis URL': metadata.analysis_url,
                'Revision': str(metadata.revision_date),
                'Imported': str(metadata.imported_at),
                'Samples': metadata.samplecontext_count,
                'OTUs': metadata.otu_count,
                'Abundance entries': metadata.sampleotu_count
            }
        }
        context.update(missing)

    data = json.dumps(context, indent=4)

    response = HttpResponse(data, content_type='application/json')
    filename = f"{metadata.revision_date}-csv.json"
    response['Content-Disposition'] = 'attachment; filename="%s"' % filename
    return response

@require_GET
def contextual_schema_definition(request):
    return JsonResponse(get_contextual_schema_definition())

def contextual_schema_definition_query():
    try:
        with SampleSchemaDefinition() as query:
            for path in query.get_schema_definition_url():
                download_url = str(path)

        # search the file for the "Schema_" sheet with the highest version number
        schema_prefix = 'Schema_'
        sheet_names = pd.ExcelFile(download_url).sheet_names
        schema_sheet_names = list(filter(lambda k: schema_prefix in k, sheet_names))
        sort_fn = lambda s: list(map(int, s.replace(schema_prefix, '').split('.')))
        schema_sheet_names.sort(key=sort_fn, reverse=True)

        df_definition = pd.read_excel(download_url, sheet_name=schema_sheet_names[0])
        df_definition = df_definition.fillna(value="")
    except IndexError as e:
        logger.error(f"No sheet names match '{schema_prefix}'; sheet_names={sheet_names}; ({e})")
        download_url = ""
        df_definition = pd.DataFrame()
    except Exception as e:
        logger.error(f"Link {download_url} doesn't exist. {e}")
        download_url = ""
        df_definition = pd.DataFrame()
    return {
        'download_url': download_url,
        'definition': df_definition.to_dict(),
    }

def get_contextual_schema_definition(cache_duration=CACHE_7DAYS, force_cache=False):
    cache = caches['contextual_schema_definition_results']
    key = make_cache_key('contextual_schema_definition_query')
    result = None
    if not force_cache:
        result = cache.get(key)
    if result is None:
        result = contextual_schema_definition_query()
        cache.set(key, result, cache_duration)
    return result

def get_scientific_manual_url():
    return settings.BPAOTU_SCIENTIFIC_MANUAL_URL

@require_CKAN_auth
@require_GET
def contextual_csv_download_endpoint(request):
    data = request.GET.get('otu_query')

    additional_headers = json.loads(request.GET.get('columns', '[]'))
    all_headers = ['sample_id', 'environment'] + additional_headers

    sorting = _parse_table_sorting(json.loads(request.GET.get('sorting', '[]')), all_headers)

    params, errors = param_to_filters(data, contextual_filtering=False)
    with SampleQuery(params) as query:
        results = query.matching_sample_headers(additional_headers, sorting)

    header = ['sample_id', 'bpa_project'] + additional_headers

    track(request, 'otu_export_contextual_CSV', { 'columns': sorted(additional_headers) })

    file_buffer = io.StringIO()
    csv_writer = csv.writer(file_buffer)

    def read_and_flush():
        data = file_buffer.getvalue()
        file_buffer.seek(0)
        file_buffer.truncate()
        return data

    def yield_csv_function():
        csv_writer.writerow(header)
        yield read_and_flush()

        for r in results:
            row = []
            row.append(r)

            csv_writer.writerow(r)
            yield read_and_flush()

    response = StreamingHttpResponse(yield_csv_function(), content_type="text/csv")
    response['Content-Disposition'] = 'attachment; filename="contextual_data.csv"'

    return response


def _parse_table_sorting(sorting, headers):
    def parse_sorting(sort):
        if 'id' not in sort:
            return None
        col_name = sort.get('id')
        try:
            col_idx = headers.index(col_name)
        except ValueError:
            return None
        return {'col_idx': col_idx, 'desc': sort.get('desc', False)}

    def reject_nones(xs):
        return [x for x in xs if x is not None]

    return reject_nones(parse_sorting(s) for s in sorting)


def dev_only_ckan_check_permissions(request):
    if settings.PRODUCTION:
        raise Http404('View does not exist in production')

    # Uncomment to simulate user not logged in to CKAN
    # from django.http import HttpResponseForbidden
    # return HttpResponseForbidden()

    # organisations = [
    #     'anu-abc-upload', 'bpa-sepsis', 'australian-microbiome', 'bpa-project-documentation', 'bpa-barcode',
    #     'bioplatforms-australia', 'bpa-base', 'bpa-great-barrier-reef', 'incoming-data', 'bpa-marine-microbes',
    #     'bpa-melanoma', 'bpa-omg', 'bpa-stemcells', 'bpa-wheat-cultivars', 'bpa-wheat-pathogens-genomes',
    #     'bpa-wheat-pathogens-transcript']
    organisations = ['australian-microbiome']

    data = json.dumps({
        'email': settings.CKAN_DEVELOPMENT_USER_EMAIL,
        'timestamp': time.time(),
        'organisations': organisations,
    })

    secret_key = os.environ.get('BPAOTU_AUTH_SECRET_KEY').encode('utf8')
    digest_maker = hmac.new(secret_key, digestmod='md5')
    digest_maker.update(data.encode('utf8'))
    digest = digest_maker.hexdigest()

    response = '||'.join([digest, data])

    return HttpResponse(response)


@cache_page(CACHE_1DAY, cache="image_results")
def site_image_thumbnail(request, package_id, resource_id):
    '''
    Return specified cached image or fetch image from ckan and resize before caching and returning.
    '''

    buf, content_type = fetch_image(package_id, resource_id)

    if buf == None:
        # not ideal, but detecting a non image will require a bit more changes
        return HttpResponse('')
    else:
        return HttpResponse(buf.getvalue(), content_type=content_type)

@require_CKAN_auth
@require_POST
def metagenome_search(request):
    try:
        params, errors = param_to_filters(request.POST.get('otu_query'))
        if errors:
            raise OTUError(*errors)
        with SampleQuery(params) as query:
            sample_ids = [r[0] for r in query.matching_samples(SampleContext.id)]
            sample_ids.sort(
                key=lambda v: (0, int(v)) if v.isdecimal() else (1, v))
        return JsonResponse(
            dict(sample_ids=sample_ids))
    except Exception as e:
        logger.critical("Error in metagenome_search", exc_info=True)
        return HttpResponseServerError(str(e), content_type="text/plain")

@require_CKAN_auth
@require_POST
def metagenome_request(request):
    try:
        sample_ids = json.loads(request.POST['sample_ids'])
        file_types=json.loads(request.POST['selected_files'])
        to_email = settings.METAGENOME_REQUEST_EMAIL
        user_email=request.ckan_data.get('email')

        mg_request = MetagenomeRequest.objects.create(
            sample_ids='\n'.join(sample_ids),
            file_types='\n'.join(file_types),
            email=user_email)
        request_id = mg_request.id
        template_vars = dict(
            user_email=user_email,
            file_types=file_types,
            timestamp=mg_request.created,
            selected_samples=sample_ids,
            request_id=request_id
        )

        track(request, 'otu_request_metagenome_files')

        am_email ="Australian Microbiome Data Requests <{}>".format(to_email)

        template = loader.get_template('mg-ack-email.txt')
        body = template.render(template_vars, request)
        send_mail(
            "[MG#{}] Australian Microbiome: Metagenome data request received".format(request_id),
             body,
            am_email, [user_email])

        template = loader.get_template('mg-request-email.txt')
        body = template.render(template_vars, request)
        send_mail(
            "[MG#{}] Australian Microbiome: Metagenome data request".format(request_id),
            body,
            am_email, [to_email])

        return JsonResponse({
            'request_id': request_id,
             'timestamp': mg_request.created,
             'contact': to_email
            })

    except Exception as e:
        logger.critical("Error in metagenome_request", exc_info=True)
        return HttpResponseServerError(str(e), content_type="text/plain")


def timestamps_relative(timestamps):
    """
    Calculate timestamps relative to the init timestamp
    """

    if not timestamps or not isinstance(timestamps, list):
        # Input must be a non-empty list of dictionaries, just return as is
        return timestamps
    
    init_time = None
    for item in timestamps:
        if 'init' in item:
            init_time = item['init']
            break

    if init_time is None:
        # Missing 'init' timestamp, just return as is
        return timestamps

    relative = []
    for entry in timestamps:
        for key, value in entry.items():
            relative.append({key: value - init_time})

    return relative

def timestamps_duration(timestamps):
    duration = timestamps[-1]['complete'] - timestamps[0]['init']
    return round(duration, 2)

def get_active_celery_tasks():
    inspector = current_app.control.inspect()
    active_tasks = inspector.active()
    return [task for tasks in active_tasks.values() for task in tasks]


def track(request, event, args=None):
    """Tracks an event in Mixpanel if enabled."""
    if mp:
        try:
            email = request.ckan_data['email']
            ident = hash_ckan_email(email)
            mp.track(ident, event, args or {})
        except Exception as e:
            print(f"Mixpanel tracking failed: {e}")
    else:
        print("Mixpanel not configured, event not tracked.")

def hash_ckan_email(email):
    """
    Hashes the email using SHA-256 with a salt; this is a one-way operation so PII not collected
    
    :param identify: Function to handle the hashed identifier.
    :param email: User email to be hashed.
    """
    hash_salt = "d260c5eb-055b-4640-966d-1f657aec34b4"
    email_lower = email.strip().lower()
    hash_input = (email_lower + hash_salt).encode("utf-8")
    hashed = hashlib.sha256(hash_input).digest()
    hashed_email = hashed.hex()

    return hashed_email

def search_params_track_args(params):
    return {
        'search_taxonomy_filter': params.taxonomy_filter.to_dict(),
        'search_contextual_filter': params.contextual_filter.to_dict(),
        'search_sample_integrity_warnings_filter': params.sample_integrity_warnings_filter.to_dict(),
    }
