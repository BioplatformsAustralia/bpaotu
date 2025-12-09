import io
import os
import json
import zipstream

from django.conf import settings
from django.db import connection
from psycopg2.extensions import adapt

from .base_task_wrapper import BaseTaskWrapper
from .contextual import contextual_definitions
from .params import param_to_filters, selected_contextual_filters
from .query import OntologyInfo, SampleQuery
from .submission import Submission
from .task_utils import NumpyEncoder

import numpy as np
import pandas as pd


class SampleComparisonWrapper(BaseTaskWrapper):
    def __init__(self, submission_id, query, status, umap_params_string):
        super().__init__(submission_id, status, "comparison")

        if query:
            self._query = query
            self._params, _ = param_to_filters(query)
        else:
            self._log('warn', "SampleComparisonWrapper `query` parameter is None")

        if umap_params_string:
            umap_params = json.loads(umap_params_string)
            self._param_min_dist = float(umap_params['min_dist'])
            self._param_n_neighbors = int(umap_params['n_neighbors'])
            self._param_spread = float(umap_params['spread'])
        else:
            self._log('warn', "SampleComparisonWrapper `umap_params_string` parameter is None")

    def run_contextual_only(self):
        self._run_contextual_only()

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

        sample_ids = rect_df.index.tolist()

        dist_matrix_braycurtis, dist_matrix_jaccard = self._calc_distance_matrices(rect_df)
        results_braycurtis_umap, results_jaccard_umap = self._calc_umap_embeddings(sample_ids, dist_matrix_braycurtis, dist_matrix_jaccard)

        ordination_path = self._save_ordination_results(sample_ids, results_braycurtis_umap, results_jaccard_umap)
        contextual_path = self._attach_contextual()

        submission.results_files = json.dumps({
            "ordination_file": ordination_path,
            "contextual_file": contextual_path
        })

        # since cleapnup/cancel are defined in base_task_wrapper this uses the generically named flag defined in that
        submission.skip_cleanup_on_cancel = 1

        self._status_update(submission, 'complete')

        return True

    def _run_params_changed(self):
        submission = Submission(self._submission_id)

        # set status to init for duration calculation (setup is not called) then use defined reload status
        self._status_update(submission, 'init')

        # load the distance matrix files back in from prior run
        self._status_update(submission, 'reload')

        with open(self._in("ordination.json"), "r") as f:
            ordination = json.load(f)

        with open(self._in("dist_matrix_braycurtis.json"), "r") as f:
            dist_matrix_braycurtis = json.load(f)

        with open(self._in("dist_matrix_jaccard.json"), "r") as f:
            dist_matrix_jaccard= json.load(f)

        sample_ids = ordination["sample_ids"]

        # calculate umap with new params
        results_braycurtis_umap, results_jaccard_umap = self._calc_umap_embeddings(sample_ids, dist_matrix_braycurtis, dist_matrix_jaccard)

        ordination_path = self._save_ordination_results(sample_ids, results_braycurtis_umap, results_jaccard_umap)
        contextual_path = self._attach_contextual()

        submission.results_files = json.dumps({
            "ordination_file": ordination_path,
            "contextual_file": contextual_path
        })

        # since cleapnup/cancel are defined in base_task_wrapper this uses the generically named flag defined in that
        submission.skip_cleanup_on_cancel = 1

        self._status_update(submission, 'complete')

        return True

    def _run_contextual_only(self):
        contextual_path = self._attach_contextual()

        return True

    def _save_ordination_results(self, sample_ids, results_braycurtis_umap, results_jaccard_umap):
        submission = Submission(self._submission_id)

        # json
        ordination = {
            'sample_ids': sample_ids,
            'points': {
                'braycurtis': results_braycurtis_umap.tolist(),
                'jaccard': results_jaccard_umap.tolist(),
            }
        }

        ordination_path = self._in("ordination.json")
        with open(ordination_path, "w") as f:
            json.dump(ordination, f, cls=NumpyEncoder)

        # csv
        df = pd.DataFrame({
            "sample_id": sample_ids,
            "braycurtis_x": results_braycurtis_umap[:, 0],
            "braycurtis_y": results_braycurtis_umap[:, 1],
            # "jaccard_x": results_jaccard_umap.values[:, 0],
            # "jaccard_y": results_jaccard_umap.values[:, 1],
        })

        ordination_path_csv = self._in("ordination.csv")
        df.to_csv(ordination_path_csv, index=False, float_format="%.6g")

        return ordination_path


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

        df_bc = pd.DataFrame(
            dist_matrix_braycurtis,
            index=rect_df.index,
            columns=rect_df.index,
        )
        df_bc.to_csv(
            self._in("dist_matrix_braycurtis.csv"),
            float_format="%.6g"
        )
        df_jd = pd.DataFrame(
            dist_matrix_jaccard,
            index=rect_df.index,
            columns=rect_df.index,
        )
        df_jd.to_csv(
            self._in("dist_matrix_jaccard.csv"),
            float_format="%.6g"
        )

        return dist_matrix_braycurtis, dist_matrix_jaccard


    def _calc_umap_embeddings(self, rect_index, dist_matrix_braycurtis, dist_matrix_jaccard):
        import umap.umap_ as umap # this takes a few seconds

        submission = Submission(self._submission_id)

        def calc_umap(dist_matrix):
            reducer = umap.UMAP(
                n_components=2,
                n_neighbors=self._param_n_neighbors,
                spread=self._param_spread,
                min_dist=self._param_min_dist,
                metric='precomputed'
            )

            embeddings = reducer.fit_transform(dist_matrix)

            return embeddings

        self._status_update(submission, 'calc_umap_bc')
        results_braycurtis_umap = calc_umap(dist_matrix_braycurtis)

        # self._status_update(submission, 'calc_umap_j')
        # results_jaccard_umap = calc_umap(dist_matrix_jaccard)
        results_jaccard_umap = np.zeros((len(rect_index), 2))

        return results_braycurtis_umap, results_jaccard_umap


    def _attach_contextual(self):
        submission = Submission(self._submission_id)

        self._status_update(submission, 'contextual_start')

        additional_headers = selected_contextual_filters(self._query, contextual_filtering=True)
        all_headers = [
            'id', 'am_environment_id', 'vegetation_type_id', 'imos_site_code', 'env_broad_scale_id',
            'env_local_scale_id', 'ph', 'organic_carbon', 'nitrate_nitrogen', 'ammonium_nitrogen_wt',
            'phosphorus_colwell', 'sample_type_id', 'temp', 'nitrate_nitrite', 'nitrite',
            'chlorophyll_ctd', 'salinity', 'silicate'
        ] + additional_headers
        all_headers_unique = list(set(all_headers))

        definitions = contextual_definitions(columns_subset = all_headers_unique, include_sample_id = False)

        with SampleQuery(self._params) as query:
            results = query.matching_sample_graph_data(all_headers_unique)

        samples = {}
        if results:
            ndata = np.array(results)
            for x in ndata:
                sample_id = x[all_headers_unique.index('id')]
                sample_data = dict(zip(all_headers_unique, x.tolist()))
                samples[sample_id] = sample_data

        contextual = {
            "definitions": definitions,
            "samples": samples,
        }

        ## json

        contextual_path = self._in("contextual.json")
        with open(contextual_path, "w") as f:
            json.dump(contextual, f, cls=NumpyEncoder)

        ## csv

        # sample contextual data
        # rename id to sample_id, put sample_id first, sort by sample_id
        df_con = pd.DataFrame.from_dict(samples, orient='index')
        df_con = df_con.rename(columns={"id": "sample_id"})
        cols = ["sample_id"] + [c for c in df_con.columns if c != "sample_id"]
        df_con = df_con[cols]
        if "sample_id" in df_con.columns:
            df_con.sort_values("sample_id", inplace=True)

        # populate labels for ontologies
        for d in definitions:
            if d.get("type") == "ontology":
                col = d["name"]
                label_col = col.rstrip("_id") + "_label"

                # build label mapping and create the label column (treat blank labels as N/A)
                mapping = {}
                for vid, label in d.get("values", []):
                    if label is None or str(label).strip() == "":
                        mapping[vid] = "N/A"
                    else:
                        mapping[vid] = label       

                # create label column and move to the right of it's id column
                df_con[label_col] = df_con[col].map(mapping).fillna("N/A")
                cols = list(df_con.columns)
                id_index = cols.index(col)
                cols.insert(id_index + 1, cols.pop(cols.index(label_col)))
                df_con = df_con[cols]

        # save the definitions metadata
        # (one file for type definitions and one file for defined values for ontologies)
        flat_def = []
        for d in definitions:
            flat = {}
            for key, value in d.items():
                if key == "values":
                    continue
                if value in (None, []):
                    flat[key] = ""
                else:
                    flat[key] = value
            flat_def.append(flat)

        df_def = pd.DataFrame(flat_def)
                    
        value_rows = []
        for d in definitions:
            if d.get("type") != "ontology":
                continue

            name = d["name"]
            for vid, label in d.get("values", []):
                row = {
                    "name": name,
                    "value_id": vid,
                    "value_label": label or ""
                }
                value_rows.append(row)

        df_def_values = pd.DataFrame(value_rows)

        ## export

        contextual_path_csv = self._in("contextual.csv")
        df_con.to_csv(contextual_path_csv, index=False, float_format="%.6g")

        definitions_path_csv = self._in("definitions.csv")
        df_def.to_csv(definitions_path_csv, index=False, float_format="%.6g")

        definitions_values_path_csv = self._in("definitions_values.csv")
        df_def_values.to_csv(definitions_values_path_csv, index=False, float_format="%.6g")

        return contextual_path


