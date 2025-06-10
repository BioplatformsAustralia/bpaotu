from celery import shared_task
import logging
import json
import numpy as np
import os
import uuid
import shutil
import tempfile
import base64
from django.conf import settings

from .blast import BlastWrapper
from .sample_comparison import SampleComparisonWrapper
from .biom import save_biom_zip_file
from .submission import Submission
from .galaxy_client import get_users_galaxy
from . import views


logger = logging.getLogger('bpaotu')


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
    submission_id = _create_submission_object(email, query)
    upload_biom_to_history_chain(submission_id)

    return submission_id


@shared_task
def execute_workflow_on_galaxy(email, query, workflow_id):
    submission_id = _create_submission_object(email, query)
    chain = upload_biom_to_history_chain | execute_workflow.s(workflow_id)
    chain(submission_id)

    return submission_id




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


@shared_task
def execute_workflow(submission_id, workflow_id):
    submission = Submission(submission_id)

    galaxy = get_users_galaxy(submission.email)
    galaxy.workflows.run_simple(workflow_id, submission.history_id, submission.file_id)

    return submission_id


upload_biom_to_history_chain = (
    save_biom_file.s() | create_history_with_file.s() | check_upload_status.s() | delete_biom_file.s())


@shared_task
def submit_blast(search_string, blast_params_string, query):
    submission_id = str(uuid.uuid4())

    submission = Submission.create(submission_id)
    submission.query = query
    submission.search_string = search_string
    submission.blast_params_string = blast_params_string

    chain = setup_blast.s() | run_blast.s() | cleanup_blast.s()

    chain(submission_id)

    return submission_id

@shared_task
def setup_blast(submission_id):
    submission = Submission(submission_id)
    submission.cwd = tempfile.mkdtemp()
    wrapper = _make_blast_wrapper(submission)
    wrapper.setup()
    return submission_id


@shared_task
def run_blast(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_blast_wrapper(submission)
    fname, image_contents = wrapper.run()
    submission.result_url = settings.BLAST_RESULTS_URL + '/' + fname

    # if result has an image then encode image contents as a Base64 string
    image_base64 = ''
    if image_contents:
        image_base64 = base64.b64encode(image_contents).decode('utf-8')

    submission.image_contents = image_base64
    return submission_id


@shared_task
def cleanup_blast(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_blast_wrapper(submission)
    wrapper.cleanup()
    return submission_id


@shared_task(bind=True)
def submit_sample_comparison(self, query, umap_params_string):
    submission_id = str(uuid.uuid4())

    submission = Submission.create(submission_id)
    submission.status = 'init'
    submission.query = query
    submission.umap_params_string = umap_params_string

    # Ensure asynchronous execution and store the task ID
    chain = setup_comparison.s() | run_comparison.s() | cleanup_comparison.s()

    chain(submission_id)

    return submission_id


@shared_task
def cancel_sample_comparison(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_sample_comparison_wrapper(submission)

    try:
        results = wrapper.cancel()
    except Exception as e:
        submission.status = 'error'
        submission.error = "%s" % (e)
        logger.warn("Error running sample comparison: %s" % (e))
        return submission_id

    return results


@shared_task
def setup_comparison(submission_id):
    submission = Submission(submission_id)
    submission.cwd = tempfile.mkdtemp()
    wrapper = _make_sample_comparison_wrapper(submission)
    wrapper.setup()
    return submission_id

@shared_task(bind=True)
def run_comparison(self, submission_id):
    submission = Submission(submission_id)
    wrapper = _make_sample_comparison_wrapper(submission)

    try:
        results = wrapper.run()
        submission.results = json.dumps(results, cls=NumpyEncoder)
    except MemoryError as e:
        submission.status = 'error'
        submission.error = "Out of Memory: %s" % e
        logger.error(f"MemoryError running comparison: {e}")
    except ValueError as e:
        submission.status = 'error'
        print(str(e))
        submission.error = "Out of Memory: %s" % e
        logger.error(f"ValueError running comparison: {e}")
    # except Exception as e:
    #     print('Exception')
    #     print(e)
    #     submission.status = 'error'
    #     submission.error = "%s" % (e)
    #     logger.info("Error running sample comparison: %s" % (e))

    return submission_id

@shared_task
def cleanup_comparison(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_sample_comparison_wrapper(submission)
    wrapper.cleanup()
    return submission_id


def _create_submission_object(email, query):
    submission_id = str(uuid.uuid4())

    submission = Submission.create(submission_id)
    submission.query = query
    submission.email = email

    params, _ = views.param_to_filters(query)
    summary = params.summary()
    if len(summary) > GALAXY_HISTORY_NAME_MAX:
        summary = summary[:GALAXY_HISTORY_NAME_MAX - 3] + '...'
    submission.name = summary
    submission.annotation = params.describe()

    return submission_id


def _make_blast_wrapper(submission):
    return BlastWrapper(
        submission.cwd, submission.submission_id, submission.search_string, submission.blast_params_string, submission.query)

def _make_sample_comparison_wrapper(submission):
    return SampleComparisonWrapper(
        submission.cwd, submission.submission_id, submission.status, submission.query, submission.umap_params_string)


import datetime

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

