import io
import json

from django.conf import settings
from django.db import connection
from psycopg2.extensions import adapt

from .base_task_wrapper import BaseTaskWrapper
from .params import param_to_filters, selected_contextual_filters
from .query import SampleQuery
from .submission import Submission
from .task_utils import NumpyEncoder

import numpy as np
import pandas as pd

# debug
from .util import log_msg

class SampleComparisonWrapper(BaseTaskWrapper):
    def __init__(self, submission_id, query, status, umap_params_string):
        super().__init__(submission_id, status, "comparison")
        self._query = query
        self._params, _ = param_to_filters(query)
        umap_params = json.loads(umap_params_string)
        self._param_min_dist = float(umap_params['min_dist'])
        self._param_n_neighbors = int(umap_params['n_neighbors'])
        self._param_spread = float(umap_params['spread'])

    def run_params_changed(self):
        self._run_params_changed()

    def _estimate_pivot_size(self, df):
        nunique_sample_id = df["sample_id"].nunique()
        nunique_otu_id = df["otu_id"].nunique()
        dtype_size = np.dtype(np.int64).itemsize
        self._log('info', f"Pivot dimensions: {nunique_sample_id} x {nunique_otu_id} (sample_id x otu_id )")

        estimated_index_bytes = nunique_sample_id * 50 # size per sample is an estimate
        estimated_data_bytes = nunique_sample_id * nunique_otu_id * dtype_size
        estimated_bytes = estimated_index_bytes + estimated_data_bytes
        estimated_mb = estimated_bytes / (1024 ** 2)
        self._log('info', f"Estimated pivot memory usage: {estimated_mb:.2f} MB")

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
        self._log('info', "Building abundance dataframe in memory")

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
        submission = Submission(self._submission_id)
        
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
        self._log('info', f"Actual pivot memory_usage: {actual_mb:.2f} MB")

        # this is the sample_ids
        rect_index = rect_df.index

        dist_matrix_braycurtis, dist_matrix_jaccard = self._calc_distance_matrices(rect_df)

        pairs_braycurtis_umap, pairs_jaccard_umap = self._calc_umap_embeddings(rect_index, dist_matrix_braycurtis, dist_matrix_jaccard)

        abundance_matrix = {
            'sample_ids': rect_index.tolist(),
            'points': {
                'braycurtis': pairs_braycurtis_umap,
                'jaccard': pairs_jaccard_umap
            }
        }

        abundance_path = self._in("abundance_matrix.json")
        with open(abundance_path, "w") as f:
            json.dump(abundance_matrix, f, cls=NumpyEncoder)

        contextual_path = self._attach_contextual()

        submission.results_files = json.dumps({
            "abundance_matrix_file": abundance_path,
            "contextual_file": contextual_path
        })

        # since cleapnup/cancel are defined in base_task_wrapper this uses the generically named flag defined in that
        submission.skip_cleanup_on_cancel = 1

        self._status_update(submission, 'complete')

        return True


    ## TODO; we want to support adding different contextual fields to group colours by later on
    ## (but not conditions, because that would change the results) 
    def _run_params_changed(self):
        submission = Submission(self._submission_id)

        # set status to init for duration calculation (setup is not called) then use defined reload status
        self._status_update(submission, 'init')

        # load the distance matrix files back in from prior run
        self._status_update(submission, 'reload')

        abundance_path = self._in("abundance_matrix.json")

        with open(abundance_path, "r") as f:
            abundance_matrix = json.load(f)

        with open(self._in("dist_matrix_braycurtis.json"), "r") as f:
            dist_matrix_braycurtis = json.load(f)

        with open(self._in("dist_matrix_jaccard.json"), "r") as f:
            dist_matrix_jaccard= json.load(f)

        # calculate umap with new params
        # status updates are done within _calc_umap_embeddings
        pairs_braycurtis_umap, pairs_jaccard_umap = self._calc_umap_embeddings(abundance_matrix["sample_ids"], dist_matrix_braycurtis, dist_matrix_jaccard)

        # update abundance matrix and save result (overwrite existing file)
        abundance_matrix['points'] = {
            'braycurtis': pairs_braycurtis_umap,
            'jaccard': pairs_jaccard_umap,
        }

        with open(abundance_path, "w") as f:
            json.dump(abundance_matrix, f, cls=NumpyEncoder)

        self._status_update(submission, 'complete')


    def _calc_distance_matrices(self, rect_df):
        from fastdist import fastdist

        submission = Submission(self._submission_id)

        self._status_update(submission, 'calc_distances_bc')
        dist_matrix_braycurtis = fastdist.matrix_pairwise_distance(rect_df.values, fastdist.braycurtis, "braycurtis", return_matrix=True)

        # self._status_update(submission, 'calc_distances_j')
        # dist_matrix_jaccard = fastdist.matrix_pairwise_distance(rect_df.values, fastdist.jaccard, "jaccard", return_matrix=True)
        dist_matrix_jaccard = []

        # save the distance matrices for any future resubmissions
        with open(self._in("dist_matrix_braycurtis.json"), "w") as f:
            json.dump(dist_matrix_braycurtis, f, cls=NumpyEncoder)

        with open(self._in("dist_matrix_jaccard.json"), "w") as f:
            json.dump(dist_matrix_jaccard, f, cls=NumpyEncoder)

        return dist_matrix_braycurtis, dist_matrix_jaccard


    def _calc_umap_embeddings(self, rect_index, dist_matrix_braycurtis, dist_matrix_jaccard):
        import umap.umap_ as umap # this takes a few seconds

        submission = Submission(self._submission_id)

        def calc_umap(method, dist_matrix):
            dist_matrix_df = pd.DataFrame(dist_matrix, index=rect_index, columns=rect_index)

            n_neighbors = self._param_n_neighbors
            spread = self._param_spread
            min_dist = self._param_min_dist

            reducer = umap.UMAP(n_components=2,
                                n_neighbors=n_neighbors,
                                spread=spread,
                                min_dist=min_dist,
                                metric='precomputed')

            embeddings = reducer.fit_transform(dist_matrix_df.values)

            return method, pd.DataFrame(data=embeddings, columns=['dim1', 'dim2'], index=dist_matrix_df.index)

        self._status_update(submission, 'calc_umap_bc')
        results_braycurtis_umap = calc_umap('braycurtis', dist_matrix_braycurtis)[1]

        # self._status_update(submission, 'calc_umap_j')
        # results_jaccard_umap = calc_umap('jaccard', dist_matrix_jaccard)[1]

        pairs_braycurtis_umap = list(zip(results_braycurtis_umap.dim1.values, results_braycurtis_umap.dim2.values))
        # pairs_jaccard_umap = list(zip(results_jaccard_umap.dim1.values, results_jaccard_umap.dim2.values))
        pairs_jaccard_umap = []

        return pairs_braycurtis_umap, pairs_jaccard_umap


    def _attach_contextual(self):
        submission = Submission(self._submission_id)

        self._status_update(submission, 'contextual_start')

        contextual_filtering = True
        additional_headers = selected_contextual_filters(self._query, contextual_filtering=contextual_filtering)
        all_headers = [
            'id', 'am_environment_id', 'vegetation_type_id', 'imos_site_code', 'env_broad_scale_id',
            'env_local_scale_id', 'ph', 'organic_carbon', 'nitrate_nitrogen', 'ammonium_nitrogen_wt',
            'phosphorus_colwell', 'sample_type_id', 'temp', 'nitrate_nitrite', 'nitrite',
            'chlorophyll_ctd', 'salinity', 'silicate'
        ] + additional_headers
        all_headers_unique = list(set(all_headers))

        with SampleQuery(self._params) as query:
            results = query.matching_sample_graph_data(all_headers_unique)

        sample_results = {}
        if results:
            ndata = np.array(results)
            for x in ndata:
                sample_id = x[all_headers_unique.index('id')]
                sample_data = dict(zip(all_headers_unique, x.tolist()))
                sample_results[sample_id] = sample_data

        contextual_path = self._in("contextual.json")
        with open(contextual_path, "w") as f:
            json.dump(sample_results, f, cls=NumpyEncoder)

        return contextual_path
