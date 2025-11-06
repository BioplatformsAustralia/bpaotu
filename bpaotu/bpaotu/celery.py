from celery import Celery

from django.conf import settings

app = Celery('bpaotu')

# Using a string here means the worker doesn't have to serialize the configuration object to child processes
# - namespace='CELERY' means all celery-related configuration keys should have a `CELERY_` prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Import tasks after Celery app has been initialised
# Periodic tasks are configured in the celery beat schedule
app.autodiscover_tasks()
