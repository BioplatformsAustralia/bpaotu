from bpaotu.celery import app

import logging
import os.path
import shutil
import time
import datetime
import uuid

from fastdist import fastdist
import numpy as np
import pandas as pd
import umap.umap_ as umap

from .params import param_to_filters, selected_contextual_filters
from .query import SampleQuery
from .submission import Submission

import json

logger = logging.getLogger('bpaotu')

@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))

@app.task(ignore_result=True)
def periodic_task():
    print('periodic_task')


@app.task()
def test_fastdist():
    print("init")
    results_file = open("/data/abundance_envlocal.csv")
    column_names = ['sample_id', 'otu_id', 'abundance']
    column_dtypes = { "sample_id": str, "otu_id": int, "abundance": int }
    df = pd.read_csv(results_file, header=None, names=column_names, dtype=column_dtypes)
    df = df.sort_values(by=['sample_id', 'otu_id'], ascending=[True, True])

    print(f"shape: {df.shape}")
    print(f"pivot start")
    rect_df = df.pivot(index="sample_id", columns="otu_id", values="abundance").fillna(0)

    print(f"fastdist start")
    start = time.time()
    dist_matrix = fastdist.matrix_pairwise_distance(rect_df.values, fastdist.braycurtis, "braycurtis", return_matrix=True)
    elapsed = time.time() - start

    print(f"fastdist braycurtis matrix took {elapsed:.2f} seconds")


def _status_update(submission, text):
    logger.info(f"Status: {text}")
    submission.status = text
    timestamps_ = json.loads(submission.timestamps)
    timestamps_.append({ text: time.time() })
    submission.timestamps = json.dumps(timestamps_)

def _in(_submission_dir, filename):
    "return path to filename within submission dir"
    return os.path.join(_submission_dir, filename)


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
    result = wrapper_setup_run.delay(submission_id, query, umap_params_string)

    submission.task_id = result.id

    return submission_id

@app.task
def cancel_sample_comparison(submission_id):
    submission = Submission(submission_id)
    # wrapper = _make_sample_comparison_wrapper(submission)

    try:
        wrapper_cancel(submission_id)
        # results = wrapper.cancel()
        submission.cancelled = 'true'
    except Exception as e:
        submission.status = 'error'
        submission.error = "%s" % (e)
        logger.warn("Error running sample comparison: %s" % (e))
        return submission_id

    return submission_id

@app.task
def cleanup_comparison(submission_id):
    submission = Submission(submission_id)

    # wrapper = _make_sample_comparison_wrapper(submission)
    # wrapper.cleanup()
    wrapper_cleanup(submission_id)

    return submission_id


