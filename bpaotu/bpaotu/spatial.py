
from django.core.cache import caches
from hashlib import sha256
from .query import (
    OntologyInfo,
    SampleQuery,
    CACHE_7DAYS)
from .otu import (
    SampleContext)
from .util import (
    display_name,
    format_bpa_id)
import logging
from collections import OrderedDict


logger = logging.getLogger("rainbow")


def _spatial_query(params):
    """
    this code actually executes the query, wrapped with cache
    (see below)
    """
    with OntologyInfo() as info:
        def make_ontology_export(ontology_cls):
            values = dict(info.get_values(ontology_cls))

            def __ontology_lookup(x):
                if x is None:
                    return ''
                return values[x]
            return __ontology_lookup

        def str_none_blank(v):
            if v is None:
                return ''
            return str(v)

        write_fns = {}
        for column in SampleContext.__table__.columns:
            if column.name == 'id':
                fn = format_bpa_id
            elif hasattr(column, "ontology_class"):
                fn = make_ontology_export(column.ontology_class)
            else:
                fn = str_none_blank
            units = getattr(column, 'units', None)
            title = display_name(column.name)
            if units:
                title += ' [%s]' % units
            write_fns[column.name] = (title, fn)

        with SampleQuery(params) as query:
            results = query.matching_samples()

        # First, group all results according to BPA ID
        bpadata_dict = OrderedDict()

        for r in results:
            latlng_key = (r.latitude, r.longitude)

            if latlng_key not in bpadata_dict:
                bpadata_dict[latlng_key] = {}

            bpaid_key = r.id
            bpadata_dict[latlng_key][bpaid_key] = {}

            for fld, (title, fn) in sorted(write_fns.items()):
                val = fn(getattr(r, fld))
                if val is None or val == '':
                    continue
                bpadata_dict[latlng_key][bpaid_key][title] = val

    # manipulate data into format consumed by the front-end
    data = []
    for (lat, lng) in bpadata_dict:
        item = {}
        # TODO:
        # this is a workaround for a leaflet bug; this should
        # be moved into the frontend rather than being in this
        # backend code. it resolves an issue with samples wrapping
        # on the dateline and being shown off-screen (off coast NZ)
        corrected_lng = lng
        if corrected_lng < 0:
            corrected_lng += 360
        item['latitude'] = lat
        item['longitude'] = corrected_lng
        item['bpa_data'] = {}

        for bpaid in sorted(bpadata_dict[(lat, lng)]):
            item['bpa_data'][bpaid] = {}

            for metadata, value in bpadata_dict[(lat, lng)][bpaid].items():
                item['bpa_data'][bpaid][metadata] = value

        data.append(item)

    return data


def spatial_query(params, cache_duration=CACHE_7DAYS, force_cache=False):
    """
    currently only used by the frontend mapping component.
    note that there are some hard-coded workarounds (see below)
    which will need to be removed if this is to be used more generally
    """
    cache = caches['search_results']
    hash_str = 'SpatialQuery:cached:' + params.state_key
    key = sha256(hash_str.encode('utf8')).hexdigest()
    result = None
    if not force_cache:
        result = cache.get(key)
    if result is None:
        result = _spatial_query(params)
        cache.set(key, result, cache_duration)
    return result
