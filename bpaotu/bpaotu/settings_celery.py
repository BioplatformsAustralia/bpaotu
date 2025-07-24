from .settings_shared import *


# use a subset of INSTALLED_APPS compared to runserver
INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "bpaotu",
]

# don't load urls.py
ROOT_URLCONF = None

# comparison task settings
COMPARISON_CHUNK_SIZE = env.get('COMPARISON_CHUNK_SIZE', 10000)
COMPARISON_DF_METHOD = env.get('COMPARISON_DF_METHOD', 'parquet')
COMPARISON_PIVOT_MAX_SIZE_MB = env.get('COMPARISON_PIVOT_MAX_SIZE_MB', 4096)
