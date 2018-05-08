from django.conf.urls import url
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from . import views

admin.autodiscover()

urlpatterns = [
    url(r'^$', views.OTUSearch.as_view()),
    url(r'^private/api/v1/amplicon-options$', views.amplicon_options, name="amplicon_options"),
    url(r'^private/api/v1/taxonomy-options$', views.taxonomy_options, name="taxonomy_options"),
    url(r'^private/api/v1/contextual-fields$', views.contextual_fields, name="contextual_fields"),
    url(r'^private/api/v1/search$', views.otu_search, name="otu_search"),
    url(r'^private/api/v1/search-sample-sites$', views.otu_search_sample_sites, name="otu_search_sample_sites"),
    url(r'^private/api/v1/export$', views.otu_export, name="otu_export"),
    url(r'^private/api/v1/export_biom$', views.otu_biom_export, name="otu_biom_export"),
    url(r'^ingest/$', views.otu_log, name="otu_log"),                                                                               # Display ingest names that do not match list.
    url(r'^tables/$', views.tables, name="tables"),                                                                                 # Custom datatables columns.
    url(r'^private/api/v1/required_table_headers/$', views.required_table_headers, name="required_table_headers"),                  # Custom datatables columns.
    url(r'^contextual_csv_download_endpoint/$', views.contextual_csv_download_endpoint, name="contextual_csv_download_endpoint"),   # Custom datatables columns.
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
