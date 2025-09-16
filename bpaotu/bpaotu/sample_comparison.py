from bpaotu.celery import app

import os.path
import logging
import shutil
import json
import io
from time import time

from django.conf import settings

from django.db import connection
from psycopg2.extensions import adapt

from .params import param_to_filters, selected_contextual_filters
from .query import SampleQuery
from .submission import Submission
from .task_utils import NumpyEncoder, find_task_id_for_submission

import numpy as np
import pandas as pd

# debug
from .util import log_msg

logger = logging.getLogger('bpaotu')

SHARED_DIR = "/data/shared/comparison"

class SampleComparisonWrapper:
    def __init__(self, submission_id, query, status, umap_params_string):
        self._submission_id = submission_id
        self._status = status
        self._query = query
        self._params, _ = param_to_filters(query)
        umap_params = json.loads(umap_params_string)
        self._param_min_dist = float(umap_params['min_dist'])
        self._param_n_neighbors = int(umap_params['n_neighbors'])
        self._param_spread = float(umap_params['spread'])
        self._submission_dir = os.path.join(SHARED_DIR, submission_id)


    def _status_update(self, submission, text):
        this_timestamp = time()
        timestamps_ = json.loads(submission.timestamps)

        # log with time taken since last status update
        if timestamps_:
            prev_step = timestamps_[-1]
            prev_label, prev_timestamp = list(prev_step.items())[0]
            step_duration = this_timestamp - prev_timestamp
            logger.info(f"Status: {text} ({prev_label} took {step_duration:.1f}s)")
        else:
            logger.info(f"Status: {text}")

        # append new timestampe and update submission
        timestamps_.append({ text: this_timestamp })
        submission.status = text
        submission.timestamps = json.dumps(timestamps_)

    def _in(self, filename):
        "return path to filename within submission dir"
        return os.path.join(self._submission_dir, filename)


    def setup(self):
        return self._setup()

    def run(self):
        return self._run()

    def cancel(self):
        return self._cancel()

    def cleanup(self):
        self._cleanup();


    def _setup(self):
        submission = Submission(self._submission_id)
        submission.timestamps = json.dumps([])

        self._status_update(submission, 'init')
        os.makedirs(self._submission_dir, exist_ok=True)
        logger.info(f'Submission directory created: {self._submission_dir}')

    def _cancel(self):
        submission = Submission(self._submission_id)

        try:
            task_id = find_task_id_for_submission(self._submission_id)
            if task_id:
                app.control.revoke(task_id, terminate=True, signal='SIGKILL')

                self._status_update(submission, 'cancelled')
                submission.cancelled = 'true'
                return True
        except Exception as e:
            print('error', e)
            logger.exception('Error in cancel sample comparison')
            return False

        self._cleanup();

    def _cleanup(self):
        try:
            shutil.rmtree(self._submission_dir)
            logger.info(f"Submission directory removed: {self._submission_dir}")
        except FileNotFoundError:
            logger.info(f"Could not remove submission directory (FileNotFoundError): {self._submission_dir}")


    def _estimate_pivot_size(self, df):
        nunique_sample_id = df["sample_id"].nunique()
        nunique_otu_id = df["otu_id"].nunique()
        dtype_size = np.dtype(np.int64).itemsize
        logger.info(f'Pivot dimensions: {nunique_sample_id} x {nunique_otu_id} (sample_id x otu_id )')

        estimated_index_bytes = nunique_sample_id * 50 # size per sample is an estimate
        estimated_data_bytes = nunique_sample_id * nunique_otu_id * dtype_size
        estimated_bytes = estimated_index_bytes + estimated_data_bytes
        estimated_mb = estimated_bytes / (1024 ** 2)
        logger.info(f"Estimated pivot memory usage: {estimated_mb:.2f} MB")

        return nunique_sample_id, nunique_otu_id, estimated_mb


    def _check_result_size_ok(self, estimated_mb):
        max_size = settings.COMPARISON_PIVOT_MAX_SIZE_MB

        result = {
            'valid': True,
            'size': estimated_mb,
            'size_max': max_size,
        }

        if estimated_mb > max_size:
            result['valid'] = False

        return result


    def _build_abundance_dataframe(self):
        logger.info('Building abundance dataframe in memory')

        submission = Submission(self._submission_id)
        self._status_update(submission, 'fetch')

        # query to raw SQL and params
        with SampleQuery(self._params) as query:
            q = query.matching_sample_distance_matrix()
            compiled = q.statement.compile(compile_kwargs={"render_postcompile": True})
            raw_sql = compiled.string
            params = compiled.params  # dictionary of bound values

        # safely interpolate with psycopg2
        # this escapes identifiers and literals properly
        for key, val in params.items():
            raw_sql = raw_sql.replace(f":{key}", adapt(val).getquoted().decode())

        # wrap sql in COPY and save directly to dataframe with io buffer
        # note: StringIO is much slower than BytesIO
        # (similar to saving to disk as csv and then reading back in)
        copy_sql = f"COPY ({raw_sql}) TO STDOUT WITH CSV"
        buff = io.BytesIO()
        with connection.cursor() as cursor:
            cursor.copy_expert(copy_sql, buff)

        buff.seek(0)

        self._status_update(submission, 'fetched_to_df')
        column_names = ['sample_id', 'otu_id', 'abundance']
        column_dtypes = { "sample_id": str, "otu_id": int, "abundance": int }

        return pd.read_csv(buff, header=None, names=column_names, dtype=column_dtypes)


    def _run(self):
        # access the submission so we can change the status
        submission = Submission(self._submission_id)

        from fastdist import fastdist
        import umap.umap_ as umap # this takes a while
        
        _params, _errors = param_to_filters(self._query)

        df = self._build_abundance_dataframe()

        nunique_sample_id, nunique_otu_id, estimated_mb = self._estimate_pivot_size(df)
        check = self._check_result_size_ok(estimated_mb)

        if not check['valid']:
            self._status_update(submission, 'error')
            submission.error = (
                f'Search has too many elements: {nunique_sample_id} samples and {nunique_otu_id} '
                f'OTUs for a matrix size of {estimated_mb:.2f} MB.<br />The maximum supported size '
                f'is {check["size_max"]} MB.<br />Please choose a smaller search space or download '
                f'OTU data and perform analysis locally.'
            )

            return False

        self._status_update(submission, 'sort')
        df = df.sort_values(by=['sample_id', 'otu_id'], ascending=[True, True])

        self._status_update(submission, 'pivot')
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

        self._status_update(submission, 'calc_distances_bc')
        dist_matrix_braycurtis = fastdist.matrix_pairwise_distance(rect_df.values, fastdist.braycurtis, "braycurtis", return_matrix=True)

        # self._status_update(submission, 'calc_distances_j')
        # dist_matrix_jaccard = fastdist.matrix_pairwise_distance(rect_df.values, fastdist.jaccard, "jaccard", return_matrix=True)

        def calc_umap(method, dist_matrix):
            dist_matrix_df = pd.DataFrame(dist_matrix, index=rect_df.index, columns=rect_df.index)

            n_neighbors = self._param_n_neighbors
            spread = self._param_spread
            min_dist = self._param_min_dist

            reducer = umap.UMAP(n_components=2,
                                n_neighbors=n_neighbors,
                                spread=spread,
                                min_dist=min_dist,
                                metric='precomputed',
                                random_state=0)

            embeddings = reducer.fit_transform(dist_matrix_df.values)

            return method, pd.DataFrame(data=embeddings, columns=['dim1', 'dim2'], index=dist_matrix_df.index)


        self._status_update(submission, 'calc_umap_bc')
        results_braycurtis_umap = calc_umap('braycurtis', dist_matrix_braycurtis)[1]

        # self._status_update(submission, 'calc_umap_j')
        # results_jaccard_umap = calc_umap('jaccard', dist_matrix_jaccard)[1]

        pairs_braycurtis_umap = list(zip(results_braycurtis_umap.dim1.values, results_braycurtis_umap.dim2.values))
        # pairs_jaccard_umap = list(zip(results_jaccard_umap.dim1.values, results_jaccard_umap.dim2.values))

        sample_ids = rect_df.index.tolist()
        otu_ids = rect_df.columns.tolist()

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

        self._status_update(submission, 'contextual_start')

        contextual_filtering = True
        additional_headers = selected_contextual_filters(self._query, contextual_filtering=contextual_filtering)
        all_headers = ['id', 'am_environment_id', 'vegetation_type_id', 'imos_site_code', 'env_broad_scale_id', 'env_local_scale_id', 'ph',
                       'organic_carbon', 'nitrate_nitrogen', 'ammonium_nitrogen_wt', 'phosphorus_colwell', 'sample_type_id',
                       'temp', 'nitrate_nitrite', 'nitrite', 'chlorophyll_ctd', 'salinity', 'silicate'] + additional_headers
        all_headers_unique = list(set(all_headers))


        with SampleQuery(self._params) as query:
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

        abundance_path = self._in("abundance_matrix.json")
        contextual_path = self._in("contextual.json")

        with open(abundance_path, "w") as f:
            json.dump(abundance_matrix, f, cls=NumpyEncoder)

        with open(contextual_path, "w") as f:
            json.dump(sample_results, f, cls=NumpyEncoder)

        results_files = {
            "abundance_matrix_file": abundance_path,
            "contextual_file": contextual_path
        }

        submission.results_files = json.dumps(results_files)

        self._status_update(submission, 'complete')

        return True

