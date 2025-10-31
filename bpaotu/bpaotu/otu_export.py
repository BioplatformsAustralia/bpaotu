import io
import os
import csv
import json

from django.conf import settings
from contextlib import suppress
from urllib.parse import urljoin

from .base_task_wrapper import BaseTaskWrapper
from .params import param_to_filters
from .submission import Submission
from .tabular import tabular_zip_file_generator
from .util import make_timestamp

class OtuExportWrapper(BaseTaskWrapper):
    def __init__(self, submission_id, query, status):
        super().__init__(submission_id, status, "otu-export")
        self._query = query

    def _run(self):
        # access the submission so we can change the status
        submission = Submission(self._submission_id)

        params, errors = param_to_filters(self._query)
        timestamp = make_timestamp()
        only_contextual = 'f'
        zf = tabular_zip_file_generator(params, only_contextual)

        fname = params.filename(timestamp, f"-csv-{self._submission_id}.zip")
        result_path = os.path.join(settings.OTU_EXPORT_PATH, fname)

        self._status_update(submission, 'processing')

        with suppress(FileExistsError, PermissionError):
            os.mkdir(settings.OTU_EXPORT_PATH)

        with open(result_path, 'wb') as fd:
            for chunk in zf:
                fd.write(chunk)

        submission.result_url = urljoin(settings.OTU_EXPORT_URL + '/', fname)

        self._status_update(submission, 'complete')

        return True
