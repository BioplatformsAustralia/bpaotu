# settings shared between runserver and celeryworker

import os
import posixpath
import logging

from ccg_django_utils.conf import EnvConfig
from celery.schedules import crontab
from contextlib import suppress

from ._version import __version__

env = EnvConfig()


## BASIC CONFIG

# Default SSL on and forced, turn off if necessary
PRODUCTION = env.get("production", False)
DEBUG = env.get("debug", not PRODUCTION)
SSL_ENABLED = PRODUCTION # FIXME?  used?
SSL_FORCE = PRODUCTION # FIXME?  used?

TIME_ZONE = env.get("time_zone", 'Australia/Perth')

# VERSION = env.get("bpa_version", os.environ.get("GIT_TAG", "UNKNOWN_VERSION"))
VERSION = __version__
BPA_VERSION = VERSION

SECRET_KEY = env.get("secret_key", "change-it")

SCRIPT_NAME = env.get("script_name", os.environ.get("HTTP_SCRIPT_NAME", ""))
BASE_URL = SCRIPT_NAME

WEBAPP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ensure STATIC_URL always has a single slash between script name and static, and doesn't end with double slash if script name is "/"
STATIC_ROOT = env.get('static_root', os.path.join(WEBAPP_ROOT, 'static'))
STATIC_URL = posixpath.join("/", SCRIPT_NAME.strip("/"), "static") + "/"


# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
MEDIA_ROOT = env.get('media_root', os.path.join(WEBAPP_ROOT, 'static', 'media'))
MEDIA_URL = ''


## EMAIL CONFIG

EMAIL_SUBJECT_PREFIX = env.get("EMAIL_SUBJECT_PREFIX", '[Australian Microbiome]')

# From env vars, with defaults
MAIL_SERVER_HOST = env.get("MAIL_SERVER_HOST", "localhost")
MAIL_SERVER_PORT = int(env.get("MAIL_SERVER_PORT", 25))
MAIL_FROM = env.get("MAIL_FROM", "noreply@noreply.csiro.au")

# Django email settings, using the above env vars
EMAIL_HOST = MAIL_SERVER_HOST
EMAIL_PORT = MAIL_SERVER_PORT
DEFAULT_FROM_EMAIL = MAIL_FROM

# Email recipients (comma separated lists)
INGEST_NOTIFY_EMAIL = env.get('ingest_notify_email', None)
METAGENOME_REQUEST_EMAIL = env.get('metagenome_request_email', 'am-data-requests@bioplatforms.com')
alert_emails = env.get("alert_email", "root@localhost").split(",")
ADMINS = [("alert", email.strip()) for email in alert_emails]


## TASK SPECIFIC CONFIG

BLAST_RESULTS_PATH = env.get('blast_results_path', '/data/blast-output/')
BLAST_RESULTS_URL = env.get('blast_results_url', STATIC_URL)

OTU_EXPORT_PATH = env.get('otu_export_path', '/data/otu-export/')
OTU_EXPORT_URL = env.get('otu_export_url', STATIC_URL)


## CKAN CONFIG

CKAN_SERVER = {
    'name': env.get('ckan_name', 'bpa-aws1'),
    'base_url': env.get('ckan_base_url', 'https://data.bioplatforms.com/'),
    'api_key': env.get('ckan_api_key', ''),
}


## REDIS CONFIG

REDIS_HOST = env.get('REDIS_HOST', 'cache')
REDIS_PORT = env.get('REDIS_PORT', '6379')
REDIS_DB = env.get('REDIS_DB', '0')
REDIS_PASSWORD = env.get('REDIS_PASSWORD', None)

def redis_url(db_num=None):
    """Return redis:// URL with password if set."""
    if not db_num:
        db_num = int(REDIS_DB)

    if REDIS_PASSWORD:
        result = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{db_num}"
    else:
        result = f"redis://{REDIS_HOST}:{REDIS_PORT}/{db_num}"

    return result

CACHES = {
    'default': {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": redis_url(1),
        "EXPIRY": 3600,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient"
        },
        "KEY_PREFIX": "bpaotu_cache"
    }
}

CACHES['search_results'] = CACHES['default']
CACHES['image_results'] = CACHES['default']
CACHES['contextual_schema_definition_results'] = CACHES['default']


## CELERY WORKER CONFIG

CELERY_TIMEZONE = TIME_ZONE
CELERY_BROKER_URL = redis_url(2)
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
# CELERY_TASK_IGNORE_RESULT = True # working on killing tasks with out of memory error

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'


## CELERY BEAT CONFIG

PERIODIC_CKAN_UPDATE_INTERVAL = 3600 # Seconds between CKAN queries for new resources
PERIODIC_DOWNLOAD_RESULTS_CLEANUP_EXPIRY_HOURS = env.get('periodic_download_results_cleanup_expiry_hours', 72)
PERIODIC_DOWNLOAD_RESULTS_CLEANUP_EXPIRY = PERIODIC_DOWNLOAD_RESULTS_CLEANUP_EXPIRY_HOURS * 3600
PERIODIC_DOWNLOAD_RESULTS_CLEANUP_TIME = os.getenv("PERIODIC_DOWNLOAD_RESULTS_CLEANUP_TIME", "01:00")

try:
    cleanup_time_hour, cleanup_time_minute = map(int, PERIODIC_DOWNLOAD_RESULTS_CLEANUP_TIME.split(":"))
