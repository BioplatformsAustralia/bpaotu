import re
import csv
import json
import logging
import zipstream
import datetime
from collections import defaultdict
import csv
import io
import hmac
import time
import os

from django.conf import settings
from django.views.decorators.http import require_http_methods
from django.views.generic import TemplateView
from django.http import JsonResponse, StreamingHttpResponse, HttpResponse, HttpResponseForbidden
from io import StringIO
import traceback
from .importer import DataImporter
from .otu import (
    Environment,
    OTUKingdom,
    SampleContext,
    OTUAmplicon)
from .query import (
    OTUQueryParams,
    TaxonomyOptions,
    OntologyInfo,
    SampleQuery,
    ContextualFilter,
    ContextualFilterTermDate,
    ContextualFilterTermFloat,
    ContextualFilterTermOntology,
    ContextualFilterTermSampleID,
    ContextualFilterTermString,
    get_sample_ids)
from django.template import loader
from .models import (
    ImportFileLog,
    ImportOntologyLog,
    ImportSamplesMissingMetadataLog)

from django.views.decorators.csrf import csrf_exempt

import logging
logger = logging.getLogger("rainbow")


# See datatables.net serverSide documentation for details
ORDERING_PATTERN = re.compile(r'^order\[(\d+)\]\[(dir|column)\]$')
COLUMN_PATTERN = re.compile(r'^columns\[(\d+)\]\[(data|name|searchable|orderable)\]$')


def make_environment_lookup():
    with OntologyInfo() as info:
        return dict(info.get_values(Environment))


def format_bpa_id(int_id):
    return '102.100.100/%d' % int_id


def display_name(field_name):
    """
    a bit of a bodge, just replace '_' with ' ' and upper-case
    drop _id if it's there
    """
    if field_name.endswith('_id'):
        field_name = field_name[:-3]
    return ' '.join(((t[0].upper() + t[1:]) for t in field_name.split('_')))


class OTUSearch(TemplateView):
    template_name = 'bpaotu/search.html'
    ckan_base_url = settings.CKAN_SERVERS[0]['base_url']

    def get_context_data(self, **kwargs):
        context = super(OTUSearch, self).get_context_data(**kwargs)
        context['ckan_base_url'] = settings.CKAN_SERVERS[0]['base_url']
        return context


def int_if_not_already_none(v):
    if v is None or v == '':
        return None
    v = str(v)  # let's not let anything odd through
    return int(v)


def clean_amplicon_filter(v):
    return int_if_not_already_none(v)


def clean_environment_filter(v):
    return int_if_not_already_none(v)


def clean_taxonomy_filter(state_vector):
    """
    take a taxonomy filter (a list of phylum, kingdom, ...) and clean it
    so that it is a simple list of ints or None of the correct length.
    """

    assert(len(state_vector) == len(TaxonomyOptions.hierarchy))
    return list(map(
        int_if_not_already_none,
        state_vector))


@require_http_methods(["GET"])
def amplicon_options(request):
    """
    private API: return the possible amplicons
    """
    try:
        _otu_endpoint_verification(request.GET['token'])
    except:
        return HttpResponseForbidden('Please log into CKAN and ensure you are authorised to access the AusMicro data.')

    with OntologyInfo() as options:
        vals = options.get_values(OTUAmplicon)
    return JsonResponse({
        'possibilities': vals
    })


@require_http_methods(["GET"])
def taxonomy_options(request):
    """
    private API: given taxonomy constraints, return the possible options
    """
    try:
        _otu_endpoint_verification(request.GET['token'])
    except:
        return HttpResponseForbidden('Please log into CKAN and ensure you are authorised to access the AusMicro data.')

    with TaxonomyOptions() as options:
        amplicon = clean_amplicon_filter(request.GET['amplicon'])
        selected = clean_taxonomy_filter(json.loads(request.GET['selected']))
        possibilities = options.possibilities(amplicon, selected)
    return JsonResponse({
        'possibilities': possibilities
    })


