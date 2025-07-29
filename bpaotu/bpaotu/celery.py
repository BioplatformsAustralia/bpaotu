from celery import Celery

app = Celery('bpaotu')
app.config_from_object('django.conf:settings', namespace='CELERY')

import bpaotu.tasks_minimal
