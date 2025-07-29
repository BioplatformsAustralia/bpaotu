from bpaotu.celery import app

import logging
import uuid
import numpy as np
import pandas as pd

import json
import base64
import tempfile

from django.conf import settings
from .biom import save_biom_zip_file
from .blast import BlastWrapper
from .galaxy_client import get_users_galaxy
from .sample_meta import update_from_ckan
from .sample_comparison import SampleComparisonWrapper
from .submission import Submission


logger = logging.getLogger('bpaotu')


# Should be None but using a large number because task retrying forever aren't much fun
ALWAYS_RETRY = 1000

FILE_UPLOAD_STATUS_POLL_FREQUENCY = 5

# maximum length of a Galaxy history name
GALAXY_HISTORY_NAME_MAX = 255


##
## Misc Tasks
## 

@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))
    return "debug_task OK"

@app.task(ignore_result=True)
def periodic_ckan_update():
    update_from_ckan()


##
## BLAST Search
##

@app.task()
def submit_blast(submission_id, query, search_string, blast_params_string):
    submission = Submission.create(submission_id)

    submission.query = query
    submission.search_string = search_string
    submission.blast_params_string = blast_params_string

    chain = setup_blast.s() | run_blast.s()

    chain(submission_id)

    return submission_id

@app.task()
def setup_blast(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_blast_wrapper(submission)
    wrapper.setup()

    return submission_id

@app.task()
def run_blast(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_blast_wrapper(submission)
    fname, image_contents, row_count = wrapper.run()
    submission.result_url = settings.BLAST_RESULTS_URL + '/' + fname

    # if result has an image then encode image contents as a Base64 string
    image_base64 = ''
    if image_contents:
        image_base64 = base64.b64encode(image_contents).decode('utf-8')

    submission.image_contents = image_base64
    submission.row_count = row_count

    return submission_id

@app.task()
def cancel_blast(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_blast_wrapper(submission)
    wrapper.cancel()

    return submission_id

@app.task()
def cleanup_blast(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_blast_wrapper(submission)
    wrapper.cleanup()

    return submission_id

def _make_blast_wrapper(submission):
    return BlastWrapper(
        submission.submission_id, submission.query, submission.status, submission.search_string, submission.blast_params_string)


##
## Sample Comparison
##

@app.task()
def submit_sample_comparison(submission_id, query, umap_params_string):
    submission = Submission.create(submission_id)

    submission.status = 'init'
    submission.query = query
    submission.umap_params_string = umap_params_string

    # TODO:
    # split run into dist_bc, dist_j, umap_bc and umap_j
    # create group/chord/chain as needed
    # apply_async() ?
    chain = setup_comparison.s() | run_comparison.s()

    chain(submission_id)

    return submission_id

@app.task
def setup_comparison(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_sample_comparison_wrapper(submission)
    wrapper.setup()

    return submission_id

@app.task
def run_comparison(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_sample_comparison_wrapper(submission)
    wrapper.run()

    return submission_id

@app.task
def cancel_sample_comparison(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_sample_comparison_wrapper(submission)
    results = wrapper.cancel()

    return submission_id

@app.task
def cleanup_comparison(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_sample_comparison_wrapper(submission)
    wrapper.cleanup()

    return submission_id

def _make_sample_comparison_wrapper(submission):
    return SampleComparisonWrapper(
        submission.submission_id, submission.query, submission.status, submission.umap_params_string)


##
## Galaxy Submission
##

@app.task
def submit_to_galaxy(email, query):
    submission_id = create_galaxy_submission_object(email, query)
    upload_biom_to_history_chain(submission_id)

    return submission_id

@app.task
def execute_workflow_on_galaxy(email, query, workflow_id):
    submission_id = create_galaxy_submission_object(email, query)
    chain = upload_biom_to_history_chain | execute_workflow.s(workflow_id)
    chain(submission_id)

    return submission_id

@app.task
def save_biom_file(submission_id):
    submission = Submission(submission_id)

    # The OTUQueryParam doesn't support JSON serialisation, so we use the query
    # submitted by the user which is a string and we parse it into a query again here.
    # At this point the params were already validated by the submit_to_galaxy view.
    params, _ = param_to_filters(submission.query)
    biom_zip_file_name = save_biom_zip_file(params, tempfile.mkdtemp())
    submission.biom_zip_file_name = biom_zip_file_name

    return submission_id

@app.task
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

@app.task(bind=True, max_retries=ALWAYS_RETRY)
def check_upload_status(self, submission_id):
    submission = Submission(submission_id)

    galaxy = get_users_galaxy(submission.email)
    state = galaxy.histories.get_file_state(submission.history_id, submission.file_id)
    submission.upload_state = state

    finished = state in ('ok', 'error')
    if not finished:
        self.retry(countdown=FILE_UPLOAD_STATUS_POLL_FREQUENCY)

    return submission_id

@app.task
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


upload_biom_to_history_chain = (
    save_biom_file.s() | create_history_with_file.s() | check_upload_status.s() | delete_biom_file.s())

@app.task
def execute_workflow(submission_id, workflow_id):
    submission = Submission(submission_id)

    galaxy = get_users_galaxy(submission.email)
    galaxy.workflows.run_simple(workflow_id, submission.history_id, submission.file_id)

    return submission_id

def create_galaxy_submission_object(email, query):
    submission_id = str(uuid.uuid4())

    submission = Submission.create(submission_id)
    submission.query = query
    submission.email = email

    params, _ = param_to_filters(query)
    summary = params.summary()
    if len(summary) > GALAXY_HISTORY_NAME_MAX:
        summary = summary[:GALAXY_HISTORY_NAME_MAX - 3] + '...'
    submission.name = summary
    submission.annotation = params.describe()

    return submission_id
