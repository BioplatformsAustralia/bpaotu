from bpaotu.celery import app

import datetime
import json
import numpy as np

class NumpyEncoder(json.JSONEncoder):
    """ Special json encoder for numpy types """
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)

def find_task_id_for_submission(submission_id):
    inspector = app.control.inspect()
    active_tasks = inspector.active()
    
    if not active_tasks:
        return None

    for tasks in active_tasks.values():
        for task in tasks:
            if submission_id in task.get('args', []):
                return task.get('id')
    return None
