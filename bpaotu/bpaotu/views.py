import json
import logging
from collections import defaultdict

from django.views.decorators.http import require_http_methods
from django.views.generic import TemplateView
from django.http import JsonResponse
from .otu import (
    SampleContext,
    TaxonomyOptions,
    OntologyInfo)


logger = logging.getLogger("rainbow")


class OTUSearch(TemplateView):
    template_name = 'bpaotu/search_results.html'


@require_http_methods(["GET"])
def taxonomy_options(request):
    """
    private API: given taxonomy constraints, return the possible options
    """
    def int_if_not_already_none(v):
        if v is None or v == '':
            return None
        return int(v)

    selected = list(map(
        int_if_not_already_none,
        json.loads(request.GET['selected'])))
    options = TaxonomyOptions()
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


# technically we should be using GET, but the specification
# of the query (plus the datatables params) is large: so we
# avoid the issues of long URLs by simply POSTing the query
@require_http_methods(["POST"])
def otu_search(request):
    """
    private API: return the available fields, and their types, so that
    the contextual filtering UI can be built
    """
    logger.critical(request.POST)
    logger.critical(request.body)
    return JsonResponse({
    })