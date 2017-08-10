import json
import logging
import re
from collections import defaultdict

from django.views.decorators.http import require_http_methods
from django.views.generic import TemplateView
from django.http import JsonResponse
from .otu import (
    SampleContext,
    TaxonomyOptions,
    OntologyInfo,
    SampleQuery)

logger = logging.getLogger("rainbow")
# See datatables.net serverSide documentation for details
ORDERING_PATTERN = re.compile(r'^order\[(\d+)\]\[(dir|column)\]$')
COLUMN_PATTERN = re.compile(r'^columns\[(\d+)\]\[(data|name|searchable|orderable)\]$')


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

    def display_name(s):
        """
        a bit of a bodge, just replace '_' with ' ' and upper-case
        drop _id if it's there
        """
        if s.endswith('_id'):
            s = s[:-3]
        return ' '.join(((t[0].upper() + t[1:]) for t in s.split('_')))

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

    column_definitions = _extract_column_definitions(request)
    ordering = _extract_ordering(request)

    otu_query = json.loads(request.POST['otu_query'])
    taxonomy_filter = clean_taxonomy_filter(otu_query['taxonomy_filters'])

    query = SampleQuery()
    subq = query.build_taxonomy_query(taxonomy_filter)
    q = query.build_contextual_query(subq)
    size = q.count()

    results = q.limit(length).offset(start).all()

    res = {
        'draw': draw,
        'data': [{"bpa_id": t} for (t,) in results],
        'recordsTotal': size,
        'recordsFiltered': size,
    }
    return JsonResponse(res)
