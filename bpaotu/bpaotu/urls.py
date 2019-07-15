from django.conf.urls import url
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.views import serve as static_serve
from . import views

admin.autodiscover()

urlpatterns = [
    url(r'^$', static_serve, kwargs={
            'path': 'index.html', 'document_root': settings.STATIC_ROOT}),
    url(r'^map$', static_serve, kwargs={
            'path': 'index.html', 'document_root': settings.STATIC_ROOT}),
    url(r'^contextual$', static_serve, kwargs={
            'path': 'index.html', 'document_root': settings.STATIC_ROOT}),

    url(r'^private/api/v1/config$', views.api_config, name="api_config"),
    url(r'^private/api/v1/amplicon-options$', views.amplicon_options, name="amplicon_options"),
    url(r'^private/api/v1/taxonomy-options$', views.taxonomy_options, name="taxonomy_options"),
    url(r'^private/api/v1/contextual-fields$', views.contextual_fields, name="contextual_fields"),
    url(r'^private/api/v1/search$', views.otu_search, name="otu_search"),
    url(r'^private/api/v1/search-sample-sites$', views.otu_search_sample_sites, name="otu_search_sample_sites"),
    url(r'^private/api/v1/submit_to_galaxy$', views.submit_to_galaxy, name="submit_to_galaxy"),
    url(
        r'^private/api/v1/execute_workflow_on_galaxy$',
        views.execute_workflow_on_galaxy,
        name="execute_workflow_on_galaxy"),
    url(r'^private/api/v1/galaxy_submission$', views.galaxy_submission, name="galaxy_submission"),
    url(r'^private/api/v1/submit_blast$', views.submit_blast, name="submit_blast"),
    url(r'^private/api/v1/blast_submission$', views.blast_submission, name="blast_submission"),
    url(r'^private/api/v1/export$', views.otu_export, name="otu_export"),
    url(r'^private/api/v1/export_biom$', views.otu_biom_export, name="otu_biom_export"),
    url(
        r'^private/api/v1/user/check_permissions$',
        views.dev_only_ckan_check_permissions,
        name="dev_only_ckan_check_permissions"),
    url(
        r'^ingest/$',
        views.otu_log,
        name="otu_log"),
    url(
        r'^private/api/v1/required_table_headers/$',
        views.required_table_headers,
        name="required_table_headers"),
    url(
        r'^private/csv-export/$',
        views.contextual_csv_download_endpoint,
        name="contextual_csv_download_endpoint"),
    url(
        r'^private/site-image-thumbnail/(?P<package_id>[\w-]+)/(?P<resource_id>[\w-]+)/$',
        views.site_image_thumbnail,
        name="site_image_thumbnail"),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
