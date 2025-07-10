from celery import shared_task

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

from .submission import Submission

# from .views import param_to_filters
import json
from collections import OrderedDict
from .otu import (SampleContext)
from .query import (ContextualFilter,
                    ContextualFilterTermDate, ContextualFilterTermTime,
                    ContextualFilterTermFloat, ContextualFilterTermLongitude,
                    ContextualFilterTermOntology,
                    ContextualFilterTermSampleID, ContextualFilterTermString,
                    OTUQueryParams, SampleQuery,
                    TaxonomyFilter, TaxonomyOptions)
from .util import parse_date, parse_time, parse_float

logger = logging.getLogger('bpaotu')

@shared_task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))

@shared_task(ignore_result=True)
def periodic_task():
    print('periodic_task')



def _status_update(submission, text):
    logger.info(f"Status: {text}")
    submission.status = text
    timestamps_ = json.loads(submission.timestamps)
    timestamps_.append({ text: time.time() })
    submission.timestamps = json.dumps(timestamps_)

def _in(_submission_dir, filename):
    "return path to filename within submission dir"
    return os.path.join(_submission_dir, filename)


@shared_task()
def submit_sample_comparison(submission_id, query, umap_params_string):
    submission = Submission.create(submission_id)

    submission.status = 'init'
    submission.query = query
    submission.umap_params_string = umap_params_string

    # # create the chain and submit it asynchronously
    # task_chain = chain(
    #     setup_comparison.s(submission_id),
    #     run_comparison.s(),
    # )

    # result = task_chain.apply_async()
    result = fastdist_task.delay(submission_id, query, umap_params_string)

    submission.task_id = result.id

    return submission_id



@shared_task()
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


@shared_task()
def fastdist_task(submission_id, _query, umap_params_string):
    ########
    SHARED_DIR = "/shared"
    _submission_id = submission_id
    _submission_dir = os.path.join(SHARED_DIR, _submission_id)
    _params, _errors = param_to_filters(_query)

    umap_params = json.loads(umap_params_string)
    _param_min_dist = float(umap_params['min_dist'])
    _param_n_neighbors = int(umap_params['n_neighbors'])
    _param_spread = float(umap_params['spread'])

    #### setup(self):
    submission = Submission(_submission_id)
    submission.timestamps = json.dumps([])

    _status_update(submission, 'init')
    os.makedirs(_submission_dir, exist_ok=True)
    logger.info(f'Submission directory created: {_submission_dir}')

    #### _run(self):
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

    logger.info(f'Pivot dimensions: sample_id x otu_id = {nunique_sample_id} x {nunique_otu_id}')

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


def _parse_contextual_term(filter_spec):
    field_name = filter_spec['field']

    operator = filter_spec.get('operator')
    column = SampleContext.__table__.columns[field_name]
    typ = str(column.type)
    if column.name == 'id':
        if len(filter_spec['is']) == 0:
            raise ValueError("Value can't be empty")
        return ContextualFilterTermSampleID(field_name, operator, [t for t in filter_spec['is']])
    elif hasattr(column, 'ontology_class'):
        return ContextualFilterTermOntology(field_name, operator, int(filter_spec['is']))
    elif typ == 'DATE':
        return ContextualFilterTermDate(
            field_name, operator, parse_date(filter_spec['from']), parse_date(filter_spec['to']))
    elif typ == 'TIME':
        return ContextualFilterTermTime(
            field_name, operator, parse_time(filter_spec['from']), parse_time(filter_spec['to']))
    elif typ == 'FLOAT':
        return (ContextualFilterTermLongitude
                if field_name == 'longitude'
                else ContextualFilterTermFloat)(
            field_name, operator, parse_float(filter_spec['from']), parse_float(filter_spec['to']))
    elif typ == 'CITEXT':
        value = str(filter_spec['contains'])
        # if value == '':
        #     raise ValueError("Value can't be empty")
        return ContextualFilterTermString(field_name, operator, value)
    else:
        raise ValueError("invalid filter term type: %s", typ)

def param_to_filters(query_str, contextual_filtering=True):
    """
    take a JSON encoded query_str, validate, return any errors
    and the filter instances
    """

    otu_query = json.loads(query_str)
    taxonomy_filter = make_clean_taxonomy_filter(
        otu_query['amplicon_filter'],
        otu_query['taxonomy_filters'],
        otu_query['trait_filter'])
    context_spec = otu_query['contextual_filters']
    sample_integrity_spec = otu_query['sample_integrity_warnings_filter']
    contextual_filter = ContextualFilter(context_spec['mode'],
                                         context_spec['environment'],
                                         otu_query['metagenome_only'])
    sample_integrity_warnings_filter = ContextualFilter(sample_integrity_spec['mode'],
                                                        sample_integrity_spec['environment'],
                                                        otu_query['metagenome_only'])

    errors = []

    if contextual_filtering:
        for filter_spec in context_spec['filters']:
            field_name = filter_spec['field']
            if field_name not in SampleContext.__table__.columns:
                errors.append("Please select a contextual data field to filter upon.")
                continue

            try:
                contextual_filter.add_term(_parse_contextual_term(filter_spec))
            except Exception:
                errors.append("Invalid value provided for contextual field `%s'" % field_name)
                logger.critical("Exception parsing field: `%s'", field_name, exc_info=True)

    # process sample integrity separately
    if contextual_filtering:
        for filter_spec in sample_integrity_spec['filters']:
            field_name = filter_spec['field']
            if field_name not in SampleContext.__table__.columns:
                errors.append("Please select a sample integrity warning data field to filter upon.")
                continue

            try:
                sample_integrity_warnings_filter.add_term(_parse_contextual_term(filter_spec))
            except Exception:
                errors.append("Invalid value provided for sample integrity warning field `%s'" % field_name)
                logger.critical("Exception parsing field: `%s'", field_name, exc_info=True)

    return (OTUQueryParams(
        contextual_filter=contextual_filter,
        taxonomy_filter=taxonomy_filter,
        sample_integrity_warnings_filter=sample_integrity_warnings_filter), errors)

def selected_contextual_filters(query_str, contextual_filtering=True):
    otu_query = json.loads(query_str)
    context_spec = otu_query['contextual_filters']
    contextual_filter = []

    if contextual_filtering:
        for filter_spec in context_spec['filters']:
            field_name = filter_spec['field']
            contextual_filter.append(field_name)

    return contextual_filter

def int_if_not_already_none(v):
    if v is None or v == '':
        return None
    v = str(v)  # let's not let anything odd through
    return int(v)

def get_operator_and_int_value(v):
    if v is None or v == '':
        return None
    if v.get('value', '') == '':
        return None
    return OrderedDict((
        ('operator', v.get('operator', 'is')),
        ('value', int_if_not_already_none(v['value'])),
    ))

def get_operator_and_string_value(v):
    if v is None or v == '':
        return None
    if v.get('value', '') == '':
        return None
    return OrderedDict((
        ('operator', v.get('operator', 'is')),
        ('value', v['value']),
    ))

clean_trait_filter = get_operator_and_string_value
clean_amplicon_filter = get_operator_and_int_value
clean_environment_filter = get_operator_and_int_value

def make_clean_taxonomy_filter(amplicon_filter, state_vector, trait_filter):
    """
    take an amplicon filter and a taxonomy filter
    # (a list of phylum, kingdom, ...) and clean it
    """
    assert(len(state_vector) == len(TaxonomyOptions.hierarchy))
    return TaxonomyFilter(
        clean_amplicon_filter(amplicon_filter),
        list(map(
            get_operator_and_int_value,
            state_vector)),
        clean_trait_filter(trait_filter))


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