@require_http_methods(["GET"])
def contextual_fields(request):
    """
    private API: return the available fields, and their types, so that
    the contextual filtering UI can be built
    """
    try:
        _otu_endpoint_verification(request.GET['token'])
    except:
        return HttpResponseForbidden('Please log into CKAN and ensure you are authorised to access the AusMicro data.')

    fields_by_type = defaultdict(list)

    classifications = DataImporter.classify_fields(make_environment_lookup())

    ontology_classes = {}

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
        fields_by_type[ty].append((column.name, getattr(column, 'units', None)))

    def make_defn(typ, name, units, **kwargs):
        environment = classifications.get(name)
        r = kwargs.copy()
        r.update({
            'type': typ,
            'name': name,
            'environment': environment
        })
        if units:
            r['units'] = units
        return r

    definitions = [make_defn('sample_id', 'id', None, display_name='Sample ID', values=list(sorted(get_sample_ids())))]
    for field_name, units in fields_by_type['DATE']:
        definitions.append(make_defn('date', field_name, units))
    for field_name, units in fields_by_type['FLOAT']:
        definitions.append(make_defn('float', field_name, units))
    for field_name, units in fields_by_type['CITEXT']:
        definitions.append(make_defn('string', field_name, units))
    with OntologyInfo() as info:
        for field_name, units in fields_by_type['_ontology']:
            ontology_class = ontology_classes[field_name]
            definitions.append(make_defn('ontology', field_name, units, values=info.get_values(ontology_class)))
    for defn in definitions:
        if 'display_name' not in defn:
            defn['display_name'] = display_name(defn['name'])

    definitions.sort(key=lambda x: x['display_name'])

    return JsonResponse({
        'definitions': definitions
    })


def param_to_filters(query_str):
    """
    take a JSON encoded query_str, validate, return any errors
    and the filter instances
    """

    def parse_date(s):
        try:
            return datetime.datetime.strptime(s, '%Y-%m-%d').date()
        except ValueError:
            return datetime.datetime.strptime(s, '%d/%m/%Y').date()

    def parse_float(s):
        try:
            return float(s)
        except ValueError:
            return None

    otu_query = json.loads(query_str)
    taxonomy_filter = clean_taxonomy_filter(otu_query['taxonomy_filters'])
    amplicon_filter = clean_amplicon_filter(otu_query['amplicon_filter'])

    context_spec = otu_query['contextual_filters']
    contextual_filter = ContextualFilter(context_spec['mode'], context_spec['environment'])

    errors = []

    for filter_spec in context_spec['filters']:
        field_name = filter_spec['field']
        if field_name not in SampleContext.__table__.columns:
            errors.append("Please select a contextual data field to filter upon.")
            continue
        column = SampleContext.__table__.columns[field_name]
        typ = str(column.type)
        try:
            if column.name == 'id':
                contextual_filter.add_term(ContextualFilterTermSampleID(field_name, [int(t) for t in filter_spec['is']]))
            elif hasattr(column, 'ontology_class'):
                contextual_filter.add_term(
                    ContextualFilterTermOntology(field_name, int(filter_spec['is'])))
            elif typ == 'DATE':
                contextual_filter.add_term(
                    ContextualFilterTermDate(field_name, parse_date(filter_spec['from']), parse_date(filter_spec['to'])))
            elif typ == 'FLOAT':
                contextual_filter.add_term(
                    ContextualFilterTermFloat(field_name, parse_float(filter_spec['from']), parse_float(filter_spec['to'])))
            elif typ == 'CITEXT':
                contextual_filter.add_term(
                    ContextualFilterTermString(field_name, str(filter_spec['contains'])))
            else:
                raise ValueError("invalid filter term type: %s", typ)
        except Exception as ex:
            errors.append("Invalid value provided for contextual field `%s'" % field_name)
            logger.critical("Exception parsing field: `%s':\n%s" % (field_name, traceback.format_exc()))

    return (OTUQueryParams(
        amplicon_filter=amplicon_filter,
        contextual_filter=contextual_filter,
        taxonomy_filter=taxonomy_filter), errors)


def param_to_filters_without_checks(query_str):
    otu_query = json.loads(query_str)
    taxonomy_filter = clean_taxonomy_filter(otu_query['taxonomy_filters'])
    amplicon_filter = clean_amplicon_filter(otu_query['amplicon_filter'])

    context_spec = otu_query['contextual_filters']
    contextual_filter = ContextualFilter(context_spec['mode'], context_spec['environment'])

    errors = []

    return (OTUQueryParams(
        amplicon_filter=amplicon_filter,
        contextual_filter=contextual_filter,
        taxonomy_filter=taxonomy_filter), errors)


