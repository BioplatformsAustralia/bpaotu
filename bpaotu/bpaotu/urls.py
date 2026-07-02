from django.urls import include, re_path
from django.conf import settings
from django.conf.urls.static import static
from . import views

from bpaotu.auth_app.views import dev_only_oauth_check_auth, dev_only_oauth_user_info

urlpatterns = [
    # Auth endpoints
    re_path(r'^oidc/', include('bpaotu.auth_app.urls')),
    
    # API endpoints
    re_path(r'^private/api/v1/config$', views.api_config, name="api_config"),
    re_path(r'^private/api/v1/cookie_consent_accepted$', views.cookie_consent_accepted, name="cookie_consent_accepted"),
    re_path(r'^private/api/v1/cookie_consent_declined$', views.cookie_consent_declined, name="cookie_consent_declined"),
    re_path(r'^private/api/v1/reference-data-options$', views.reference_data_options, name="reference_data_options"),
    re_path(r'^private/api/v1/trait-options$', views.trait_options, name="trait_options"),
    re_path(r'^private/api/v1/taxonomy-options$', views.taxonomy_options, name="taxonomy_options"),
    re_path(r'^private/api/v1/contextual-fields$', views.contextual_fields, name="contextual_fields"),
    re_path(r'^private/api/v1/contextual-graph-fields$', views.contextual_graph_fields, name="contextual_graph_fields"),
    re_path(r'^private/api/v1/taxonomy-graph-fields$', views.taxonomy_graph_fields, name="taxonomy_graph_fields"),
    re_path(r'^private/api/v1/taxonomy-search$', views.taxonomy_search, name="taxonomy_search"),
    re_path(r'^private/api/v1/mags$', views.mags, name="mags"),
    re_path(r'^private/api/v1/mags_sample_count$', views.mags_sample_count, name="mags_sample_count"),
    re_path(r'^private/api/v1/krona-request$', views.krona_request, name="krona_request"),
    re_path(r'^private/api/v1/search$', views.otu_search, name="otu_search"),
    re_path(r'^private/api/v1/search-sample-sites$', views.otu_search_sample_sites, name="otu_search_sample_sites"),
    re_path(r'^private/api/v1/search-blast-otus$', views.otu_search_blast_otus, name="otu_search_blast_otus"),
    re_path(r'^private/api/v1/submit_to_galaxy$', views.submit_to_galaxy, name="submit_to_galaxy"),
    re_path(
        r'^private/api/v1/execute_workflow_on_galaxy$',
        views.execute_workflow_on_galaxy,
        name="execute_workflow_on_galaxy"),
    re_path(r'^private/api/v1/galaxy_submission$', views.galaxy_submission, name="galaxy_submission"),
    re_path(r'^private/api/v1/submit_blast$', views.submit_blast, name="submit_blast"),
    re_path(r'^private/api/v1/cancel_blast$', views.cancel_blast, name="cancel_blast"),
    re_path(r'^private/api/v1/blast_submission$', views.blast_submission, name="blast_submission"),
    re_path(r'^private/api/v1/submit_comparison$', views.submit_comparison, name="submit_comparison"),
    re_path(r'^private/api/v1/cancel_comparison$', views.cancel_comparison, name="cancel_comparison"),
    re_path(r'^private/api/v1/clear_comparison$', views.clear_comparison, name="clear_comparison"),
    re_path(r'^private/api/v1/comparison_submission$', views.comparison_submission, name="comparison_submission"),
    re_path(r'^private/api/v1/comparison_download_distance_matrices$', views.comparison_download_distance_matrices, name="comparison_download_distance_matrices"),
    re_path(r'^private/api/v1/submit_otuexport$', views.submit_otuexport, name="submit_otuexport"),
    re_path(r'^private/api/v1/cancel_otuexport$', views.cancel_otuexport, name="cancel_otuexport"),
    re_path(r'^private/api/v1/otuexport_submission$', views.otuexport_submission, name="otuexport_submission"),
    re_path(r'^private/api/v1/export$', views.otu_export, name="otu_export"),
    re_path(r'^private/api/v1/export_biom$', views.otu_biom_export, name="otu_biom_export"),
    re_path(r'^private/api/v1/user/check_auth$', dev_only_oauth_check_auth, name="dev_only_oauth_check_auth"),
    re_path(r'^private/api/v1/user/user_info$', dev_only_oauth_user_info, name="dev_only_oauth_user_info"),
    re_path(
        r'^ingest/$',
        views.otu_log,
        name="otu_log"),
    re_path(
        r'^ingest/download$',
        views.otu_log_download,
        name="otu_log_download"),
    re_path(
        r'^private/api/v1/required_table_headers/$',
        views.required_table_headers,
        name="required_table_headers"),
    re_path(
        r'^private/csv-export/$',
        views.contextual_csv_download_endpoint,
        name="contextual_csv_download_endpoint"),
    re_path(
        r'^private/site-image-thumbnail/(?P<package_id>[\w-]+)/(?P<resource_id>[\w-]+)/$',
        views.site_image_thumbnail,
        name="site_image_thumbnail"),
    re_path(
        r'^private/metagenome-request$',
        views.metagenome_request,
        name="metagenome_request"),
    re_path(
        r'^private/metagenome-search$',
        views.metagenome_search,
        name="metagenome_search"),
    re_path(
        # this can't start with mags otherwise react router will catch it
        r'^ext/mags/download$',
        views.download_mag,
        name='download_mag'
    ),

] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
