import json
import logging

from django.views.decorators.http import require_http_methods
from django.views.generic import TemplateView
from django.http import JsonResponse, HttpResponseBadRequest
from .otu import TaxonomyOptions


logger = logging.getLogger("rainbow")


class OTUSearch(TemplateView):
    template_name = 'bpaotu/search_results.html'


@require_http_methods(["GET"])
def taxonomy_options(request):
    """
    private API: given taxonomy constraints, return the possible options
    """
    if not request.is_ajax():
        return HttpResponseBadRequest()

    def int_if_not_already_none(v):
        if v is None or v == '':
            return None
        return int(v)

    selected = list(map(
        int_if_not_already_none,
        json.loads(request.GET['selected'])))
    logger.critical(selected)
    options = TaxonomyOptions()
    possibilities = options.possibilities(selected)
    logger.critical(possibilities)
    return JsonResponse({
        'possibilities': possibilities
    })
