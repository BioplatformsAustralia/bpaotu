import json
import logging
from collections import defaultdict

from django.views.decorators.http import require_http_methods
from django.views.generic import TemplateView
from django.http import JsonResponse
from .otu import TaxonomyOptions
from .otu import SampleContext


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

    # group together columns by their type. note special case
    # handling for our ontology linkage columns
    for column in SampleContext.__table__.columns:
        if column.name == 'id':
            continue
        if hasattr(column, "ontology_name"):
            ty = '_ontology'
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
    for field_name in fields_by_type['_ontology']:
        definitions.append({
            'type': 'ontology',
            'name': field_name,
            'values': []
        })
    definitions.sort(key=lambda x: x['name'])

    return JsonResponse({
        'definitions': definitions
    })
