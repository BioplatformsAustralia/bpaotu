import io
import os
import csv
import json
import logging

from django.conf import settings
from django.core.mail import send_mail
from contextlib import suppress
from urllib.parse import urljoin

from .base_task_wrapper import BaseTaskWrapper
from .params import param_to_filters
from .submission import Submission
from .tabular import tabular_zip_file_generator
from .util import make_timestamp

logger = logging.getLogger('bpaotu')

class OtuExportWrapper(BaseTaskWrapper):
    def __init__(self, submission_id, query, status):
        super().__init__(submission_id, status, "otu-export")
        self._query = query

    def notify(self, full_url, user_email):
        result = self._notify(full_url, user_email)
        return result

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

    def _notify(self, full_url, user_email):
        # access the submission so we can change the status
        submission = Submission(self._submission_id)

        try:
            am_email ="Australian Microbiome Data Requests <{}>".format(settings.OTU_EXPORT_EMAIL)
            body = self._email_text(full_url)

            send_mail(
                "Australian Microbiome: OTU Export Download Available",
                body,
                am_email, [user_email])

        except Exception as e:
            logger.critical("Error sending notify email", exc_info=True)
            return False

        return True

    def _email_text(self, full_url):
        submission = Submission(self._submission_id)

        lines = [
            "Your search results are ready for download here:",
            full_url,
        ]

        cleanup_expiry = settings.PERIODIC_DOWNLOAD_RESULTS_CLEANUP_EXPIRY_HOURS
        if cleanup_expiry > 0:
            lines.append(f"")
            lines.append(f"This file will be available for {cleanup_expiry} hours.")

        body_text = "\n".join(lines)

        params, _ = param_to_filters(self._query)
        submission_id = self._submission_id

        return f"""\
Australian Microbiome OTU Database - OTU Export
-----------------------------------------------

{body_text}

The search was executed for:
{params.describe()}

Submission ID:
{submission_id}

---------------------------------------------------
How to cite Australian Microbiome data:
https://www.australianmicrobiome.com/protocols/acknowledgements/

Australian Microbiome data use policy:
https://www.australianmicrobiome.com/protocols/data-policy/
"""
