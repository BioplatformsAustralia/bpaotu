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
from .spatial import comparison_query
from .submission import Submission
from .util import format_sample_id

import numpy as np
import pandas as pd
from sklearn.manifold import MDS
from sklearn.metrics import pairwise_distances
from fastdist import fastdist

# debug
from time import sleep, time
from .util import log_msg

logger = logging.getLogger('rainbow')


class SampleComparisonWrapper:
    def __init__(self, submission_id, status, query, query_results = None, distance_results = None, mds_results = None):
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

    def run(self):
        return self._run()

    def cleanup(self):
        self._status_update(submission, 'complete')

    def _run(self):
        # access the submission so we can change the status
        submission = Submission(self._submission_id)

        logger.info('Fetching sample data')
        self._status_update(submission, 'fetch')
 
        log_msg('start comparison_query')
        results = comparison_query(self._params)

        logger.info(f'results length: {len(results)}')

        # local dev: 4316539 crashes (Acidobacteria)
        # if df.shape[0] > 1000000:
        #     return {
        #         'error': 'Too many rows'
        #     }

        log_msg('start query results to df')
        df = pd.DataFrame(results, columns=['sample_id', 'otu_id', 'abundance'])
        log_msg(f'df.shape {df.shape}', skip_mem=True)

        self._status_update(submission, 'sort')

        log_msg('start df sort')
        df = df.sort_values(by=['sample_id', 'otu_id'], ascending=[True, True])
        log_msg(f'df.shape {df.shape}', skip_mem=True)

        self._status_update(submission, 'pivot')

        log_msg('start df pivot')
        # this next line uses a lot of memory for a large result set
        rectangular_df = df.pivot(index='sample_id', columns='otu_id', values='abundance').fillna(0)
        log_msg(f'rectangular_df.shape {rectangular_df.shape}', skip_mem=True)

        self._status_update(submission, 'calc_distances')

        log_msg('start braycurtis matrix_pairwise_distance')
        dist_matrix_braycurtis = fastdist.matrix_pairwise_distance(rectangular_df.values, fastdist.braycurtis, "braycurtis", return_matrix=True)

        log_msg('start jaccard matrix_pairwise_distance')
        dist_matrix_jaccard = fastdist.matrix_pairwise_distance(rectangular_df.values, fastdist.jaccard, "jaccard", return_matrix=True)

        log_msg('matrix_pairwise_distance done')
        log_msg('dist_matrix_braycurtis.shape', dist_matrix_braycurtis.shape)
        log_msg('dist_matrix_jaccard.shape', dist_matrix_jaccard.shape)

        sample_ids = df['sample_id'].unique().tolist()
        otu_ids = df['otu_id'].unique().tolist()

        log_msg('sample_ids: ', len(sample_ids), skip_mem=True)
        log_msg('otu_ids: ', len(otu_ids), skip_mem=True)

        abundance_matrix = {
            'sample_ids': sample_ids,
            'otu_ids': otu_ids,
            'matrix_braycurtis': dist_matrix_braycurtis,
            'matrix_jaccard': dist_matrix_jaccard,
        }

        logger.info('Finished calculating distance matrices')

        dist_matrix_braycurtis = abundance_matrix['matrix_braycurtis']
        dist_matrix_jaccard = abundance_matrix['matrix_jaccard']

        def mds_results(dist_matrix):
            RANDOMSEED = np.random.RandomState(seed=2)

            log_msg('  MDS')
            mds = MDS(n_components=2, max_iter=1000, random_state=RANDOMSEED, dissimilarity="precomputed")
            mds_result = mds.fit_transform(dist_matrix)
            MDS_x_scores = mds_result[:,0]
            MDS_y_scores = mds_result[:,1]

            # calculate the normalized stress from sklearn stress
            # (https://stackoverflow.com/questions/36428205/stress-attribute-sklearn-manifold-mds-python)
            stress_norm_MDS = np.sqrt(mds.stress_ / (0.5 * np.sum(dist_matrix**2)))

            log_msg('  NMDS')
            # compute NMDS  ***inititial the start position of the nmds as the mds solution!!!!
            # dissimilarities = pairwise_distances(df.drop('class', axis=1), metric='euclidean')
            nmds = MDS(n_components=2, metric=False, max_iter=1000, dissimilarity="precomputed")
            nmds_result = nmds.fit_transform(dist_matrix, init=mds_result)
            NMDS_x_scores = nmds_result[:,0]
            NMDS_y_scores = nmds_result[:,1]

            # calculate the normalized stress from sklearn stress
            stress_norm_NMDS = np.sqrt(nmds.stress_ / (0.5 * np.sum(dist_matrix**2)))

            return {
                'MDS_x_scores': MDS_x_scores.tolist(),
                'MDS_y_scores': MDS_y_scores.tolist(),
                'NMDS_x_scores': NMDS_x_scores.tolist(),
                'NMDS_y_scores': NMDS_y_scores.tolist(),
                'stress_norm_MDS': stress_norm_MDS,
                'stress_norm_NMDS': stress_norm_NMDS,
            }

        self._status_update(submission, 'calc_mds')

        log_msg('start braycurtis calc')
        results_braycurtis = mds_results(dist_matrix_braycurtis)
        pairs_braycurtis_MDS = list(zip(results_braycurtis['MDS_x_scores'], results_braycurtis['MDS_y_scores']))
        pairs_braycurtis_NMDS = list(zip(results_braycurtis['NMDS_x_scores'], results_braycurtis['NMDS_y_scores']))
        stress_norm_braycurtis_MDS = results_braycurtis['stress_norm_MDS']
        stress_norm_braycurtis_NMDS = results_braycurtis['stress_norm_NMDS']

        log_msg('start jaccard calc')
        results_jaccard = mds_results(dist_matrix_jaccard)
        pairs_jaccard_MDS = list(zip(results_jaccard['MDS_x_scores'], results_jaccard['MDS_y_scores']))
        pairs_jaccard_NMDS = list(zip(results_jaccard['NMDS_x_scores'], results_jaccard['NMDS_y_scores']))
        stress_norm_jaccard_MDS = results_jaccard['stress_norm_MDS']
        stress_norm_jaccard_NMDS = results_jaccard['stress_norm_NMDS']

        abundance_matrix['points'] = {
            'braycurtis': pairs_braycurtis_MDS,
            'braycurtis_NMDS': pairs_braycurtis_NMDS,
            'stress_norm_braycurtis_MDS': stress_norm_braycurtis_MDS,
            'stress_norm_braycurtis_NMDS': stress_norm_braycurtis_NMDS,
            'jaccard': pairs_jaccard_MDS,
            'jaccard_NMDS': pairs_jaccard_NMDS,
            'stress_norm_jaccard_MDS': stress_norm_jaccard_MDS,
            'stress_norm_jaccard_NMDS': stress_norm_jaccard_NMDS,
        }

        self._status_update(submission, 'contextual')

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