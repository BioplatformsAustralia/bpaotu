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

    n_total = 0
    any_db_change = False

    # try to fetch from ckan first, then update afterwards in a transaction
    try:
        def iter_chunks():
            for chunk in ckan_query_chunked(remote, solr_query_mg_candidates):
                yield [get_package_sample_id(pkg) for pkg in chunk['results']]
        chunk_iter = iter_chunks()
    except (requests.exceptions.RequestException,
            urllib3.exceptions.HTTPError,
            urllib3.exceptions.NewConnectionError,
            socket.gaierror) as e:
        logger.error("CKAN error: %s", e, exc_info=True)
        return

    # reset all has_metagenome flags, then apply per-chunk updates
    with engine.begin() as conn:
        h1 = get_hash(conn)
        conn.execute(
            update(SampleMeta)
            .where(SampleMeta.has_metagenome == True)
            .values(has_metagenome=False)
        )
        any_db_change = True

    for sample_ids in chunk_iter:
        n_total += len(sample_ids)
        if not sample_ids:
            continue

        try:
            with engine.begin() as conn:
                stmt = (
                    update(SampleMeta)
                    .where(SampleMeta.sample_id.in_(sample_ids))
                    .values(has_metagenome=True)
                    .returning(SampleMeta.sample_id)
                )
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
                                SampleContext.id.in_(remaining)
                            )))

                any_db_change = True
        except Exception:
            # Log and errors and continue to next chunk (avoids full-pipeline crash)
            logger.exception("DB error while applying CKAN chunk - continuing...")
            continue

    logger.info("Found %d samples on CKAN with metagenome data", n_total)

    if any_db_change:
        with engine.begin() as conn:
            h2 = get_hash(conn)
        if h2 != h1:
            caches['search_results'].clear()
