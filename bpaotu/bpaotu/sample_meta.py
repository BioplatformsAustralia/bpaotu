"""
Some samples have metagenome data stored in CKAN. We can't practically detect
this at query time (for performance reasons and due to the use of "SELECT …
LIMIT … OFFSET …") so we need something in the database that flags the presence
of metagenome data. That needs to be updated when new metagenome data is added
to CKAN by calling update_from_ckan()
"""

import logging

from sqlalchemy import (update, select, insert)

from .otu import SampleMeta, SampleContext, make_engine
from .site_images import make_ckan_remote

logger = logging.getLogger(__name__)

chunk_size = 100

def _load_chunk(conn, remote, start):
    r = remote.action.package_search(
                    q='type:amdb-metagenomics-analysed',
                    sort='sample_id asc',
                    rows=chunk_size,
                    start=start,
                    include_private=True)
    sample_ids = [package['sample_id'].split('/')[-1]
                  for package in r['results']]
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

def update_from_ckan():
    remote = make_ckan_remote()
    engine = make_engine()

    with engine.begin() as conn:
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