@require_http_methods(["POST"])
def required_table_headers(request):
    """
    This is a modification of the otu_search method to populate the DataTable
    """

    def _int_get_param(param_name):
        param = request.POST.get(param_name)
        try:
            return int(param) if param is not None else None
        except ValueError:
            return None

    draw = _int_get_param('draw')
    start = _int_get_param('start')
    length = _int_get_param('length')

    search_terms = json.loads(request.POST['otu_query'])
    contextual_terms = search_terms['contextual_filters']['filters']

    required_headers = []
    for elem in contextual_terms:
        required_headers.append(elem['field'])

    results = []
    result_count = len(results)

    environment_lookup = make_environment_lookup()

    params, errors = param_to_filters_without_checks(request.POST['otu_query'])
    with SampleQuery(params) as query:
        results = query.matching_sample_headers(required_headers)

    result_count = len(results)
    results = results[start:start + length]

    def get_environment(environment_id):
        if environment_id is None:
            return None
        return environment_lookup[environment_id]

    data = []
    for t in results:
        count = 2
        data_dict = {"bpa_id": t[0], "environment": get_environment(t[1])}

        for rh in required_headers:
            data_dict[rh] = t[count]
            count = count + 1

        data.append(data_dict)

    res = {
        'draw': draw,
    }
    res.update({
        'data': data,
        'recordsTotal': result_count,
        'recordsFiltered': result_count,
    })
    return JsonResponse(res)


# technically we should be using GET, but the specification
# of the query (plus the datatables params) is large: so we
# avoid the issues of long URLs by simply POSTing the query
@csrf_exempt
@require_http_methods(["POST"])
def otu_search(request):
    """
    private API: return the available fields, and their types, so that
    the contextual filtering UI can be built
    """
    try:
        _otu_endpoint_verification(request.POST['token'])
    except:
        return HttpResponseForbidden('Please log into CKAN and ensure you are authorised to access the AusMicro data.')

    def _int_get_param(param_name):
        param = request.POST.get(param_name)
        try:
            return int(param) if param is not None else None
        except ValueError:
            return None

    draw = _int_get_param('draw')
    start = _int_get_param('start')
    length = _int_get_param('length')

    environment_lookup = make_environment_lookup()

    params, errors = param_to_filters(request.POST['otu_query'])
    with SampleQuery(params) as query:
        results = query.matching_sample_ids_and_environment()
    result_count = len(results)
    results = results[start:start + length]

    def get_environment(environment_id):
        if environment_id is None:
            return None
        return environment_lookup[environment_id]

    res = {
        'draw': draw,
    }
    if errors:
        res.update({
            'errors': [str(t) for t in errors],
            'data': [],
            'recordsTotal': 0,
            'recordsFiltered': 0,
        })
    else:
        res.update({
            'data': [{"bpa_id": t[0], "environment": get_environment(t[1])} for t in results],
            'recordsTotal': result_count,
            'recordsFiltered': result_count,
        })
    return JsonResponse(res)


def contextual_csv(samples):
    with OntologyInfo() as info:
        def make_ontology_export(ontology_cls):
            values = dict(info.get_values(ontology_cls))

            def __ontology_lookup(x):
                if x is None:
                    return ''
                return values[x]
            return __ontology_lookup

        def str_none_blank(v):
            if v is None:
                return ''
            return str(v)

        csv_fd = StringIO()
        w = csv.writer(csv_fd)
        fields = []
        heading = []
        write_fns = []
        for column in SampleContext.__table__.columns:
            fields.append(column.name)
            units = getattr(column, 'units', None)
            if column.name == 'id':
                heading.append('BPA ID')
            else:
                title = display_name(column.name)
                if units:
                    title += ' [%s]' % units
                heading.append(title)

            if column.name == 'id':
                write_fns.append(format_bpa_id)
            elif hasattr(column, "ontology_class"):
                write_fns.append(make_ontology_export(column.ontology_class))
            else:
                write_fns.append(str_none_blank)
        w.writerow(heading)
        for sample in samples:
            w.writerow(f(getattr(sample, field)) for (field, f) in zip(fields, write_fns))
        return csv_fd.getvalue()


