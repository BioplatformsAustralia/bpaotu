from celery import Celery

from django.conf import settings

app = Celery('bpaotu')

# Import tasks after Celery app has been initialised
import bpaotu.tasks_minimal

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Configure periodic tasks
@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(settings.BPAOTU_CKAN_POLL_INTERVAL,
                             tasks_minimal.periodic_ckan_update.s(), ignore_result=True)
