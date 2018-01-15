# -*- coding: utf-8 -*-/MAIL
# Django settings for bpa metadata project.

import os
from ccg_django_utils.conf import EnvConfig

env = EnvConfig()

VERSION = env.get("bpa_version", os.environ.get("GIT_TAG", "UNKNOWN_VERSION"))
BPA_VERSION = VERSION

SCRIPT_NAME = env.get("script_name", os.environ.get("HTTP_SCRIPT_NAME", ""))
FORCE_SCRIPT_NAME = env.get("force_script_name", "") or SCRIPT_NAME or None

WEBAPP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# a directory that will be writable by the webserver, for storing various files...
WRITABLE_DIRECTORY = env.get("writable_directory", "/tmp")

SECRET_KEY = env.get("secret_key", "change-it")

# Default SSL on and forced, turn off if necessary
PRODUCTION = env.get("production", False)
SSL_ENABLED = PRODUCTION
SSL_FORCE = PRODUCTION

DEBUG = env.get("debug", not PRODUCTION)

# django-secure
SECURE_SSL_REDIRECT = env.get("secure_ssl_redirect", PRODUCTION)
SECURE_CONTENT_TYPE_NOSNIFF = env.get("secure_content_type_nosniff", PRODUCTION)
SECURE_BROWSER_XSS_FILTER = env.get("secure_browser_xss_filter", PRODUCTION)
SECURE_HSTS_SECONDS = env.get("secure_hsts_seconds", 10)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.get("secure_hsts_include_subdomains", PRODUCTION)
SECURE_SSL_HOST = env.get("secure_ssl_host", False)
SECURE_REDIRECT_EXEMPT = env.getlist("secure_redirect_exempt", [])
X_FRAME_OPTIONS = env.get("x_frame_options", 'DENY')
ADMINS = [("alert", env.get("alert_email", "root@localhost"))]
MANAGERS = ADMINS

# anymail email
DEFAULT_FROM_EMAIL = env.get('DJANGO_DEFAULT_FROM_EMAIL', 'No Reply <no-reply@mg.ccgapps.com.au>')
EMAIL_SUBJECT_PREFIX = env.get("DJANGO_EMAIL_SUBJECT_PREFIX", '[BPA OTU] ')
SERVER_EMAIL = env.get('DJANGO_SERVER_EMAIL', DEFAULT_FROM_EMAIL)
# default to anymail/mailgun, but if the API key is not set, fall back to console
EMAIL_BACKEND = env.get('DJANGO_EMAIL_BACKEND', 'anymail.backends.mailgun.MailgunBackend')
ANYMAIL = {
    "MAILGUN_API_KEY": env.get('DJANGO_MAILGUN_API_KEY', ''),
    "MAILGUN_SENDER_DOMAIN": env.get('DJANGO_MAILGUN_SERVER_NAME', '')
}


ALLOWED_HOSTS = env.getlist("allowed_hosts", ["*"])

CKAN_SERVERS = ({
    'name': env.get('ckan_name', 'bpa-aws1'),
    'base_url': env.get('ckan_base_url', 'https://data.bioplatforms.com/'),
    'api_key': env.get('ckan_api_key', ''),
},)

CKAN_CACHE_TIMEOUT = env.get('ckan_cache_timeout', 24 * 60 * 60)

DATABASES = {
    'default': {
        # 'ENGINE': env.get_db_engine("dbtype", "pgsql"),
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': env.get("dbname", "webapp"),
        'USER': env.get("dbuser", "webapp"),
        'PASSWORD': env.get("dbpass", "webapp"),
        'HOST': env.get("dbserver", ""),
        'PORT': env.get("dbport", ""),
    }
}

REST_FRAMEWORK = {
    # Use Django's standard `django.contrib.auth` permissions,
    # or allow read-only access for unauthenticated users.
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly', ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'DEFAULT_FILTER_BACKENDS': ('rest_framework.filters.DjangoFilterBackend', ),
    'PAGINATE_BY': 10,
    'PAGINATE_BY_PARAM': 'page_size',
}

SESSION_COOKIE_AGE = env.get("session_cookie_age", 60 * 60)
SESSION_COOKIE_PATH = '{0}/'.format(SCRIPT_NAME)
SESSION_SAVE_EVERY_REQUEST = env.get("session_save_every_request", True)
SESSION_COOKIE_HTTPONLY = SESSION_COOKIE_HTTPONLY = env.get("session_cookie_httponly", True)
SESSION_COOKIE_SECURE = env.get("session_cookie_secure", PRODUCTION)
SESSION_COOKIE_NAME = env.get("session_cookie_name", "ccg_{0}".format(SCRIPT_NAME.replace("/", "")))
SESSION_COOKIE_DOMAIN = env.get("session_cookie_domain", "") or None
CSRF_USE_SESIONS = True

TIME_ZONE = env.get("time_zone", 'Australia/Perth')
LANGUAGE_CODE = env.get("language_code", 'en-us')
USE_I18N = env.get("use_i18n", True)
USE_L10N = False
DATE_INPUT_FORMATS = ('%Y-%m-%d', '%d/%m/%Y', '%d/%m/%y', '%d %m %Y', '%d %m %y', '%d %b %Y')
DATE_FORMAT = "d-m-Y"
SHORT_DATE_FORMAT = "d/m/Y"

# used by maps when plotting sample location
GIS_SOURCE_RID = 4326
GIS_TARGET_RID = 3857
GIS_CENTER = (134.0, -26.0)
GIS_POINT_ZOOM = 12
GIS_OPENLAYERS_URL = "https://cdnjs.cloudflare.com/ajax/libs/openlayers/2.13.1/OpenLayers.js"

