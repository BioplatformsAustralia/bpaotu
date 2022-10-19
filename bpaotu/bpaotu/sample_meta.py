"""
Some samples have metagenome data stored in CKAN. We can't practically detect
this at query time (for performance reasons and due to the use of "SELECT …
LIMIT … OFFSET …") so we need something in the database that flags the presence
of metagenome data. That needs to be updated when new metagenome data is added
to CKAN by calling update_from_ckan()
"""

import logging
import hashlib

from sqlalchemy import (update, select, insert)
from django.core.cache import caches

from .otu import SampleMeta, SampleContext, make_engine
from .site_images import make_ckan_remote
from .metagenome import ckan_query_mg, get_package_sample_id

logger = logging.getLogger(__name__)

# We can only fetch a limited number of rows at a time. See
# https://docs.ckan.org/en/2.9/api/#ckan.logic.action.get.package_search
chunk_size = 100

def _load_chunk(conn, remote, start):
    r = ckan_query_mg(remote, chunk_size, start)
    sample_ids = [get_package_sample_id(package) for package in r['results']]
    stmt = update(SampleMeta).where(
        SampleMeta.sample_id.in_(sample_ids)).values(has_metagenome=True).returning(
            SampleMeta.sample_id)
    update_results = [r[0] for r in conn.execute(stmt).fetchall()]
    remaining = set(sample_ids) - set(update_results)
    if remaining:
        # There's no guarantee that sample ids in CKAN match those in
        # SampleContext, so only insert SampleMeta rows for sample ids we know
        # about.
        conn.execute(
            insert(SampleMeta).from_select(
                ['sample_id', 'has_metagenome'],
                select([SampleContext.id, True]).where(
                    SampleContext.id.in_(remaining))))
    return r['count'], len(sample_ids)

def get_hash(conn):
    m = hashlib.md5()
    for row in conn.execute(
        select([SampleMeta.sample_id]).where(
            SampleMeta.has_metagenome == True).order_by("sample_id")):
        m.update(row[0].encode('utf-8'))
    return m.digest()

def update_from_ckan():
    remote = make_ckan_remote()
    engine = make_engine()

    with engine.begin() as conn:
        h1 = get_hash(conn)
        conn.execute(
            update(SampleMeta).where(
                SampleMeta.has_metagenome == True).values(has_metagenome=False))
        # We need to do this in batches as there is a limit to what CKAN will
        # return in any one call
        n_total, n_done = _load_chunk(conn, remote, 0)
        while n_done < n_total:
            nt, nc = _load_chunk(conn, remote, n_done)
            if nc < 1:
                # Must be at least 1 or we wouldn't be in this iteration, and if
                # we don't catch this we could end up in an infinite loop
                raise RuntimeError(
                    "Bad result count from CKAN package search ({})".format(nc))
            if nt != n_total:
                raise RuntimeError(
                    "CKAN package search total result count changed. Got {} should be {}.".format(
                        nt, n_total))
            n_done += nc
        if n_done != n_total:
            raise RuntimeError(
                "Inconsistent total result count from CKAN package searches. Got {}, should be {}".format(
                    n_done, n_total))
        logger.info("Found %d samples on CKAN with metagenome data", n_total)
        h2 = get_hash(conn)
        if h2 != h1:
            caches['search_results'].clear()