def comparison_zip_file_generator(submission_id):
    assert submission_id != None
    submission = Submission(submission_id)

    params, _ = param_to_filters(submission.query)

    zf = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
    zf.writestr('info.txt', info_text(params))

    export_files_to_include = [
        'dist_matrix_braycurtis.csv',
        # 'dist_matrix_jaccard.csv',
        'ordination.csv',
        'contextual.csv',
        'definitions.csv',
        'definitions_values.csv',
    ]

    for file in export_files_to_include:
        file_path = os.path.join(submission.submission_directory, file)
        if file_path and os.path.exists(file_path):
            arcname = os.path.basename(file_path)
            zf.write(file_path, arcname=arcname)

    example_files_to_include = [
        '/app/bpaotu/bpaotu/resources/examples/comparison_code_python_example.py',
        '/app/bpaotu/bpaotu/resources/examples/comparison_code_R_example.R',
    ]

    for file_path in example_files_to_include:
        if file_path and os.path.exists(file_path):
            arcname = os.path.basename(file_path)
            zf.write(file_path, arcname=arcname)

    return zf

def info_text(params):
    return """\
Australian Microbiome OTU Database - comparison export
------------------------------------------------------

Files included:
---------------

-  dist_matrix_braycurtis.csv
   
   The Bray-Curtis distance matrix in CSV format.
   Represented as an array of arrays that can be
   reconstructed into a matrix.

-  ordination.csv

   The calculated ordination for the distance matricesin CSV format.
   - "sample_id" has the sample IDs from the search
   - "braycurtis_x" and "braycurtis_y" has the respective umap embeddings for each sample

-  contextual.csv

   The contextual data for each sample included in the ordination.

-  comparison_code_python_example.py
-  comparison_code_R_example.R

   Example Python and R scripts for importing and plotting
   the CSV data included in the comparison export.


Search parameters:
------------------

{}

------------------------------------------------------
How to cite Australian Microbiome data:
https://www.australianmicrobiome.com/protocols/acknowledgements/

Australian Microbiome data use policy:
https://www.australianmicrobiome.com/protocols/data-policy/
""".format(params.describe()).encode('utf8')