except ValueError:
    # fallback safely to 1am if env var is malformed
    cleanup_time_hour, cleanup_time_minute = 1, 0

CELERY_BEAT_SCHEDULE_FILENAME = '/tmp/celerybeat-schedule'
CELERY_BEAT_SCHEDULE = {
    "periodic-ckan-update": {
        "task": "bpaotu.tasks.periodic_ckan_update",
        "schedule": PERIODIC_CKAN_UPDATE_INTERVAL,
    },
    "periodic-download-results-cleanup": {
        "task": "bpaotu.tasks.periodic_download_results_cleanup",
        "schedule": crontab(hour=cleanup_time_hour, minute=cleanup_time_minute),
    },
}


## DATABASE CONFIG

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env.get("dbname", "webapp"),
        'USER': env.get("dbuser", "webapp"),
        'PASSWORD': env.get("dbpass", "webapp"),
        'HOST': env.get("dbserver", "db"),
        'PORT': env.get("dbport", "5432"),
        'OPTIONS': {
            'connect_timeout': 60,      # Connect timeout (not query execution timeout)
            'keepalives': 1,            # Enable TCP keepalives
            'keepalives_idle': 600,     # Send keepalive after
            'keepalives_interval': 60,  # Retry every
            'keepalives_count': 100,    # Retry times before closing
        }
    }
}


## LOGGING CONFIG

LOG_LEVEL = env.get('log_level', "INFO")
LOG_DIRECTORY = env.get('log_directory', os.path.join(WEBAPP_ROOT, "log"))
with suppress(OSError):
    if not os.path.exists(LOG_DIRECTORY):
        os.mkdir(LOG_DIRECTORY)
os.path.exists(LOG_DIRECTORY), "No log directory, please create one: %s" % LOG_DIRECTORY

# Filter that rewrites the level name to be 5 chars or min before formatting
class ShortLevelFilter(logging.Filter):
    LEVEL_MAP = {
        "WARNING": "WARN",
        "CRITICAL": "FATAL",
    }

    def filter(self, record):
        record.levelname = self.LEVEL_MAP.get(record.levelname, record.levelname)
        return True

# Note that these are the final mapped values after ShortLevelFilter has been applied
LOG_COLORS = {
    'DEBUG': 'cyan',
    'INFO': 'green',
    'WARN': 'yellow',
    'ERROR': 'red',
    'FATAL': 'red,bg_white',
}

LEVEL_TEXT = '[%(levelname)-5s] '
LEVEL_TEXT_COLOR = '[%(log_color)s%(levelname)-5s%(reset)s] '
SIMPLE_TEXT = '%(asctime)s %(message)s'
VERBOSE_TEXT = '%(asctime)s [%(filename)s:%(lineno)s:%(funcName)s] %(message)s'

SIMPLE_FORMAT = LEVEL_TEXT + SIMPLE_TEXT
VERBOSE_FORMAT = LEVEL_TEXT + VERBOSE_TEXT
SIMPLE_FORMAT_COLOR = LEVEL_TEXT_COLOR + SIMPLE_TEXT
VERBOSE_FORMAT_COLOR = LEVEL_TEXT_COLOR + VERBOSE_TEXT
DB_FORMAT = LEVEL_TEXT + '(%(duration)s) [%(sql)s:%(params)s %(filename)s %(lineno)s %(funcName)s] %(message)s'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': SIMPLE_FORMAT
        },
        'simple-color': {
            '()': 'colorlog.ColoredFormatter',
            'log_colors': LOG_COLORS,
            'format': SIMPLE_FORMAT_COLOR
        },
        'verbose': {
            'format': VERBOSE_FORMAT
        },
        'verbose-color': {
            '()': 'colorlog.ColoredFormatter',
            'log_colors': LOG_COLORS,
            'format': VERBOSE_FORMAT_COLOR
        },
        'db': {
            'format': DB_FORMAT
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
        'short_levels': {
            '()': 'bpaotu.settings_shared.ShortLevelFilter',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose-color',
            'filters': ['short_levels'],
        },
        'console-worker': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple-color',
            'filters': ['short_levels'],
        },
        'console-importer': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
            'filters': ['short_levels'],
        },
        'file': {
            'level': 'INFO', # note that file is fixed to have a lowest level of INFO
            'class': 'ccg_django_utils.loghandlers.ParentPathFileHandler',
            'filename': os.path.join(LOG_DIRECTORY, 'registry.log'),
            'when': 'midnight',
            'formatter': 'verbose',
            'filters': ['short_levels'],
        },
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler',
            'include_html': True
        },
        'db': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'db',
            'filters': ['require_debug_true', 'short_levels'],
        },
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'loggers': {
        ## internal django loggers
        # general
        'django': {
            'handlers': ['file', 'console'],
        },
        # 4xx and 5xx errors (when DEBUG=False)
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
        # security errors (when DEBUG=False)
        'django.security': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
        # # database queries (when DEBUG=True, can be very verbose - uncomment if needed)
        # 'django.db.backends': {
        #     'handlers': ['db'],
        #     'level': 'DEBUG',
        #     'propagate': False,
        # },
        # third party libraries
        'libs': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        # python warnings
        'py.warnings': {
            'handlers': ['console'],
        },
        # custom app loggers
        'bpaotu': {
            'handlers': ['file', 'console'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'bpaotu-worker': {
            'handlers': ['file', 'console-worker'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'bpaotu-importer': {
            'handlers': ['file', 'console-importer'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
    }
}
