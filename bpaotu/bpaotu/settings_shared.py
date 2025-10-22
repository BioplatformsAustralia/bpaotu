# settings shared between runserver and celeryworker

import os
from ccg_django_utils.conf import EnvConfig
from contextlib import suppress

from ._version import __version__

env = EnvConfig()


# BASIC CONFIG

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
FORCE_SCRIPT_NAME = env.get("force_script_name", "") or SCRIPT_NAME or None

WEBAPP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

STATIC_ROOT = env.get('static_root', os.path.join(WEBAPP_ROOT, 'static'))
STATIC_URL = '{0}/static/'.format(SCRIPT_NAME)
STATIC_SERVER_PATH = STATIC_ROOT

# This should be the path under the webapp is installed on the server ex. /bpa/otu on staging
# TODO I think this is alwasy SCRIPT_NAME if not get separately from enviroment
BASE_URL = SCRIPT_NAME


## task specific config

BLAST_RESULTS_PATH = env.get('blast_results_path', '/data/blast-output/')
BLAST_RESULTS_URL = env.get('blast_results_url', STATIC_URL)


## ckan config

CKAN_SERVER = {
    'name': env.get('ckan_name', 'bpa-aws1'),
    'base_url': env.get('ckan_base_url', 'https://data.bioplatforms.com/'),
    'api_key': env.get('ckan_api_key', ''),
}


## redis config

REDIS_HOST = env.get('REDIS_HOST', 'cache')
REDIS_PORT = env.get('REDIS_PORT', '6379')
REDIS_DB = env.get('REDIS_DB', '0')
REDIS_PASSWORD = env.get('REDIS_PASSWORD', None)

def redis_url(db_num=0):
    """Return redis:// URL with password if set."""
    if REDIS_PASSWORD:
        return f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{db_num}"
    else:
        return f"redis://{REDIS_HOST}:{REDIS_PORT}/{db_num}"

CACHES = {
    'default': {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": redis_url(1),
        "TIMEOUT": 3600,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient"
        },
        "KEY_PREFIX": "bpaotu_cache"
    }
}

CACHES['search_results'] = CACHES['default']
CACHES['image_results'] = CACHES['default']
CACHES['contextual_schema_definition_results'] = CACHES['default']


## celery config

CELERY_BROKER_URL = redis_url(2)
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
# CELERY_TASK_IGNORE_RESULT = True # working on killing tasks with out of memory error

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'

CELERY_TIMEZONE = TIME_ZONE


## database config

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': env.get("dbname", "webapp"),
        'USER': env.get("dbuser", "webapp"),
        'PASSWORD': env.get("dbpass", "webapp"),
        'HOST': env.get("dbserver", ""),
        'PORT': env.get("dbport", ""),
        'OPTIONS': {
            'connect_timeout': 60,  # Connect timeout (not query execution timeout)
            'keepalives': 1,        # Enable TCP keepalives
            'keepalives_idle': 600,  # Send keepalive after
            'keepalives_interval': 60, # Retry every
            'keepalives_count': 100,    # Retry times before closing
        }
    }
}


## logging

LOG_DIRECTORY = env.get('log_directory', os.path.join(WEBAPP_ROOT, "log"))
with suppress(OSError):
    if not os.path.exists(LOG_DIRECTORY):
        os.mkdir(LOG_DIRECTORY)
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
        'console_prod': {
            'level': 'DEBUG',
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
        'rainbow': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'bpaotu': {
            'handlers': ['console_prod', 'file'],
            'level': 'INFO',
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
