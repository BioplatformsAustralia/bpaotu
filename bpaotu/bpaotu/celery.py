from celery import Celery

from django.conf import settings
from . import sample_meta

# set the default Django settings module for the 'celery' program.
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proj.settings')

app = Celery('bpaotu')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))


@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(settings.BPAOTU_CKAN_POLL_INTERVAL,
                             periodic_task.s(), ignore_result=True)

@app.task(ignore_result=True)
def periodic_task():
    sample_meta.update_from_ckan()
