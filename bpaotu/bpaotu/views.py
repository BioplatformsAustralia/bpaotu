from django.views.generic import TemplateView


class OTUSearch(TemplateView):
    template_name = 'bpaotu/search_results.html'
