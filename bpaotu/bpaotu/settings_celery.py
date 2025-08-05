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
COMPARISON_PIVOT_MAX_SIZE_MB = env.get('COMPARISON_PIVOT_MAX_SIZE_MB', 8192)
