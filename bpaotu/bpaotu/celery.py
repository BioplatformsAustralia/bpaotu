from celery import Celery

app = Celery('bpaotu')
app.config_from_object('bpaotu.celery_config')

# import bpaotu.tasks
import bpaotu.tasks_minimal

app.loader.override_backends['django'] = 'default'
