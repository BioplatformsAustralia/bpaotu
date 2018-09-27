from celery import shared_task
import logging
import os
import uuid
import shutil
import tempfile

from .biom import save_biom_zip_file
from .galaxy import Submission
from .galaxy_client import get_users_galaxy, galaxy_ensure_user
from . import views


logger = logging.getLogger(__name__)


# Should be None but using a large number because task retrying forever aren't much fun
ALWAYS_RETRY = 1000

FILE_UPLOAD_STATUS_POLL_FREQUENCY = 5

# maximum length of a Galaxy history name
GALAXY_HISTORY_NAME_MAX = 255


@shared_task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))


@shared_task
def submit_to_galaxy(email, query):
    # note: we check this before we submit any tasks which
    # would implicitly create the user. the UI code needs
    # to inform their user to reset the password on their
    # new account
    new_galaxy_user = galaxy_ensure_user(email)

    submission_id = uuid.uuid4()

    submission = Submission.create(submission_id)
    submission.query = query
    submission.email = email

    params, _ = views.param_to_filters(query)
    summary = params.summary()
    if len(summary) > GALAXY_HISTORY_NAME_MAX:
        summary = summary[:GALAXY_HISTORY_NAME_MAX - 3] + '...'
    submission.name = summary
    submission.annotation = params.describe()

    chain = save_biom_file.s() | create_history_with_file.s() | check_upload_status.s() | delete_biom_file.s()

    chain(submission_id)

    return new_galaxy_user, submission_id


@shared_task
def save_biom_file(submission_id):
    submission = Submission(submission_id)

    # The OTUQueryParam doesn't support JSON serialisation, so we use the query
    # submitted by the user which is a string and we parse it into a query again here.
    # At this point the params were already validated by the submit_to_galaxy view.
    params, _ = views.param_to_filters(submission.query)
    biom_zip_file_name = save_biom_zip_file(params, tempfile.mkdtemp())
    submission.biom_zip_file_name = biom_zip_file_name

    return submission_id


@shared_task
def create_history_with_file(submission_id):
    submission = Submission(submission_id)
    full_file_name = submission.biom_zip_file_name

    galaxy = get_users_galaxy(submission.email)
    history = galaxy.histories.create(submission.name)
    history['annotation'] = submission.annotation
    galaxy.histories.update(history)
    submission.history_id = history.get('id')

    filename = os.path.split(full_file_name)[1]
    file_id = galaxy.histories.upload_file(history.get('id'), full_file_name, filename, file_type='biom1')

    submission.file_id = file_id

    return submission_id


@shared_task(bind=True, max_retries=ALWAYS_RETRY)
def check_upload_status(self, submission_id):
    submission = Submission(submission_id)

    galaxy = get_users_galaxy(submission.email)
    state = galaxy.histories.get_file_state(submission.history_id, submission.file_id)
    submission.upload_state = state

    finished = state in ('ok', 'error')
    if not finished:
        self.retry(countdown=FILE_UPLOAD_STATUS_POLL_FREQUENCY)

    return submission_id


@shared_task
def delete_biom_file(submission_id):
    submission = Submission(submission_id)
    biom_file_name = submission.biom_zip_file_name

    if not os.path.exists(biom_file_name):
        logger.warning("Trying to delete biom file '%s', but it doesn't exist.", biom_file_name)
        return submission_id
    dir_name = os.path.split(biom_file_name)[0]
    try:
        shutil.rmtree(dir_name)
    except Exception:
        logger.exception('Error when deleting biom zip file (%s)' % biom_file_name)

    return submission_id


# Keeping workflow submission code for future reference:

    # wfl = users_galaxy.workflows.submit(
    #     workflow_id=workflow.get('id'),
    #     history_id=history.get('id'),
    #     file_ids={'0': file_id})

    # wfl_data = {k: v for k, v in wfl.items() if k in ('workflow_id', 'history', 'state')}
