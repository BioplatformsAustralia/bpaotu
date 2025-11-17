import os
import json
import shutil
import logging
from time import time
from bpaotu.celery import app
from .submission import Submission
from .task_utils import find_task_id_for_submission

logger = logging.getLogger('bpaotu-alt')

BASE_SHARED_DIR = "/data/shared"

class BaseTaskWrapper:
    def __init__(self, submission_id, status, shared_subdir):
        self._submission_id = submission_id
        self._status = status
        self._shared_subdir = shared_subdir
        self._submission_dir = os.path.join(BASE_SHARED_DIR, shared_subdir, submission_id)
        self._timestamps = json.dumps([])

        # save the submission directory
        submission = Submission(self._submission_id)
        submission.submission_directory = self._submission_dir

    def _log(self, level, message):
        prefix = f"[{self.__class__.__name__} | {self._submission_id}]"
        getattr(logger, level)(f"{prefix} {message}")

    def _status_update(self, submission, text):
        this_timestamp = time()
        timestamps_ = json.loads(submission.timestamps)

        if timestamps_:
            prev_step = timestamps_[-1]
            prev_label, prev_timestamp = list(prev_step.items())[0]
            step_duration = this_timestamp - prev_timestamp
            self._log('info', f"Status update: {text} ({prev_label} took {step_duration:.1f}s)")
        else:
            self._log('info', f"Status update: {text}")

        timestamps_.append({text: this_timestamp})
        submission.status = text
        submission.timestamps = json.dumps(timestamps_)

    def _in(self, filename):
        path = os.path.join(self._submission_dir, filename)
        self._log('debug', f"Accessing file path: {path}")
        return path

    def setup(self):
        self._log('debug', "Starting setup")
        result = self._setup()
        self._log('debug', "Finished setup")
        return result

    def run(self):
        self._log('debug', "Starting run")
        result = self._run()
        self._log('debug', "Finished run")
        return result

    def cancel(self):
        self._log('debug', "Starting cancel")
        result = self._cancel()
        self._log('debug', "Finished cancel")
        return result

    def cleanup(self):
        self._log('debug', "Starting cleanup")
        result = self._cleanup()
        self._log('debug', "Finished cleanup")
        return result

    def _setup(self):
        submission = Submission(self._submission_id)
        submission.timestamps = json.dumps([])
        self._status_update(submission, 'init')
        os.makedirs(self._submission_dir, exist_ok=True)
        self._log('info', f"Submission directory created: {self._submission_dir}")

    def _cancel(self):
        submission = Submission(self._submission_id)
        try:
            task_id = find_task_id_for_submission(self._submission_id)
            if task_id:
                app.control.revoke(task_id, terminate=True, signal='SIGKILL')
                self._status_update(submission, 'cancelled')
                self._log('info', f"Task cancelled (task_id={task_id})")
            else:
                self._log('warning', "No task ID found; cannot cancel")
        except Exception as e:
            self._log('exception', f"Error cancelling task: {e}")

        # default behaviour is to cleanup on a cancel
        # but allow a task to retain existing directory if necessary
        # (e.g. sample comparion: cancelling the first run, do a full cleanup; cancelling a re-run, retain existing directory for further reanalysis)
        if submission.skip_cleanup_on_cancel:
            self._log('debug', "Skipping cleanup during cancel")
        else:
            self._log('debug', "Performing cleanup during cancel")
            self._cleanup()

        return True

    def _cleanup(self):
        try:
            shutil.rmtree(self._submission_dir)
            self._log('info', f"Submission directory removed: {self._submission_dir}")
        except FileNotFoundError:
            self._log('warning', f"Directory not found during cleanup: {self._submission_dir}")
        except Exception as e:
            self._log('exception', f"Unexpected error during cleanup: {e}")
