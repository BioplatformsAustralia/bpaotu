from .util import format_sample_id
import re
from itertools import islice

# solr query string for the datasets that either have been, or can be, processed to form
# type:amdb-metagenomics-analysed datasets.
solr_query_mg_candidates = ('(tags:metagenomics) AND (res_format:FASTQ) AND NOT '
                            '(type:amdb-metagenomics-analysed)')

solr_query_mg_analysed = 'type:amdb-metagenomics-analysed'

def ckan_query(remote, solr_query, rows, start):
    return remote.action.package_search(
                    q=solr_query,
                    sort='sample_id asc',
                    rows=rows,
                    start=start,
                    include_private=True)

class CKANsearchInconsistency(RuntimeError):
    pass

def ckan_query_chunked(remote, solr_query, chunk_size=100):
    """
    We can only fetch a limited number of rows at a time. See
    https://docs.ckan.org/en/2.9/api/#ckan.logic.action.get.package_search
    """
    r = ckan_query(remote,
                   solr_query,
                   chunk_size, 0)
    n_total, n_done = r['count'], len(r['results'])
    if n_total < 1:
        return
    yield r
    while n_done < n_total:
        r = ckan_query(remote,
                       solr_query,
                       chunk_size, n_done)
        nt, nc = r['count'], len(r['results'])
        # Note that these CKAN searches are not inside any kind of SQL-like
        # transaction, so all kinds of TOCTOU-style inconsistencies are
        # possible. The caller should handle CKANsearchInconsistency gracefully.
        if nc < 1:
            # Must be at least 1 or we wouldn't be in this iteration, and if
            # we don't catch this we could end up in an infinite loop
            raise CKANsearchInconsistency(
                "Bad result count from CKAN package search ({})".format(nc))
        if nt != n_total:
            raise CKANsearchInconsistency(
                "CKAN package search total result count changed. Got {} should be {}.".format(
                    nt, n_total))
        yield r
        n_done += nc
    if n_done != n_total:
        raise CKANsearchInconsistency(
            "Inconsistent total result count from CKAN package searches. Got {}, should be {}".format(
                n_done, n_total))


def _quote_sample_id(sample_id):
    return '"{}"'.format(
        # solr documentation is unclear about escapes within strings, so to
        # be safe, clobber " and \ which shouldn't be there anyway
        re.sub(r'["\\]', '',
               format_sample_id(sample_id)))

def ckan_query_sample(remote, sample_id, rows=50000, start=0):
    return ckan_query(remote,
                      solr_query_mg_analysed + ' AND sample_id:{}'.format(
                          _quote_sample_id(sample_id)),
                      rows, start)['results']

query_batch_size = 50

def ckan_query_multiple_samples(remote, sample_ids):
    si = iter(sample_ids)
    while True:
        # Do search in batches
        chunk = list(islice(si, query_batch_size))
        if not chunk:
            break
        r = ckan_query(remote,
                        solr_query_mg_analysed + ' AND ({})'.format(
                            ' OR '.join(('sample_id:' +_quote_sample_id(s))
                                        for s in chunk)),
                        50000, 0)
        for package in r['results']:
            yield package

def get_package_sample_id(package):
    return package['sample_id'].split('/')[-1]
