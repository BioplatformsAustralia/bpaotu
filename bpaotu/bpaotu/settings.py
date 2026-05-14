# -*- coding: utf-8 -*-/MAIL
# Django settings for Bioplatforms OTU project.

import os
from ccg_django_utils.conf import EnvConfig

from .settings_shared import *

def env_bool(value, default=False):
    if value is None:
        return default
    return str(value).lower() in ("1", "true", "yes", "on")

# a directory that will be writable by the webserver, for storing various files...
WRITABLE_DIRECTORY = env.get("writable_directory", "/tmp") # FIXME used?


# django-secure
SECURE_SSL_HOST = False # handled by nginx
SECURE_SSL_REDIRECT = False # handled by nginx
SECURE_CONTENT_TYPE_NOSNIFF = env.get("secure_content_type_nosniff", PRODUCTION)
SECURE_BROWSER_XSS_FILTER = env.get("secure_browser_xss_filter", PRODUCTION)
SECURE_HSTS_SECONDS = env.get("secure_hsts_seconds", 10)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.get("secure_hsts_include_subdomains", PRODUCTION)
SECURE_REDIRECT_EXEMPT = env.getlist("secure_redirect_exempt", [])
X_FRAME_OPTIONS = env.get("x_frame_options", 'DENY')
ADMINS = [("alert", env.get("alert_email", "root@localhost"))]
MANAGERS = ADMINS

# CSRF and host settings
# ALLOWED_HOSTS should be set to the actual hostnames in production, but we allow it to be overridden by env var for development and testing.
# The default is to allow all hosts, which is not ideal, but is better than the alternative of having to set an env var just to get the development environment working.
ALLOWED_HOSTS = env.getlist("allowed_hosts", ["*"])

# Note: must include scheme and port if not using default ports, and must match the actual host header sent by the client
# (i.e. the hostname used to access the site in the browser) for CSRF protection to work.
# In production, this should be set to the actual hostname(s) used to access the site, but we allow it to be overridden by env var for development and testing.
CSRF_TRUSTED_ORIGINS = env.getlist("CSRF_TRUSTED_ORIGINS", [])

# Tell Django to trust the X-Forwarded-Proto header set by our nginx frontend when determining if the request is secure
# (i.e. was originally made over HTTPS).
# This is important for things like generating correct redirect URLs
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# This honours the X-Forwarded-Host header set by our nginx frontend when constructing redirect URLS
USE_X_FORWARDED_HOST = env.get("use_x_forwarded_host", True)


# Sessions

SESSION_COOKIE_AGE = env.get("session_cookie_age", 60 * 60)
SESSION_COOKIE_PATH = "/"
SESSION_SAVE_EVERY_REQUEST = env.get("session_save_every_request", True)
SESSION_COOKIE_HTTPONLY = env.get("session_cookie_httponly", True)

SESSION_COOKIE_NAME = env.get("session_cookie_name", "ccg_{0}".format(SCRIPT_NAME.replace("/", "")))
SESSION_COOKIE_DOMAIN = env.get("session_cookie_domain", "") or None
SESSION_COOKIE_SAMESITE = env.get("session_cookie_samesite", 'Lax')
SESSION_COOKIE_SECURE = env_bool(
    env.get("SESSION_COOKIE_SECURE", PRODUCTION),
    default=PRODUCTION,
)

CSRF_USE_SESSIONS = False
CSRF_COOKIE_SAMESITE = env.get("csrf_cookie_samesite", 'Lax')
CSRF_COOKIE_SECURE = env_bool(
    env.get("CSRF_COOKIE_SECURE", PRODUCTION),
    default=PRODUCTION,
)


