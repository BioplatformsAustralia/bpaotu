import json
from django.views.generic import TemplateView
from django.http import JsonResponse


class OTUSearch(TemplateView):
    template_name = 'bpaotu/search_results.html'


def taxonomy_options(request):
    """
    private API: given taxonomy constraints, return the possible options
    """
    result = {
        'yes': 'yep'
    }
    return JsonResponse(result)
