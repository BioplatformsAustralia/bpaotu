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
from .metagenome import (get_package_sample_id, ckan_query_chunked,
                         solr_query_mg_candidates)

logger = logging.getLogger(__name__)

def get_hash(conn):
    m = hashlib.md5()
    for row in conn.execute(
        select([SampleMeta.sample_id]).where(
            SampleMeta.has_metagenome == True).order_by("sample_id")):
        m.update(row[0].encode('utf-8'))
    return m.digest()

def update_from_ckan():
    logger.info("Searching CKAN for metagenome data")
    remote = make_ckan_remote()
    engine = make_engine()

    with engine.begin() as conn:
        h1 = get_hash(conn)
        conn.execute(
            update(SampleMeta).where(
                SampleMeta.has_metagenome == True).values(has_metagenome=False))
        n_total = 0
        for chunk in ckan_query_chunked(remote, solr_query_mg_candidates):
            sample_ids = [get_package_sample_id(package) for package in chunk['results']]
            n_total += len(sample_ids)
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

        logger.info("Found %d samples on CKAN with metagenome data", n_total)
        h2 = get_hash(conn)
        if h2 != h1:
            caches['search_results'].clear()
