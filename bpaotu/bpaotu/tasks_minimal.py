from celery import shared_task

import logging
import os.path
import shutil
import time
import uuid

# from .submission import Submission

from fastdist import fastdist
import numpy as np
import pandas as pd
import umap.umap_ as umap

logger = logging.getLogger('bpaotu')

@shared_task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))

@shared_task(ignore_result=True)
def periodic_task():
    print('periodic_task')



def _status_update(submission, text):
    logger.info(f"Status: {text}")
    # submission.status = text
    # timestamps_ = json.loads(submission.timestamps)
    # timestamps_.append({ text: time() })
    # submission.timestamps = json.dumps(timestamps_)

def _in(_submission_dir, filename):
    "return path to filename within submission dir"
    return os.path.join(_submission_dir, filename)

@shared_task(bind=True)
def test_fastdist(self):
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


@shared_task()
def fastdist_task():
    ########
    SHARED_DIR = "/shared"
    submission_id = str(uuid.uuid4())
    _submission_id = submission_id
    _submission_dir = os.path.join(SHARED_DIR, _submission_id)
    # _params = params

    #### setup(self):
    submission = {} # Submission(_submission_id)
    # submission.timestamps = json.dumps([])

    _status_update(submission, 'init')
    print("asdf")
    os.makedirs(_submission_dir, exist_ok=True)
    logger.info(f'Submission directory created: {_submission_dir}')

    # #### _run(self):
    # _status_update(submission, 'fetch')
    # results_file = _in(_submission_dir, 'abundance.csv')
    # logger.info('Making abundance file')
    # with open(results_file, 'w') as fd:
    #     with SampleQuery(_params) as query:
    #         for sample_id, otu_id, count in query.matching_sample_distance_matrix().yield_per(1000):
    #             fd.write('{},{},{}\n'.format(sample_id, otu_id, count))
    # logger.info('Finished making abundance file')

    shutil.copy(os.path.join('/app/data/dev', 'abundance_envlocal.csv'), _in(_submission_dir, 'abundance.csv'))

    _status_update(submission, 'fetched_to_df')
    results_file = _in(_submission_dir, 'abundance.csv')
    column_names = ['sample_id', 'otu_id', 'abundance']
    column_dtypes = { "sample_id": str, "otu_id": int, "abundance": int }

    df = pd.read_csv(results_file, header=None, names=column_names, dtype=column_dtypes)

    df_actual_bytes = df.memory_usage(deep=True).sum()
    df_actual_mb = df_actual_bytes / (1024 ** 2)
    logger.info(f"Actual results df memory_usage: {df_actual_bytes:,} bytes ({df_actual_mb:.2f} MB)")

    nunique_sample_id = df["sample_id"].nunique()
    nunique_otu_id = df["otu_id"].nunique()
    dtype_size = np.dtype(np.int64).itemsize

    logger.info(f'nunique df.sample_id: {nunique_sample_id}')
    logger.info(f'nunique df.otu_id:    {nunique_otu_id}')

    estimated_index_bytes = nunique_sample_id * 50 # size per sample is an estimate
    estimated_data_bytes = nunique_sample_id * nunique_otu_id * dtype_size
    estimated_bytes = estimated_index_bytes + estimated_data_bytes
    estimated_mb = estimated_bytes / (1024 ** 2)

    # does not include index
    logger.info(f"Estimated pivot memory usage: {estimated_bytes:,} bytes ({estimated_mb:.2f} MB)")

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
    logger.info(f"   Actual pivot memory_usage: {actual_bytes:,} bytes ({actual_mb:.2f} MB)")

    _status_update(submission, 'calc_distances_bc')
    dist_matrix_braycurtis = fastdist.matrix_pairwise_distance(rect_df.values, fastdist.braycurtis, "braycurtis", return_matrix=True)

    _status_update(submission, 'complete')

