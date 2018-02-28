from django.conf.urls import url
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from . import views

admin.autodiscover()

urlpatterns = [
    url(r'^$', views.OTUSearch.as_view()),
    url(r'^(?P<project>base|marine-microbes)$', views.OTUSearch.as_view()),
    url(r'^private/api/v1/taxonomy-options$', views.taxonomy_options, name="taxonomy_options"),
    url(r'^private/api/v1/contextual-fields$', views.contextual_fields, name="contextual_fields"),
    url(r'^private/api/v1/search$', views.otu_search, name="otu_search"),
    url(r'^private/api/v1/export$', views.otu_export, name="otu_export"),
    url(r'^otu_log$', views.otu_log, name="otu_log"),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
