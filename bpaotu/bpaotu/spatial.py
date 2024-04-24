from collections import defaultdict

from django.core.cache import caches
from django.conf import settings

import numpy as np
from scipy.spatial.distance import pdist, squareform

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

        # Create a matrix with default values set to 0
        matrix_data = []
        otu_ids = set()
        sample_ids = set()

        row_count = query.matching_sample_distance_matrix().count()

        print('row_count', row_count)

        if row_count > 1000000:
            return {
                'error': 'Too many rows'
            }

        for row in query.matching_sample_distance_matrix().yield_per(1000):
            sample_id, otu_id, count = row
            sample_id_selected.append(sample_id)
            sample_ids.add(sample_id)
            otu_ids.add(otu_id)
            matrix_data.append([sample_id, otu_id, count])

        # print('matrix_data', matrix_data)

        sample_ids = sorted(sample_ids)
        otu_ids = sorted(otu_ids)

        # Map sample and OTU IDs to their corresponding indices
        sample_id_to_index = {sample_id: i for i, sample_id in enumerate(sample_ids)}
        otu_id_to_index = {otu_id: i for i, otu_id in enumerate(otu_ids)}

        # Create matrix with indices and abundance values
        matrix = []
        for entry in matrix_data:
            sample_id, otu_id, value = entry
            sample_index = sample_id_to_index[sample_id]
            otu_index = otu_id_to_index[otu_id]
            matrix.append([otu_index, sample_index, value])


        ###
        ###

        # # Convert matrix_data into a numpy array
        # matrix_array = np.array(matrix_data)

        # # Extract sample IDs, OTU IDs, and counts
        # sample_ids_2 = matrix_array[:, 0].astype(int)
        # otu_ids_2 = matrix_array[:, 1].astype(int)
        # counts = matrix_array[:, 2].astype(int)

        # # Determine unique sample IDs and OTU IDs
        # unique_sample_ids = np.unique(sample_ids_2)
        # unique_otu_ids = np.unique(otu_ids_2)

        # np.savetxt('unique_sample_ids.csv', unique_sample_ids, delimiter = ',')
        # np.savetxt('unique_otu_ids.csv', unique_otu_ids, delimiter = ',')

        # # Construct a matrix where rows represent samples and columns represent OTUs
        # num_samples = len(unique_sample_ids)
        # num_otus = len(unique_otu_ids)
        # data_matrix = np.zeros((num_samples, num_otus))

        # # Populate data_matrix with counts
        # for i, sample_id in enumerate(unique_sample_ids):
        #     sample_indices = np.where(sample_ids_2 == sample_id)[0]
        #     for j in sample_indices:
        #         otu_index = np.where(unique_otu_ids == otu_ids_2[j])[0][0]
        #         data_matrix[i, otu_index] = counts[j]

        # np.savetxt('matrix.csv', matrix, delimiter = ',')
        # np.savetxt('data_matrix.csv', data_matrix, delimiter = ',')

        # # Calculate Jaccard dissimilarity
        # jaccard_dissimilarity = pdist(data_matrix, metric='jaccard')

        # # Calculate Bray-Curtis dissimilarity
        # braycurtis_dissimilarity = pdist(data_matrix, metric='braycurtis')

        # # Convert pairwise distances to square matrices
        # jaccard_matrix = squareform(jaccard_dissimilarity)
        # braycurtis_matrix = squareform(braycurtis_dissimilarity)

        # np.savetxt('jaccard_matrix.csv', jaccard_matrix, delimiter = ',')
        # np.savetxt('braycurtis_matrix.csv', braycurtis_matrix, delimiter = ',')

        # abundance_matrix = {
        #     'sample_ids': unique_sample_ids.tolist(),
        #     'otu_ids': unique_otu_ids.tolist(),
        #     'matrix_jaccard': jaccard_matrix.tolist(),
        #     'matrix_braycurtis': braycurtis_matrix.tolist(),
        # }

        ###
        ###

        # abundance_matrix = {
        #     'sample_ids': sample_ids,
        #     'otu_ids': otu_ids,
        #     'matrix': matrix,
        #     'sample_ids_2': sample_ids_2.tolist(),
        #     'otu_ids_2': otu_ids_2.tolist(),
        #     'matrix_jaccard': jaccard_matrix.tolist(),
        #     'matrix_braycurtis': braycurtis_matrix.tolist(),
        # }

        ## js version
        abundance_matrix = {
            'sample_ids': sample_ids,
            'otu_ids': otu_ids,
            'matrix': matrix,
            # 'python': {
            #     'sample_ids': unique_sample_ids,
            #     'otu_ids': otu_ids_2.tolist(),
            #     'matrix_jaccard': np.unique(jaccard_matrix).tolist(),
            #     'matrix_braycurtis': np.unique(braycurtis_matrix).tolist(),
            # }
        }

        # ## python version
        # abundance_matrix = {
        #     'sample_ids': sample_ids_2.tolist(),
        #     'otu_ids': otu_ids_2.tolist(),
        #     'matrix_jaccard': np.unique(jaccard_matrix).tolist(),
        #     'matrix_braycurtis': np.unique(braycurtis_matrix).tolist(),
        # }

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
            sample_id_selected = []

            # Create a matrix with default values set to 0
            matrix_data = []
            otu_ids = set()
            sample_ids = set()

            for row in query.matching_sample_distance_matrix().yield_per(1000):
                sample_id, otu_id, count = row
                sample_ids.add(sample_id)
                otu_ids.add(otu_id)
                matrix_data.append([sample_id, otu_id, count])

            sample_ids = sorted(sample_ids)
            otu_ids = sorted(otu_ids)

            # GBIF Example
            #
            # matrix_data = [
            #     ['Sample_1', 'OTU_B', 51],
            #     ['Sample_1', 'OTU_D', 33],
            #     ['Sample_2', 'OTU_A', 100],
            #     ['Sample_2', 'OTU_C', 2],
            #     ['Sample_4', 'OTU_A', 3],
            #     ['Sample_4', 'OTU_B', 11],
            # ]
            # sample_ids = ['Sample_1', 'Sample_2', 'Sample_3', 'Sample_4']
            # otu_ids = ['OTU_A', 'OTU_B', 'OTU_C', 'OTU_D']

            # Map sample and OTU IDs to their corresponding indices
            sample_id_to_index = {sample_id: i for i, sample_id in enumerate(sample_ids)}
            otu_id_to_index = {otu_id: i for i, otu_id in enumerate(otu_ids)}

            # Create matrix with indices and abundance values
            matrix = []
            for entry in matrix_data:
                sample_id, otu_id, value = entry
                sample_index = sample_id_to_index[sample_id]
                otu_index = otu_id_to_index[otu_id]
                matrix.append([otu_index, sample_index, value])

            abundance_matrix = {
                'otu_ids': otu_ids,
                'sample_ids': sample_ids,
                'matrix': matrix,
            }

        with SampleQuery(params) as query:
            sample_otus_all = []
            sample_id_selected = []
            for latitude, longitude, sample_id, richness, count, count_20k in (
                    query.matching_sample_otus_groupby_lat_lng_id_20k().yield_per(50)):
                sample_otus_all.append(
                    [latitude,
                     rewrap_longitude(longitude),
                     sample_id,
                     richness,
                     count,
                     count_20k])
                sample_id_selected.append(sample_id)

            result = defaultdict(lambda: defaultdict(dict))
            contextual = {}

            # It's typically faster to accumulate the sample_ids above and then
            # fetch the actual samples here.
            for sample in query.matching_selected_samples(sample_id_selected, SampleContext):
                longitude = rewrap_longitude(sample.longitude)
                latlng = result[(sample.latitude, longitude)]
                latlng['latitude'] = sample.latitude
                latlng['longitude'] = longitude
                # latlng['bpa_data'][sample.id] = samples_contextual_data(sample)
                contextual[sample.id] = samples_contextual_data(sample)

            return list(result.values()), sample_otus_all, abundance_matrix, contextual


def spatial_query(params, cache_duration=CACHE_7DAYS, force_cache=True):
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
