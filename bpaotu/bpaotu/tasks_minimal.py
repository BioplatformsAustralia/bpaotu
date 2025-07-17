from bpaotu.celery import app

import logging
import uuid
import numpy as np
import pandas as pd

import json
import base64

from django.conf import settings
from .blast import BlastWrapper
from .sample_comparison import SampleComparisonWrapper
from .submission import Submission


logger = logging.getLogger('bpaotu')

@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))

@app.task(ignore_result=True)
def periodic_task():
    print('periodic_task')


## BLAST Search

@app.task()
def submit_blast(submission_id, query, search_string, blast_params_string):
    submission = Submission.create(submission_id)

    submission.query = query
    submission.search_string = search_string
    submission.blast_params_string = blast_params_string

    chain = setup_blast.s() | run_blast.s() | cleanup_blast.s()

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
    fname, image_contents = wrapper.run()
    submission.result_url = settings.BLAST_RESULTS_URL + '/' + fname

    # if result has an image then encode image contents as a Base64 string
    image_base64 = ''
    if image_contents:
        image_base64 = base64.b64encode(image_contents).decode('utf-8')

    submission.image_contents = image_base64
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


## Sample Comparison

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

