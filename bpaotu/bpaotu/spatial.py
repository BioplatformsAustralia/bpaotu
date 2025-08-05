from collections import defaultdict

from django.core.cache import caches
from django.conf import settings

import time

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

logger = logging.getLogger('bpaotu')

def rewrap_longitude(longitude):
    d = settings.BPAOTU_MAP_CENTRE_LONGITUDE - longitude
    return longitude + (360 if d > 180 else -360 if d < -180 else 0)

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

            return list(result.values()), sample_otus_all


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