@app.task()
def wrapper_setup_run(submission_id, _query, umap_params_string):
    ########
    SHARED_DIR = "/shared"
    _submission_id = submission_id
    _submission_dir = os.path.join(SHARED_DIR, _submission_id)

    #### setup(submission_id, _query, umap_params_string):
    submission = Submission(_submission_id)
    submission.timestamps = json.dumps([])
    submission.submission_dir = _submission_dir

    _status_update(submission, 'init')
    os.makedirs(_submission_dir, exist_ok=True)
    logger.info(f'Submission directory created: {_submission_dir}')

    #### _run(submission_id, query):
    submission = Submission(_submission_id)
    _params, _errors = param_to_filters(_query)
    umap_params = json.loads(umap_params_string)
    _param_min_dist = float(umap_params['min_dist'])
    _param_n_neighbors = int(umap_params['n_neighbors'])
    _param_spread = float(umap_params['spread'])

    _status_update(submission, 'fetch')
    results_file = _in(_submission_dir, 'abundance.csv')
    logger.info('Making abundance file')
    with open(results_file, 'w') as fd:
        with SampleQuery(_params) as query:
            for sample_id, otu_id, count in query.matching_sample_distance_matrix().yield_per(1000):
                fd.write('{},{},{}\n'.format(sample_id, otu_id, count))
    logger.info('Finished making abundance file')

    _status_update(submission, 'fetched_to_df')
    results_file = _in(_submission_dir, 'abundance.csv')
    column_names = ['sample_id', 'otu_id', 'abundance']
    column_dtypes = { "sample_id": str, "otu_id": int, "abundance": int }

    df = pd.read_csv(results_file, header=None, names=column_names, dtype=column_dtypes)

    df_actual_bytes = df.memory_usage(deep=True).sum()
    df_actual_mb = df_actual_bytes / (1024 ** 2)
    logger.info(f"Actual results df memory_usage: {df_actual_mb:.2f} MB")

    nunique_sample_id = df["sample_id"].nunique()
    nunique_otu_id = df["otu_id"].nunique()
    dtype_size = np.dtype(np.int64).itemsize

    logger.info(f'Pivot dimensions: {nunique_sample_id} x {nunique_otu_id} (sample_id x otu_id )')

    estimated_index_bytes = nunique_sample_id * 50 # size per sample is an estimate
    estimated_data_bytes = nunique_sample_id * nunique_otu_id * dtype_size
    estimated_bytes = estimated_index_bytes + estimated_data_bytes
    estimated_mb = estimated_bytes / (1024 ** 2)

    # does not include index
    logger.info(f"Estimated pivot memory usage: {estimated_mb:.2f} MB")

    _status_update(submission, 'sort')
    df = df.sort_values(by=['sample_id', 'otu_id'], ascending=[True, True])

    _status_update(submission, 'pivot')
    rect_df = (
        df.pivot(
            index='sample_id',
            columns='otu_id',
            values='abundance'
        )
        .fillna(0)
    )

    actual_bytes = rect_df.memory_usage(deep=True).sum()
    actual_mb = actual_bytes / (1024 ** 2)
    logger.info(f"Actual pivot memory_usage: {actual_mb:.2f} MB")

    _status_update(submission, 'calc_distances_bc')
    dist_matrix_braycurtis = fastdist.matrix_pairwise_distance(rect_df.values, fastdist.braycurtis, "braycurtis", return_matrix=True)

    def calc_umap(method, dist_matrix):
        dist_matrix_df = pd.DataFrame(dist_matrix, index=rect_df.index, columns=rect_df.index)

        n_neighbors = _param_n_neighbors
        spread = _param_spread
        min_dist = _param_min_dist

        reducer = umap.UMAP(n_components=2,
                            n_neighbors=n_neighbors,
                            spread=spread,
                            min_dist=min_dist,
                            metric='precomputed',
                            random_state=0)

        embeddings = reducer.fit_transform(dist_matrix_df.values)

        return method, pd.DataFrame(data=embeddings, columns=['dim1', 'dim2'], index=dist_matrix_df.index)

    _status_update(submission, 'calc_umap_bc')
    results_braycurtis_umap = calc_umap('braycurtis', dist_matrix_braycurtis)[1]

    # self._status_update(submission, 'calc_umap_j')
    # results_jaccard_umap = calc_umap('jaccard', dist_matrix_jaccard)[1]

    pairs_braycurtis_umap = list(zip(results_braycurtis_umap.dim1.values, results_braycurtis_umap.dim2.values))
    # pairs_jaccard_umap = list(zip(results_jaccard_umap.dim1.values, results_jaccard_umap.dim2.values))

    sample_ids = df['sample_id'].unique().tolist()
    otu_ids = df['otu_id'].unique().tolist()

    dist_matrix_jaccard = []
    pairs_jaccard_umap = []

    abundance_matrix = {
        'sample_ids': sample_ids,
        'otu_ids': otu_ids,
        'matrix_braycurtis': dist_matrix_braycurtis,
        'matrix_jaccard': dist_matrix_jaccard,
    }

    abundance_matrix['points'] = {
        'braycurtis': pairs_braycurtis_umap,
        'jaccard': pairs_jaccard_umap,
    }

    _status_update(submission, 'contextual_start')

    contextual_filtering = True
    additional_headers = selected_contextual_filters(_query, contextual_filtering=contextual_filtering)
    all_headers = ['id', 'am_environment_id', 'vegetation_type_id', 'imos_site_code', 'env_broad_scale_id', 'env_local_scale_id', 'ph',
                   'organic_carbon', 'nitrate_nitrogen', 'ammonium_nitrogen_wt', 'phosphorus_colwell', 'sample_type_id',
                   'temp', 'nitrate_nitrite', 'nitrite', 'chlorophyll_ctd', 'salinity', 'silicate'] + additional_headers
    all_headers_unique = list(set(all_headers))

    with SampleQuery(_params) as query:
        results = query.matching_sample_graph_data(all_headers_unique)

    sample_results = {}
    if results:
        ndata = np.array(results)

        for x in ndata:
            sample_id_column = all_headers_unique.index('id')
            sample_id = x[sample_id_column]
            sample_data = dict(zip(all_headers_unique, x.tolist()))
            sample_results[sample_id] = sample_data

    abundance_matrix.pop('matrix_jaccard', None)
    abundance_matrix.pop('matrix_braycurtis', None)

    abundance_path = os.path.join(_submission_dir, "abundance_matrix.json")
    contextual_path = os.path.join(_submission_dir, "contextual.json")

    with open(abundance_path, "w") as f:
        json.dump(abundance_matrix, f, cls=NumpyEncoder)

    with open(contextual_path, "w") as f:
        json.dump(sample_results, f, cls=NumpyEncoder)

    _status_update(submission, 'complete')

    results_files = {
        "abundance_matrix_file": abundance_path,
        "contextual_file": contextual_path
    }

    submission.results_files = json.dumps(results_files)

    return 'return value'


def wrapper_cancel(submission_id):
    submission = Submission(submission_id)

    try:
        # celery task ID was stored when chain was started
        task_id = submission.task_id
        app.control.revoke(task_id, terminate=True, signal='SIGKILL')
        _status_update(submission, 'cancelled')
        return True
    except Exception as e:
        print('error', e)
        logger.exception('Error in cancel sample comparison')
        return False

    wrapper_cleanup(submission_id);


def wrapper_cleanup(submission_id):
    submission = Submission(submission_id)
    submission_dir = submission.submission_dir

    try:
        shutil.rmtree(submission_dir)
        logger.info(f"Submission directory removed: {submission_dir}")
    except FileNotFoundError:
        logger.info(f"Could not remove submission directory (FileNotFoundError): {submission_dir}")




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