LEAFLET_CONFIG = {
    'DEFAULT_CENTER': (-25.27, 133.775),
    'DEFAULT_ZOOM': 4,
    'ATTRIBUTION_PREFIX': '',
    'TILES': [
        ('ESRI',
         '//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
         {'attribution':
          '&copy; i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          }, ),
        ('OSM B&W',
         '//{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png',
         {'attribution': '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> Contributers'}, ),
        ('Thunderforest Landscape',
         '//{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png',
         {'attribution': '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> Contributers'}, ),
        ('ISM Seamark',
         '//tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
         {'attribution': '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> Contributers'}, ),
    ],
    'MINIMAP': True,
    'RESET_VIEW': False
}

SITE_ID = 1

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
MEDIA_ROOT = env.get('media_root', os.path.join(WEBAPP_ROOT, 'static', 'media'))
MEDIA_URL = ''

# These may be overridden, but it would be nice to stick to this convention
STATIC_ROOT = env.get('static_root', os.path.join(WEBAPP_ROOT, 'static'))
STATIC_URL = '{0}/static/'.format(SCRIPT_NAME)
STATIC_SERVER_PATH = STATIC_ROOT

MIDDLEWARE_CLASSES = ('django.middleware.security.SecurityMiddleware',
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
                "django.contrib.messages.context_processors.messages"
            ],
            "debug": DEBUG,
            "loaders": [
                'django.template.loaders.filesystem.Loader',
                'django.template.loaders.app_directories.Loader',
            ]
        },
    },
]


ROOT_URLCONF = 'bpaotu.urls'

INSTALLED_APPS = ('bpaotu',
                  'suit',
                  'django.contrib.auth',
                  'django.contrib.contenttypes',
                  'django.contrib.sessions',
                  'django.contrib.sites',
                  'django.contrib.messages',
                  'django.contrib.staticfiles',
                  'django.contrib.gis',
                  'django_extensions',
                  'django.contrib.admin',
                  'django.contrib.admindocs',
                  'bootstrap3',
                  )

# #
# # LOGGING
# #
LOG_DIRECTORY = env.get('log_directory', os.path.join(WEBAPP_ROOT, "log"))
try:
    if not os.path.exists(LOG_DIRECTORY):
        os.mkdir(LOG_DIRECTORY)
except:
    pass
os.path.exists(LOG_DIRECTORY), "No log directory, please create one: %s" % LOG_DIRECTORY

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[%(levelname)s:%(asctime)s:%(filename)s:%(lineno)s:%(funcName)s] %(message)s'
        },
        'db': {
            'format': '[%(duration)s:%(sql)s:%(params)s %(filename)s %(lineno)s %(funcName)s] %(message)s'
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
        'color': {
            '()': 'colorlog.ColoredFormatter',
            'format': '[%(log_color)s%(levelname)-8s] %(filename)s:%(lineno)s %(funcName)s() %(message)s',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'filters': ['require_debug_true'],
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        'shell': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        'rainbow': {
            'level': 'DEBUG',
            'class': 'colorlog.StreamHandler',
            'formatter': 'color'
        },
        'file': {
            'level': 'INFO',
            'class': 'ccg_django_utils.loghandlers.ParentPathFileHandler',
            'filename': os.path.join(LOG_DIRECTORY, 'registry.log'),
            'when': 'midnight',
            'formatter': 'verbose'
        },
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler',
            'include_html': True
        },
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
        },
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
        'django.security': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
        'django.db.backends': {
            'handlers': ['mail_admins'],
            'level': 'CRITICAL',
            'propagate': True,
        },
        'bpaotu': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'libs': {
            'handlers': ['rainbow', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'bpaotu.bpaotu.management.commands': {
            'handlers': ['rainbow'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'apps': {
            'handlers': ['rainbow'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'py.warnings': {
            'handlers': ['console'],
        },
    }
}

if env.get("DEBUG_TOOLBAR", False):
    INSTALLED_APPS += ('debug_toolbar', )
    MIDDLEWARE_CLASSES += ('debug_toolbar.middleware.DebugToolbarMiddleware', )
    INTERNAL_IPS = ('127.0.0.1',
                    '172.16.2.189', )  # explicitly set this for your environment

# downloads URL
DEFAULT_PAGINATION = 50

# This honours the X-Forwarded-Host header set by our nginx frontend when
# constructing redirect URLS.
USE_X_FORWARDED_HOST = env.get("use_x_forwarded_host", True)


# cache using redis
CACHES = {

    'default': {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": env.getlist("cache", ["redis://cache:6379/1"]),
        "TIMEOUT": 3600,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient"
        },
        "KEY_PREFIX": "bpaotu_cache"
    }

}
CACHES['search_results'] = CACHES['default']
SESSION_ENGINE = "django.contrib.sessions.backends.cache"

CHMOD_USER = env.get("repo_user", "apache")
CHMOD_GROUP = env.get("repo_group", "apache")

# this is here to placate the new system check framework, its also set in testsettings,
# where it belongs
TEST_RUNNER = 'django.test.runner.DiscoverRunner'

# ingest all
DOWNLOADS_CHECKER_USER = env.get('downloads_checker_user', 'downloads_checker')
DOWNLOADS_CHECKER_PASS = env.get('downloads_checker_pass', 'ch3ck3r')
DOWNLOADS_CHECKER_SLEEP = env.get('downloads_checker_sleep', 0.0)

# sql explorer
EXPLORER_FROM_EMAIL = env.get('DJANGO_DEFAULT_FROM_EMAIL', 'No Reply <no-reply@mg.ccgapps.com.au>')
EXPLORER_TASKS_ENABLED = True
EXPLORER_TOKEN_AUTH_ENABLED = True
EXPLORER_TOKEN = env.get('EXPLORER_TOKEN', "EXPLOREIT")
