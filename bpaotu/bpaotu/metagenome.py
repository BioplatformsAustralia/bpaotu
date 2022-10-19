from .util import format_sample_id
import re
from itertools import islice

type_q = 'type:amdb-metagenomics-analysed'
query_batch_size = 50 # get this many samples per query

def _ckan_query(remote, q, rows, start):
    return remote.action.package_search(
                    q=q,
                    sort='sample_id asc',
                    rows=rows,
                    start=start,
                    include_private=True)

def _quote_sample_id(sample_id):
    return '"{}"'.format(
        # solr documentation is unclear about escapes within strings, so to
        # be safe, clobber " and \ which shouldn't be there anyway
        re.sub(r'["\\]', '',
               format_sample_id(sample_id)))

def ckan_query_sample(remote, sample_id, rows=50000, start=0):
    return _ckan_query(remote,
                      type_q + ' AND sample_id:{}'.format(
                          _quote_sample_id(sample_id)),
                      rows, start)['results']

def ckan_query_multiple_samples(remote, sample_ids):
    si = iter(sample_ids)
    while True:
        # Do search in batches
        chunk = list(islice(si, query_batch_size))
        if not chunk:
            break
        r = _ckan_query(remote,
                        type_q + ' AND ({})'.format(
                            ' OR '.join(('sample_id:' +_quote_sample_id(s))
                                        for s in chunk)),
                        50000, 0)
        for package in r['results']:
            yield package

def ckan_query_mg(remote, rows, start):
    """
    Return the datasets that either have been, or can be, processed to form
    type:amdb-metagenomics-analysed datasets.
    """
    return _ckan_query(
        remote,
        '(tags:metagenomics) AND (res_format:FASTQ) AND NOT (type:amdb-metagenomics-analysed)',
        rows, start)

def get_package_sample_id(package):
    return package['sample_id'].split('/')[-1]
