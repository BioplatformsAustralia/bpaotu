from collections import defaultdict

from django.core.cache import caches
from django.conf import settings

import pandas as pd

from sklearn.metrics import pairwise_distances
from fastdist import fastdist

from .query import (
    OntologyInfo,
    log_query,
    SampleQuery,
    make_cache_key,
    CACHE_7DAYS)
from .otu import (
    SampleContext)
from .util import (
    format_sample_id,
    str_none_blank)
import logging
from bpaingest.projects.amdb.contextual import AustralianMicrobiomeSampleContextual


logger = logging.getLogger("rainbow")

def rewrap_longitude(longitude):
    d = settings.BPAOTU_MAP_CENTRE_LONGITUDE - longitude
    return longitude + (360 if d > 180 else -360 if d < -180 else 0)


def _comparison_query(params):
    """
    this code actually executes the query, wrapped with cache
    (see below)
    """
    # abundance matrix
    with SampleQuery(params) as query:
        sample_id_selected = []

        # row_count = query.matching_sample_distance_matrix().count()
        # print('row_count', row_count)

        # if row_count > 2000000:
        #     return {
        #         'error': 'Too many rows'
        #     }

        # for row in query.matching_sample_distance_matrix().yield_per(1000):
        #     sample_id, otu_id, count = row
        #     sample_ids.add(sample_id)
        #     otu_ids.add(otu_id)
        #     matrix_data.append([sample_id, otu_id, count])

        results = query.matching_sample_distance_matrix().all()

        df = pd.DataFrame(results, columns=['sample_id', 'otu_id', 'abundance'])
        print('df.shape', df.shape)

        df = df.sort_values(by=['sample_id', 'otu_id'], ascending=[True, True])  # Both columns in ascending order
        print('df.shape', df.shape)

        rectangular_df = df.pivot(index='sample_id', columns='otu_id', values='abundance').fillna(0)
        print('rectangular_df.shape', rectangular_df.shape)

        dist_matrix_jaccard = fastdist.matrix_pairwise_distance(rectangular_df.values, fastdist.jaccard, "jaccard", return_matrix=True)
        dist_matrix_braycurtis = fastdist.matrix_pairwise_distance(rectangular_df.values, fastdist.braycurtis, "braycurtis", return_matrix=True)

        # abundance_matrix = df.pivot_table(index='otu_id', columns='sample_id', values='abundance', fill_value=0).to_numpy().T
        # print('abundance_matrix.shape', abundance_matrix.shape)

        sample_ids = df['sample_id'].unique().tolist()
        otu_ids = df['otu_id'].unique().tolist()

        print('sample_ids: ', len(sample_ids))
        print('otu_ids: ', len(otu_ids))

        abundance_matrix = {
            'sample_ids': sample_ids,
            'otu_ids': otu_ids,
            'matrix_jaccard': dist_matrix_jaccard,
            'matrix_braycurtis': dist_matrix_braycurtis,
        }

        return abundance_matrix


def comparison_query(params, cache_duration=CACHE_7DAYS, force_cache=True):
    """
    currently only used by the frontend mapping component.
    note that there are some hard-coded workarounds (see below)
    which will need to be removed if this is to be used more generally
    """
    cache = caches['search_results']
    key = make_cache_key(
        'comparison_query',
        params.state_key)
    result = None
    if not force_cache:
        result = cache.get(key)
    if result is None:
        result = _comparison_query(params)
        cache.set(key, result, cache_duration)
    return result

def _spatial_query(params):
    """
    this code actually executes the query, wrapped with cache
    (see below)
    """
    with OntologyInfo() as info:
        def make_ontology_export(ontology_cls):
            values = dict(info.get_values(ontology_cls))

            def _ontology_lookup(x):
                if x is None:
                    return ''
                return values[x]
            return _ontology_lookup

        field_units = AustralianMicrobiomeSampleContextual.units_for_fields()
        write_fns = {}
        for column in SampleContext.__table__.columns:
            fn = str_none_blank
            if column.name == 'id':
                fn = format_sample_id
            elif hasattr(column, "ontology_class"):
                fn = make_ontology_export(column.ontology_class)
            units = field_units.get(column.name)
            title = SampleContext.display_name(column.name)
            if units:
                title += ' [%s]' % units
            write_fns[column.name] = (title, fn)
        write_fns_items = sorted(write_fns.items())

        def samples_contextual_data(sample):
            return {
                f: v
                for f, v in ((title, fn(getattr(sample, fld))) for fld, (title, fn) in write_fns_items)
                if not (v is None or v.strip() == '')
            }

        with SampleQuery(params) as query:
            sample_otus_all = []
            sample_id_selected = []
            for latitude, longitude, sample_id, richness, count_20k in (
                    query.matching_sample_otus_groupby_lat_lng_id_20k().yield_per(50)):
                sample_otus_all.append(
                    [latitude,
                     rewrap_longitude(longitude),
                     sample_id,
                     richness,
                     count_20k])
                sample_id_selected.append(sample_id)

            result = defaultdict(lambda: defaultdict(dict))

            # It's typically faster to accumulate the sample_ids above and then
            # fetch the actual samples here.
            for sample in query.matching_selected_samples(sample_id_selected, SampleContext):
                longitude = rewrap_longitude(sample.longitude)
                latlng = result[(sample.latitude, longitude)]
                latlng['latitude'] = sample.latitude
                latlng['longitude'] = longitude
                latlng['bpa_data'][sample.id] = samples_contextual_data(sample)

            return list(result.values()), sample_otus_all #, abundance_matrix, contextual


def spatial_query(params, cache_duration=CACHE_7DAYS, force_cache=False):
    """
    currently only used by the frontend mapping component.
    note that there are some hard-coded workarounds (see below)
    which will need to be removed if this is to be used more generally
    """
    cache = caches['search_results']
    key = make_cache_key(
        'spatial_query',
        params.state_key)
    result = None
    if not force_cache:
        result = cache.get(key)
    if result is None:
        result = _spatial_query(params)
        cache.set(key, result, cache_duration)
    return result


def non_empty_val(fv):
    return not (fv[1] is None or fv[1].strip() == '')
