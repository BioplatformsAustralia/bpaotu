import csv
import io
import logging
import os.path
import shutil
import subprocess
import json
from contextlib import suppress

import zipstream
from django.conf import settings

from . import views
from .otu import OTU, SampleContext, SampleOTU
from .query import SampleQuery
from .submission import Submission
from .util import format_sample_id
from celery.task.control import revoke

from fastdist import fastdist
import numpy as np
import pandas as pd
import umap.umap_ as umap


# debug
from time import sleep, time
from .util import log_msg

logger = logging.getLogger('bpaotu')


class SampleComparisonWrapper:
    def __init__(self, cwd, submission_id, status, query):
        self._cwd = cwd
        self._submission_id = submission_id
        self._status = status
        self._query = query
        self._params, _ = views.param_to_filters(query)

    def setup(self):
        submission = Submission(self._submission_id)
        submission.timestamps = json.dumps([])
        self._status_update(submission, 'init')

    def _status_update(self, submission, text):
        submission.status = text
        timestamps_ = json.loads(submission.timestamps)
        timestamps_.append({ text: time() })
        submission.timestamps = json.dumps(timestamps_)

    def _in(self, filename):
        "return path to filename within cwd"
        return os.path.join(self._cwd, filename)

    def run(self):
        return self._run()

    def cancel(self):
        return self._cancel()

    def cleanup(self):
        self._cleanup();

    def _check_result_size_ok(self, estimated_mb):
        max_size = settings.MAX_COMPARISON_PIVOT_SIZE_MB

        result = {
            'valid': True,
            'size': estimated_mb,
            'size_max': max_size,
            'error': None,
        }

        if estimated_mb > max_size:
            result['valid'] = False
            result['error'] = f'Search has too many elements: {nunique_sample_id} samples and {nunique_otu_id} OTUs for a matrix size of {estimated_mb:.2f} MB.<br />The maximum supported size is {max_size:.2f}.<br />Please choose a smaller search space or download OTU data and perform analysis locally'
        
        return result

    def _make_abundance_csv(self):
        logger.info('Making abundance file')
        results_file = self._in('abundance.csv')
        print('results_file', results_file)
        with open(results_file, 'w') as fd:
            with SampleQuery(self._params) as query:
                for sample_id, otu_id, count in query.matching_sample_distance_matrix().yield_per(1000):
                    fd.write('{},{},{}\n'.format(sample_id, otu_id, count))
        logger.info('Finished making abundance file')

    def _cancel(self):
        submission = Submission(self._submission_id)

        try:
            # celery task ID was stored when chain was started
            task_id = submission.task_id
            revoke(task_id, terminate=True)
            self._status_update(submission, 'cancelled')
            return True
        except Exception as e:
            print('error', e)
            logger.exception('Error in cancel sample comparison')
            return False

        self._cleanup();

    def _cleanup(self):
        try:
            shutil.rmtree(self._cwd)
        except FileNotFoundError:
            # directory doesn't exist
            pass
        except Exception:
            logger.exception('Error when cleaning up cwd: ({})'.format(self._cwd))

    def _run(self):
        # access the submission so we can change the status
        submission = Submission(self._submission_id)

        self._status_update(submission, 'fetch')
        log_msg('Fetching sample data')

        # make csv in /tmp dir with abundance data
        self._make_abundance_csv()

        # read abundance data into a dataframe
        self._status_update(submission, 'fetched_to_df')
        log_msg('start query results to df')
        results_file = self._in('abundance.csv')
        print(results_file)
        column_names = ['sample_id', 'otu_id', 'abundance']
        column_dtypes = { "sample_id": str, "otu_id": int, "abundance": int }

        df = pd.read_csv(results_file, header=None, names=column_names, dtype=column_dtypes)

        # keep df['sample_id'] as string type (since it is unique category type does not save space)
        df['otu_id'] = pd.to_numeric(df['otu_id'], downcast='unsigned')
        df['abundance'] = pd.to_numeric(df['abundance'], downcast='unsigned')

        log_msg(f'df.shape {df.shape}')

        nunique_sample_id = df["sample_id"].nunique()
        nunique_otu_id = df["otu_id"].nunique()
        dtype_size = np.dtype(np.uint32).itemsize

        log_msg(f'nunique df.sample_id: {nunique_sample_id}')
        log_msg(f'nunique df.otu_id:    {nunique_otu_id}')

        estimated_index_bytes = nunique_sample_id * 50 # size per sample is an estimate
        estimated_data_bytes = nunique_sample_id * nunique_otu_id * dtype_size
        estimated_bytes = estimated_index_bytes + estimated_data_bytes
        estimated_mb = estimated_bytes / (1024 ** 2)

        # does not include index
        log_msg(f"Estimated pivot memory usage: {estimated_bytes:,} bytes ({estimated_mb:.2f} MB)")
        
        check = self._check_result_size_ok(estimated_mb)
        if not check['valid']:
            self._status_update(submission, 'error')
            submission.error = check['error']
            return False

        self._status_update(submission, 'sort')
        df = df.sort_values(by=['sample_id', 'otu_id'], ascending=[True, True])

        self._status_update(submission, 'pivot')
        rect_df = df.pivot_table(
            index='sample_id',
            columns='otu_id',
            values='abundance',
            fill_value=0,
            aggfunc='first'
        ).astype(np.uint32)

        actual_bytes = rect_df.memory_usage(deep=True).sum()
        actual_mb = actual_bytes / (1024 ** 2)
        log_msg(f'rect_df.shape {rect_df.shape}')
        log_msg(f"Actual pivot memory_usage: {actual_bytes:,} bytes ({actual_mb:.2f} MB)")

        self._status_update(submission, 'calc_distances_bc')
        dist_matrix_braycurtis = fastdist.matrix_pairwise_distance(rect_df.values, fastdist.braycurtis, "braycurtis", return_matrix=True)

        self._status_update(submission, 'calc_distances_j')
        dist_matrix_jaccard = fastdist.matrix_pairwise_distance(rect_df.values, fastdist.jaccard, "jaccard", return_matrix=True)

        log_msg('dist_matrix_braycurtis.shape', dist_matrix_braycurtis.shape)
        log_msg('dist_matrix_jaccard.shape', dist_matrix_jaccard.shape)

        # TODO next release
        # - save matrix to a tmpdir
        # - keep using for umap until modal is closed (separate endpoint)
        # - timeout failsafe with no usage

        def umap_results(dist_matrix):
            #make a name for the output file
            #create an array from the df data

            dist_matrix_df = pd.DataFrame(dist_matrix, index=rect_df.index, columns=rect_df.index)

            reducer = umap.UMAP(n_components = 2, n_neighbors = 15, spread=1.0, min_dist=0.1, metric = 'precomputed', random_state = 0)
            embeddings = reducer.fit_transform(dist_matrix_df.values)
            plot_df = pd.DataFrame(data = embeddings, columns = ['dim1', 'dim2'], index=dist_matrix_df.index)
            
            return plot_df

        self._status_update(submission, 'calc_mds_bc')
        results_braycurtis_umap = umap_results(dist_matrix_braycurtis)
        pairs_braycurtis_umap = list(zip(results_braycurtis_umap.dim1.values, results_braycurtis_umap.dim2.values))

        self._status_update(submission, 'calc_mds_j')
        results_jaccard_umap = umap_results(dist_matrix_jaccard)
        pairs_jaccard_umap = list(zip(results_jaccard_umap.dim1.values, results_jaccard_umap.dim2.values))

        sample_ids = df['sample_id'].unique().tolist()
        otu_ids = df['otu_id'].unique().tolist()

        log_msg('sample_ids: ', len(sample_ids))
        log_msg('otu_ids: ', len(otu_ids))

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
        additional_headers = views.selected_contextual_filters(self._query, contextual_filtering=contextual_filtering)
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

        self._status_update(submission, 'complete')

        return {
            'abundanceMatrix': abundance_matrix,
            'contextual': sample_results
        }