print("SESSION_COOKIE_HTTPONLY", SESSION_COOKIE_HTTPONLY)
print("SESSION_COOKIE_SECURE", SESSION_COOKIE_SECURE)
print("SESSION_COOKIE_NAME", SESSION_COOKIE_NAME)
print("SESSION_COOKIE_DOMAIN", SESSION_COOKIE_DOMAIN)
print("SESSION_COOKIE_SAMESITE", SESSION_COOKIE_SAMESITE)
print("CSRF_COOKIE_SAMESITE", CSRF_COOKIE_SAMESITE)




REST_FRAMEWORK = {
    # Use Django's standard `django.contrib.auth` permissions,
    # or allow read-only access for unauthenticated users.
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly', ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'DEFAULT_FILTER_BACKENDS': ('rest_framework.filters.DjangoFilterBackend', ),
    'PAGINATE_BY': 10,
    'PAGINATE_BY_PARAM': 'page_size',
}



LANGUAGE_CODE = env.get("language_code", 'en-us')
USE_I18N = env.get("use_i18n", True)
USE_L10N = False
DATE_INPUT_FORMATS = ('%Y-%m-%d', '%d/%m/%Y', '%d/%m/%y', '%d %m %Y', '%d %m %y', '%d %b %Y')
DATE_FORMAT = "d-m-Y"
SHORT_DATE_FORMAT = "d/m/Y"

# used by maps when plotting sample location
GIS_SOURCE_RID = 4326 # FIXME GIS_* used?
GIS_TARGET_RID = 3857
GIS_CENTER = (134.0, -26.0)
GIS_POINT_ZOOM = 12
GIS_OPENLAYERS_URL = "https://cdnjs.cloudflare.com/ajax/libs/openlayers/2.13.1/OpenLayers.js"

SITE_ID = 1

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True



STATICFILES_DIRS = [
    # FIXME. This is almost certainly wrong, and should be handled by MEDIA_ROOT
    # and MEDIA_URL instead. In particular, `django-admin collectstatic` will
    # copy anything in BLAST_RESULTS_PATH to STATIC_ROOT during the docker
    # container startup, which is probably not what is intended, and even
    # requires a mkdir() in bpaotu.apps.BpaotuConfig() to prevent collectstatic
    # from crashing. It's probably here as an easy way to serve the blast output
    # during development without having to add a special case to urlpatterns.
    # See
    # https://docs.djangoproject.com/en/2.2/ref/contrib/staticfiles/#static-file-development-view
    # Since it's not obviously breaking anything in production, I'm leaving it
    # alone for now. (DH, Nov 2022)
    #
    # Oct 2025 Update:
    # Neither this nor BpaotuConfig seem to be creating the directory
    # on development when rebuilding containers (OTU_EXPORT_PATH not being created)
    BLAST_RESULTS_PATH,
    OTU_EXPORT_PATH,
]

SESSION_ENGINE = "django.contrib.sessions.backends.cache"

MIDDLEWARE = (
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.locale.LocaleMiddleware',
)

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(WEBAPP_ROOT, 'bpaotu', 'templates')],
        "APP_DIRS": False,
        "OPTIONS": {
            "context_processors": [
                "django.contrib.auth.context_processors.auth",
                "django.template.context_processors.debug",
                "django.template.context_processors.i18n",
                "django.template.context_processors.media",
                "django.template.context_processors.request",
                "django.template.context_processors.static",
                "django.template.context_processors.tz",
                "django.contrib.messages.context_processors.messages",
                "bpaotu.context_processors.production",
            ],
            "debug": DEBUG,
            "loaders": [
                'django.template.loaders.filesystem.Loader',
                'django.template.loaders.app_directories.Loader',
            ]
        },
    },

    {
        "BACKEND":"django.template.backends.jinja2.Jinja2",
        "DIRS": [os.path.join(WEBAPP_ROOT, 'bpaotu', 'jinja2')],
        "APP_DIRS": False,
        "OPTIONS": {
            "trim_blocks": True,
            "lstrip_blocks": True
        }
     }
]

