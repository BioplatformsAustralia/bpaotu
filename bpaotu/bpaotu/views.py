import re
import csv
import json
import logging
import zipstream
import datetime
from collections import defaultdict

from django.views.decorators.http import require_http_methods
from django.views.generic import TemplateView
from django.http import JsonResponse, StreamingHttpResponse
from io import StringIO
import traceback
from .otu import (
    OTUKingdom,
    SampleContext,
    OTU)
from .query import (
    TaxonomyOptions,
    OntologyInfo,
    SampleQuery,
    ContextualFilter,
    ContextualFilterTermDate,
    ContextualFilterTermFloat,
    ContextualFilterTermOntology,
    ContextualFilterTermString)

logger = logging.getLogger("rainbow")
# See datatables.net serverSide documentation for details
ORDERING_PATTERN = re.compile(r'^order\[(\d+)\]\[(dir|column)\]$')
COLUMN_PATTERN = re.compile(r'^columns\[(\d+)\]\[(data|name|searchable|orderable)\]$')


def display_name(field_name):
    """
    a bit of a bodge, just replace '_' with ' ' and upper-case
    drop _id if it's there
    """
    if field_name.endswith('_id'):
        field_name = field_name[:-3]
    return ' '.join(((t[0].upper() + t[1:]) for t in field_name.split('_')))


class OTUSearch(TemplateView):
    template_name = 'bpaotu/search_results.html'


def clean_taxonomy_filter(state_vector):
    """
    take a taxonomy filter (a list of phylum, kingdom, ...) and clean it
    so that it is a simple list of ints or None of the correct length.
    """
    def int_if_not_already_none(v):
        if v is None or v == '':
            return None
        return int(v)

    assert(len(state_vector) == len(TaxonomyOptions.hierarchy))
    return list(map(
        int_if_not_already_none,
        state_vector))


@require_http_methods(["GET"])
def taxonomy_options(request):
    """
    private API: given taxonomy constraints, return the possible options
    """
    options = TaxonomyOptions()
    selected = clean_taxonomy_filter(json.loads(request.GET['selected']))
    possibilities = options.possibilities(selected)
    return JsonResponse({
        'possibilities': possibilities
    })


@require_http_methods(["GET"])
def contextual_fields(request):
    """
    private API: return the available fields, and their types, so that
    the contextual filtering UI can be built
    """
    fields_by_type = defaultdict(list)

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
        fields_by_type[ty].append(column.name)

    definitions = []
    for field_name in fields_by_type['DATE']:
        definitions.append({
            'type': 'date',
            'name': field_name
        })
    for field_name in fields_by_type['FLOAT']:
        definitions.append({
            'type': 'float',
            'name': field_name
        })
    for field_name in fields_by_type['VARCHAR']:
        definitions.append({
            'type': 'string',
            'name': field_name
        })
    info = OntologyInfo()
    for field_name in fields_by_type['_ontology']:
        ontology_class = ontology_classes[field_name]
        definitions.append({
            'type': 'ontology',
            'name': field_name,
            'values': info.get_values(ontology_class)
        })
    for defn in definitions:
        defn['display_name'] = display_name(defn['name'])
    definitions.sort(key=lambda x: x['name'])

    return JsonResponse({
        'definitions': definitions
    })


def _extract_column_definitions(request):
    columns = []
    for k in request.GET:
        match = COLUMN_PATTERN.match(k)
        if match is not None:
            index = int(match.groups()[0])
            attr = match.groups()[1]
            for i in range(index - len(columns) + 1):
                columns.append({})
            columns[index][attr] = request.GET.get(k)
    return columns


def _extract_ordering(request):
    ordering = []
    for k in request.GET:
        match = ORDERING_PATTERN.match(k)
        if match is not None:
            index = int(match.groups()[0])
            attr = match.groups()[1]
            for i in range(index - len(ordering) + 1):
                ordering.append({})
            value = request.GET.get(k)
            if attr == 'column':
                value = int(value)
            ordering[index][attr] = value
    return ordering


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

    context_spec = otu_query['contextual_filters']
    contextual_filter = ContextualFilter(context_spec['mode'])

    errors = []

    for filter_spec in context_spec['filters']:
        field_name = filter_spec['field']
        column = SampleContext.__table__.columns[field_name]
        typ = str(column.type)
        try:
            if hasattr(column, 'ontology_class'):
                contextual_filter.add_term(
                    ContextualFilterTermOntology(field_name, int(filter_spec['is'])))
            elif typ == 'DATE':
                contextual_filter.add_term(
                    ContextualFilterTermDate(field_name, parse_date(filter_spec['from']), parse_date(filter_spec['to'])))
            elif typ == 'FLOAT':
                contextual_filter.add_term(
                    ContextualFilterTermFloat(field_name, parse_float(filter_spec['from']), parse_float(filter_spec['to'])))
            elif typ == 'VARCHAR':
                contextual_filter.add_term(
                    ContextualFilterTermString(field_name, str(filter_spec['contains'])))
            else:
                raise ValueError("invalid filter term type")
        except Exception as ex:
            errors.append("Invalid value provided for contextual field `%s'" % field_name)
            logger.critical("Exception parsing field: `%s':\n%s" % (field_name, traceback.format_exc()))

    return contextual_filter, taxonomy_filter, errors


# technically we should be using GET, but the specification
# of the query (plus the datatables params) is large: so we
# avoid the issues of long URLs by simply POSTing the query
@require_http_methods(["POST"])
def otu_search(request):
    """
    private API: return the available fields, and their types, so that
    the contextual filtering UI can be built
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

    contextual_filter, taxonomy_filter, errors = param_to_filters(request.POST['otu_query'])
    query = SampleQuery(contextual_filter, taxonomy_filter)
    results = query.matching_sample_ids()
    result_count = len(results)
    results = results[start:start + length]

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
            'data': [{"bpa_id": t} for t in results],
            'recordsTotal': result_count,
            'recordsFiltered': result_count,
        })
    return JsonResponse(res)


def contextual_csv(samples):
    info = OntologyInfo()

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
        if column.name == 'id':
            heading.append('BPA ID')
        else:
            heading.append(display_name(column.name))
        if hasattr(column, "ontology_class"):
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

    def val_or_empty(obj):
        if obj is None:
            return ''
        return obj.value

    def sample_otu_csv_rows(kingdom_id):
        fd = StringIO()
        w = csv.writer(fd)
        w.writerow([
            'BPA ID',
            'OTU',
            'OTU Count',
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
        q = query.matching_sample_otus()
        q = q.filter(OTU.kingdom_id == kingdom_id)
        for i, (otu, sample_otu, sample_context) in enumerate(q.yield_per(50)):
            w.writerow([
                sample_otu.sample_id,
                sample_otu.otu_id,
                sample_otu.count,
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

    contextual_filter, taxonomy_filter, errors = param_to_filters(request.GET['q'])
    query = SampleQuery(contextual_filter, taxonomy_filter)

    zf = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    zf.writestr('README.txt', 'hello world'.encode('utf8'))
    zf.writestr('contextual.csv', contextual_csv(query.matching_samples()).encode('utf8'))

    info = OntologyInfo()
    for kingdom_id, kingdom_label in info.get_values(OTUKingdom):
        zf.write_iter('%s.csv' % (kingdom_label), sample_otu_csv_rows(kingdom_id))
    response = StreamingHttpResponse(zf, content_type='application/zip')
    filename = "BPASearchResultsExport.zip"
    response['Content-Disposition'] = 'attachment; filename="%s"' % filename
    return response
