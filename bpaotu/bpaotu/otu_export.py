from bpaotu.celery import app

import os.path
import logging
import shutil
import json
import io
from time import time

from django.conf import settings

from django.db import connection
from psycopg2.extensions import adapt

from .params import param_to_filters, selected_contextual_filters
from .query import SampleQuery
from .submission import Submission
from .task_utils import NumpyEncoder, find_task_id_for_submission

import numpy as np
import pandas as pd

# debug
from .util import log_msg

logger = logging.getLogger('bpaotu')

class OtuExportWrapper:
    def __init__(self, submission_id, query, status):
        self._submission_id = submission_id
        self._status = status
        self._query = query
        self._params, _ = param_to_filters(query)
        self._submission_dir = os.path.join(SHARED_DIR, submission_id)

    def _status_update(self, submission, text):
        this_timestamp = time()
        timestamps_ = json.loads(submission.timestamps)

        # log with time taken since last status update
        if timestamps_:
            prev_step = timestamps_[-1]
            prev_label, prev_timestamp = list(prev_step.items())[0]
            step_duration = this_timestamp - prev_timestamp
            logger.info(f"Status: {text} ({prev_label} took {step_duration:.1f}s)")
        else:
            logger.info(f"Status: {text}")

        # append new timestampe and update submission
        timestamps_.append({ text: this_timestamp })
        submission.status = text
        submission.timestamps = json.dumps(timestamps_)

    def _in(self, filename):
        "return path to filename within submission dir"
        return os.path.join(self._submission_dir, filename)


    def setup(self):
        return self._setup()

    def run(self):
        return self._run()

    def cancel(self):
        return self._cancel()

    def cleanup(self):
        self._cleanup();


    def _setup(self):
        submission = Submission(self._submission_id)
        submission.timestamps = json.dumps([])

        self._status_update(submission, 'init')
        os.makedirs(self._submission_dir, exist_ok=True)
        logger.info(f'Submission directory created: {self._submission_dir}')

    def _cancel(self):
        submission = Submission(self._submission_id)
        logger.info("CANCEL")

        try:
            task_id = find_task_id_for_submission(self._submission_id)
            if task_id:
                app.control.revoke(task_id, terminate=True, signal='SIGKILL')

                self._status_update(submission, 'cancelled')
                submission.cancelled = 'true'
                return True
        except Exception as e:
            print('error', e)
            logger.exception('Error in cancel otu export')
            return False

        self._cleanup();

    def _cleanup(self):
        logger.info("CLEANUP")

    def _run(self):
        # access the submission so we can change the status
        submission = Submission(self._submission_id)

        _params, _errors = param_to_filters(self._query)

        logger.info("RUN")

        self._status_update(submission, 'complete')

        return True

