# settings shared between runserver and celeryworker

import os
from ccg_django_utils.conf import EnvConfig

from ._version import __version__

env = EnvConfig()


VERSION = env.get("bpa_version", os.environ.get("GIT_TAG", "UNKNOWN_VERSION"))
BPA_VERSION = VERSION

VERSION = __version__

SECRET_KEY = env.get("secret_key", "change-it")

SCRIPT_NAME = env.get("script_name", os.environ.get("HTTP_SCRIPT_NAME", ""))
FORCE_SCRIPT_NAME = env.get("force_script_name", "") or SCRIPT_NAME or None

WEBAPP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

STATIC_ROOT = env.get('static_root', os.path.join(WEBAPP_ROOT, 'static'))
STATIC_URL = '{0}/static/'.format(SCRIPT_NAME)
STATIC_SERVER_PATH = STATIC_ROOT


# databse config

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


# redis config

REDIS_DB = env.get('REDIS_DB', '0')
REDIS_HOST = env.get('REDIS_HOST', 'cache')

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

# task specific config

BLAST_RESULTS_PATH = env.get('blast_results_path', '/data/blast-output/')
BLAST_RESULTS_URL = env.get('blast_results_url', STATIC_URL)
