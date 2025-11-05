from celery import shared_task

import os
import time
import logging
import uuid
import numpy as np
import pandas as pd

import json
import tempfile

from django.conf import settings
from .biom import save_biom_zip_file
from .blast import BlastWrapper
from .galaxy_client import get_users_galaxy
from .otu import SampleContext
from .otu_export import OtuExportWrapper
from .params import param_to_filters
from .query import SampleQuery
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
## Periodic Tasks
## 

@shared_task(ignore_result=True)
def periodic_ckan_update():
    update_from_ckan()

@shared_task(ignore_result=True)
def periodic_download_results_cleanup():
    if not settings.PERIODIC_DOWNLOAD_RESULTS_CLEANUP_EXPIRY > 0:
        logger.info('Skipping check for outdated download packets to remove')
        return
    
    logger.info('Checking for outdated download packets to remove')

    now = time.time()

    DIRECTORIES = ['/data/blast-output', '/data/otu-export']
    for directory in DIRECTORIES:
        for root, dirs, files in os.walk(directory):
            for filename in files:
                filepath = os.path.join(root, filename)
                if now - os.path.getmtime(filepath) > settings.PERIODIC_DOWNLOAD_RESULTS_CLEANUP_EXPIRY:
                    try:
                        logger.info(f"Deleting: {filepath}")
                        os.remove(filepath)
                    except FileNotFoundError:
                        logger.warning(f"File already removed: {filepath}")
                    except PermissionError:
                        logger.error(f"Permission denied deleting file: {filepath}")
                    except OSError as e:
                        logger.error(f"Error deleting file {filepath}: {e}")


##
## OTU Export
##

@shared_task()
def submit_otuexport(submission_id, query):
    submission = Submission.create(submission_id)

    submission.query = query

    chain = setup_otuexport.s() | run_otuexport.s()

    chain(submission_id)

    return submission_id