ROOT_URLCONF = 'bpaotu.urls'

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.humanize',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_extensions',
    'django.contrib.admin',
    'django.contrib.admindocs',
    'suit',
    'bpaotu',
    'bpaotu.auth_app',
)

# This is here to placate the new system check framework, its also set in testsettings, where it belongs
TEST_RUNNER = 'django.test.runner.DiscoverRunner'

###
###
###

# Enable integration with BioCommons Access authentication (specific to the Bioplatforms data portal)
ENABLE_AUTH = env.get('enable_auth', True)

## Auth0 OIDC Configuration
OAUTH_DOMAIN = env.get("oauth_domain", "")
OAUTH_CLIENT_ID = env.get("oauth_client_id", "")
OAUTH_CLIENT_SECRET = env.get("oauth_client_secret", "")
OAUTH_REDIRECT_URI = env.get("oauth_redirect_uri", "")
OAUTH_LOGOUT_REDIRECT_URI = env.get("oauth_logout_redirect_uri", "")
OAUTH_FRONTEND_URL = env.get("oauth_frontend_url", "")
OAUTH_AM_ORGANISATION = env.get("oauth_am_organisation", "australian-microbiome")
OAUTH_CHECK_AUTH_URL = env.get('oauth_check_auth_url', '/oidc/check-auth')
OAUTH_USER_INFO_URL = env.get('oauth_user_info_url', '/oidc/user-info')
OAUTH_REGISTER_ACCESS_URL = env.get('oauth_register_access_url', "https://portal.access.services.biocommons.org.au/register",)

#TEMP
SKIP_SESSION_STATE_CHECK = env.get('skip_session_state_check', False)

# downloads URL
DEFAULT_PAGINATION = 50

# ingest all
DOWNLOADS_CHECKER_USER = env.get('downloads_checker_user', 'downloads_checker') # FIXME used?
DOWNLOADS_CHECKER_PASS = env.get('downloads_checker_pass', 'ch3ck3r')
DOWNLOADS_CHECKER_SLEEP = env.get('downloads_checker_sleep', 0.0)

# Ingest
BPAOTU_TMP_DIR = '/var/tmp' # For large temporary files

BPAOTU_MISSING_VALUE_SENTINEL = -9999  # Missing values in sample contextual data.
# See "Confirmed missing value" in
# https://github.com/AusMicrobiome/contextualdb_doc/blob/main/db_schema_definitions/db_schema_definitions.xlsx

BPAOTU_SCIENTIFIC_MANUAL_URL = "https://research.csiro.au/ambsm/"

BPAOTU_MAP_CENTRE_LONGITUDE = 133.775

# email to use in development when CKAN auth integration is enabled
CKAN_DEVELOPMENT_USER_EMAIL = env.get('ckan_devel_user_email', 'dev@bioplatforms.com')


GALAXY_BASE_URL = env.get('galaxy_base_url', 'https://galaxy-aust-dev.genome.edu.au')
# This will fail late, only when the user is trying to submit workflows to galaxy
# Leaving it as optional as not sure if all installations will use Galaxy
GALAXY_ADMIN_USER_API_KEY = env.get('galaxy_admin_user_api_key', '')
GALAXY_INTEGRATION = GALAXY_ADMIN_USER_API_KEY != ''
GALAXY_KRONA_WORKFLOW_ID = env.get('galaxy_krona_workflow_id', 'bf002aa8f96f4e7b')
METAGENOME_REQUEST_EMAIL = env.get('metagenome_request_email', 'am-data-requests@bioplatforms.com')

# UI
DEFAULT_AMPLICON = env.get('DEFAULT_AMPLICON', '27f519r_bacteria')
DEFAULT_TAXONOMIES = [
    # In priority order. Uses first available match as default for taxonomy selector.
    ['silva138', 'SKlearn'],
    ['unite8', 'wang']]

MIXPANEL_TOKEN = env.get("MIXPANEL_TOKEN", "")
