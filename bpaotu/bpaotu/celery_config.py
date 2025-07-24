import os

broker_url = os.getenv('CELERY_BROKER_URL', 'redis://cache')
result_backend = broker_url

accept_content = ['json']
task_serializer = 'json'
result_serializer = 'json'

timezone = os.getenv('TZ', 'Australia/Sydney')
