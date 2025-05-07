from contextlib import suppress
import os

from django.apps import AppConfig
from django.conf import settings

class BpaotuConfig(AppConfig):
    name = 'bpaotu'
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):
        # See settings.STATICFILES_DIRS
        with suppress(FileExistsError, PermissionError):
            os.mkdir(settings.BLAST_RESULTS_PATH)