@shared_task()
def setup_otuexport(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_otuexport_wrapper(submission)
    wrapper.setup()

    return submission_id

@shared_task()
def run_otuexport(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_otuexport_wrapper(submission)
    wrapper.run()

    return submission_id

@shared_task()
def cancel_otuexport(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_otuexport_wrapper(submission)
    wrapper.cancel()

    return submission_id

@shared_task()
def cleanup_otuexport(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_otuexport_wrapper(submission)
    wrapper.cleanup()

    return submission_id

@shared_task()
def notify_otuexport(submission_id, full_url, user_email):
    submission = Submission(submission_id)
    wrapper = _make_otuexport_wrapper(submission)
    wrapper.notify(full_url, user_email)

    return submission_id

def _make_otuexport_wrapper(submission):
    return OtuExportWrapper(
        submission.submission_id, submission.query, submission.status)


##
## BLAST Search
##

@shared_task()
def submit_blast(submission_id, query, search_string, blast_params_string):
    submission = Submission.create(submission_id)

    submission.status = 'init'
    submission.query = query
    submission.search_string = search_string
    submission.blast_params_string = blast_params_string

    chain = setup_blast.s() | run_blast.s()

    chain(submission_id)

    return submission_id

@shared_task()
def setup_blast(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_blast_wrapper(submission)
    wrapper.setup()

    return submission_id

@shared_task()
def run_blast(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_blast_wrapper(submission)
    wrapper.run()

    return submission_id

@shared_task()
def cancel_blast(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_blast_wrapper(submission)
    wrapper.cancel()

    return submission_id

@shared_task()
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


# TODO:
# split chain run into dist_bc, dist_j, umap_bc and umap_j
# create group/chord/chain as needed
# separate tasks so they can run at the same time
# apply_async() ?

@shared_task()
def submit_sample_comparison(submission_id, query, umap_params_string):
    submission = Submission.create(submission_id)

    submission.status = 'init'
    submission.query = query
    submission.umap_params_string = umap_params_string

    chain = setup_sample_comparison.s() | run_sample_comparison.s()

    chain(submission_id)

    return submission_id

@shared_task()
def submit_sample_comparison_params_changed(submission_id, query, umap_params_string):
    submission = Submission(submission_id)

    # check if submission already has a query associated
    # (there's a chance this could be run with a fresh query)
    # if the new query is the same then just redo umap point
    # if the new query is different then determine if it would change the result set
    # - if not, then just rebuild the contextual and redo umap points
    # - if so, then do a full new run
    if submission.query:
        # logger.debug('submission has query')
        if submission.query == query:
            # logger.debug('submission query is same as new query')
            chain = run_sample_comparison_params_changed.s()
        else:
            # logger.debug('submission query is different to new query')
            params1, errors1 = param_to_filters(submission.query)
            params2, errors2 = param_to_filters(query)
            ids1 = get_sorted_sample_ids(params1)
            ids2 = get_sorted_sample_ids(params2)

            if ids1 == ids2:
                # logger.debug('different queries have the same samples')
                # rebuild contextual data first then run comparison from umap stage
                chain = run_sample_comparison_contextual.s() | run_sample_comparison_params_changed.s()
            else:
                # logger.debug('different queries have different samples')
                # run full submit_sample_comparison instead
                return submit_sample_comparison.delay(submission_id, query, umap_params_string)

        submission.reset()
        submission.status = 'reload'
        submission.query = query
        submission.umap_params_string = umap_params_string

        chain(submission_id)

        return submission_id
    else:
        # logger.debug('submission has no query')
        # submission has no query; run submit_sample_comparison from scratch instead
        return submit_sample_comparison.delay(submission_id, query, umap_params_string)

@shared_task
def setup_sample_comparison(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_sample_comparison_wrapper(submission)
    wrapper.setup()

    return submission_id

@shared_task
def run_sample_comparison(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_sample_comparison_wrapper(submission)
    try:
        wrapper.run()
    except ValueError as e:
        if "min_dist must be less than or equal to spread" in str(e):
            submission.error = str(e)
        else:
            raise # re-raise unexpected ValueErrors

    return submission_id

@shared_task
def run_sample_comparison_contextual(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_sample_comparison_wrapper(submission)
    wrapper.run_contextual_only()

    return submission_id

@shared_task
def run_sample_comparison_params_changed(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_sample_comparison_wrapper(submission)
    try:
        wrapper.run_params_changed()
    except FileNotFoundError as e:
        # fallback to normal run_sample_comparison if file (or directory) is not found
        # note that we run the setup task again to ensure the directory exists
        logger.warning(f"Params-changed run failed, falling back to full run for submission {submission_id}")

        chain = setup_sample_comparison.s() | run_sample_comparison.s()
        chain(submission_id)

        return submission_id
    except ValueError as e:
        submission.error = str(e)
        logger.error(str(e))

    return submission_id

@shared_task
def cancel_sample_comparison(submission_id):
    submission = Submission(submission_id)
    wrapper = _make_sample_comparison_wrapper(submission)
    wrapper.cancel()

    return submission_id

@shared_task
def cleanup_sample_comparison(submission_id):
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

@shared_task
def submit_to_galaxy(email, query):
    submission_id = create_galaxy_submission_object(email, query)
    upload_biom_to_history_chain(submission_id)

    return submission_id

@shared_task
def execute_workflow_on_galaxy(email, query, workflow_id):
    submission_id = create_galaxy_submission_object(email, query)
    chain = upload_biom_to_history_chain | execute_workflow.s(workflow_id)
    chain(submission_id)

    return submission_id

@shared_task
def save_biom_file(submission_id):
    submission = Submission(submission_id)

    # The OTUQueryParam doesn't support JSON serialisation, so we use the query
    # submitted by the user which is a string and we parse it into a query again here.
    # At this point the params were already validated by the submit_to_galaxy view.
    params, _ = param_to_filters(submission.query)
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


upload_biom_to_history_chain = (
    save_biom_file.s() | create_history_with_file.s() | check_upload_status.s() | delete_biom_file.s())

@shared_task
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


def get_sorted_sample_ids(params):
    with SampleQuery(params) as query:
        ids = [r[0] for r in query.matching_samples(SampleContext.id)]
        return sorted(ids, key=lambda v: (0, int(v)) if v.isdecimal() else (1, v))
