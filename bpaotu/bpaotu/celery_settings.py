from .settings import *

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "bpaotu",
]

ROOT_URLCONF = None

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
