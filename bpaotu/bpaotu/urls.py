from django.conf.urls import url
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from . import views

admin.autodiscover()

urlpatterns = [
    url(r'^private/api/v1/config$', views.api_config, name="api_config"),
    url(r'^private/api/v1/cookie_consent_accepted$', views.cookie_consent_accepted, name="cookie_consent_accepted"),
    url(r'^private/api/v1/cookie_consent_declined$', views.cookie_consent_declined, name="cookie_consent_declined"),
    url(r'^private/api/v1/reference-data-options$', views.reference_data_options, name="reference_data_options"),
    url(r'^private/api/v1/trait-options$', views.trait_options, name="trait_options"),
    url(r'^private/api/v1/taxonomy-options$', views.taxonomy_options, name="taxonomy_options"),
    url(r'^private/api/v1/contextual-fields$', views.contextual_fields, name="contextual_fields"),
    url(r'^private/api/v1/contextual-graph-fields$', views.contextual_graph_fields, name="contextual_graph_fields"),
    url(r'^private/api/v1/taxonomy-graph-fields$', views.taxonomy_graph_fields, name="taxonomy_graph_fields"),
    url(r'^private/api/v1/nondenoised-request$', views.nondenoised_request, name="nondenoised_request"),
    url(r'^private/api/v1/krona-request$', views.krona_request, name="krona_request"),
    url(r'^private/api/v1/taxonomy-search$', views.taxonomy_search, name="taxonomy_search"),
    url(r'^private/api/v1/search$', views.otu_search, name="otu_search"),
    url(r'^private/api/v1/search-sample-sites$', views.otu_search_sample_sites, name="otu_search_sample_sites"),
    url(r'^private/api/v1/search-sample-sites-comparison$', views.otu_search_sample_sites_comparison, name="otu_search_sample_sites_comparison"),
    url(r'^private/api/v1/search-blast-otus$', views.otu_search_blast_otus, name="otu_search_blast_otus"),
    url(r'^private/api/v1/submit_to_galaxy$', views.submit_to_galaxy, name="submit_to_galaxy"),
    url(
        r'^private/api/v1/execute_workflow_on_galaxy$',
        views.execute_workflow_on_galaxy,
        name="execute_workflow_on_galaxy"),
    url(r'^private/api/v1/galaxy_submission$', views.galaxy_submission, name="galaxy_submission"),
    url(r'^private/api/v1/submit_blast$', views.submit_blast, name="submit_blast"),
    url(r'^private/api/v1/blast_submission$', views.blast_submission, name="blast_submission"),
    url(r'^private/api/v1/submit_comparison$', views.submit_comparison, name="submit_comparison"),
    url(r'^private/api/v1/cancel_comparison$', views.cancel_comparison, name="cancel_comparison"),
    url(r'^private/api/v1/comparison_submission$', views.comparison_submission, name="comparison_submission"),
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
        r'^ingest/download$',
        views.otu_log_download,
        name="otu_log_download"),
    url(
        r'^private/api/v1/required_table_headers/$',
        views.required_table_headers,
        name="required_table_headers"),
    url(
        r'^private/api/v1/contextual_schema_definition/$',
        views.contextual_schema_definition,
        name="contextual_schema_definition"),
    url(
        r'^private/csv-export/$',
        views.contextual_csv_download_endpoint,
        name="contextual_csv_download_endpoint"),
    url(
        r'^private/site-image-thumbnail/(?P<package_id>[\w-]+)/(?P<resource_id>[\w-]+)/$',
        views.site_image_thumbnail,
        name="site_image_thumbnail"),
    url(
        r'^private/metagenome-request$',
        views.metagenome_request,
        name="metagenome_request"),
    url(
        r'^private/metagenome-search$',
        views.metagenome_search,
        name="metagenome_search"),


] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