@require_http_methods(["GET"])
def otu_export(request):
    """
    this view takes:
     - contextual filters
     - taxonomic filters
    produces a Zip file containing:
      - an CSV of all the contextual data samples matching the query
      - an CSV of all the OTUs matching the query, with counts against Sample IDs
    """
    try:
        _otu_endpoint_verification(request.GET['token'])
    except:
        return HttpResponseForbidden('Please log into CKAN and ensure you are authorised to access the AusMicro data.')

    def val_or_empty(obj):
        if obj is None:
            return ''
        return obj.value

    zf = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    params, errors = param_to_filters(request.GET['q'])
    with SampleQuery(params) as query:
        def sample_otu_csv_rows(kingdom_id):
            fd = StringIO()
            w = csv.writer(fd)
            w.writerow([
                'BPA ID',
                'OTU',
                'OTU Count',
                'Amplicon',
                'Kingdom',
                'Phylum',
                'Class',
                'Order',
                'Family',
                'Genus',
                'Species'])
            yield fd.getvalue().encode('utf8')
            fd.seek(0)
            fd.truncate(0)
            q = query.matching_sample_otus(kingdom_id)
            for i, (otu, sample_otu, sample_context) in enumerate(q.yield_per(50)):
                w.writerow([
                    format_bpa_id(sample_otu.sample_id),
                    otu.code,
                    sample_otu.count,
                    val_or_empty(otu.amplicon),
                    val_or_empty(otu.kingdom),
                    val_or_empty(otu.phylum),
                    val_or_empty(otu.klass),
                    val_or_empty(otu.order),
                    val_or_empty(otu.family),
                    val_or_empty(otu.genus),
                    val_or_empty(otu.species)])
                yield fd.getvalue().encode('utf8')
                fd.seek(0)
                fd.truncate(0)

        zf.writestr('contextual.csv', contextual_csv(query.matching_samples()).encode('utf8'))
        with OntologyInfo() as info:
            for kingdom_id, kingdom_label in info.get_values(OTUKingdom):
                if not query.has_matching_sample_otus(kingdom_id):
                    continue
                zf.write_iter('%s.csv' % (kingdom_label), sample_otu_csv_rows(kingdom_id))

    response = StreamingHttpResponse(zf, content_type='application/zip')
    filename = "BPASearchResultsExport.zip"
    response['Content-Disposition'] = 'attachment; filename="%s"' % filename
    return response


def otu_log(request):
    template = loader.get_template('bpaotu/otu_log.html')
    missing_sample_ids = []
    from .query import Session
    from .otu import (SampleContext, OTU, SampleOTU)
    for obj in ImportSamplesMissingMetadataLog.objects.all():
        missing_sample_ids += obj.samples_without_metadata
    session = Session()
    context = {
        'files': ImportFileLog.objects.all(),
        'ontology_errors': ImportOntologyLog.objects.all(),
        'missing_samples': ', '.join(sorted(missing_sample_ids)),
        'otu_count': session.query(OTU).count(),
        'sampleotu_count': session.query(SampleOTU).count(),
        'samplecontext_count': session.query(SampleContext).count(),
    }
    session.close()
    return HttpResponse(template.render(context, request))


@require_http_methods(["POST"])
def contextual_csv_download_endpoint(request):
    data = request.POST.get('otu_query')

    search_terms = json.loads(data)
    contextual_terms = search_terms['contextual_filters']['filters']

    required_headers = []
    for h in contextual_terms:
        required_headers.append(h['field'])

    params, errors = param_to_filters_without_checks(request.POST['otu_query'])
    with SampleQuery(params) as query:
        results = query.matching_sample_headers(required_headers)

    header = ['sample_bpa_id', 'bpa_project'] + required_headers

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
    response['Content-Disposition'] = "application/download; filename=table.csv"

    return response


def _otu_endpoint_verification(data):
    hash_portion = data.split('||')[0]
    data_portion = data.split('||')[1]

    json_data = json.loads(data_portion)

    timestamp = json_data['timestamp']
    organisations = json_data['organisations']

    secret_key = bytes(os.environ.get('BPAOTU_AUTH_SECRET_KEY'), encoding='utf-8')

    digest_maker = hmac.new(secret_key)
    digest_maker.update(data_portion.encode('utf8'))
    digest = digest_maker.hexdigest()

    SECS_IN_DAY = 60*60*24

    if digest == hash_portion:
        if time.time() - timestamp < SECS_IN_DAY:
            if 'australian-microbiome' in organisations:
                return True
            else:
                return HttpResponseForbidden("You do not have access to the Ausmicro data.")
        else:
            return HttpResponseForbidden("The timestamp is too old.")
    else:
        return HttpResponseForbidden("Secret key does not match.")


def tables(request):
    template = loader.get_template('bpaotu/tables.html')
    context = {}

    return HttpResponse(template.render(context, request))
