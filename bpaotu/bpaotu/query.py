import datetime
from functools import partial
from itertools import chain
import logging
import inspect

import sqlalchemy
from sqlalchemy import func
from sqlalchemy.orm import sessionmaker, aliased
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import operators

from django.core.cache import caches
from hashlib import sha256

from .otu import (
    Environment,
    OTU,
    Sequence,
    OTUAmplicon,
    TaxonomySource,
    taxonomy_keys,
    taxonomy_key_id_names,
    taxonomy_ontology_classes,
    rank_labels_lookup,
    SampleContext,
    SampleOTU,
    SampleMeta,
    OTUSampleOTU,
    ImportMetadata,
    ImportedFile,
    ExcludedSamples,
    OntologyErrors,
    Taxonomy,
    taxonomy_otu,
    taxonomy_otu_export,
    make_engine)


logger = logging.getLogger("rainbow")
engine = make_engine()
Session = sessionmaker(bind=engine)


CACHE_FOREVER = None
CACHE_7DAYS = (60 * 60 * 24 * 7)


__METADATA_UUID = None  # cache


def make_cache_key(*args):
    """
    make a cache key, which will be tied to the UUID of the current import,
    so we don't need to worry about old data being cached if we re-import

    for this to work, repr() on each object passed in *args must return
    something that is stable, and which completely represents the state of the
    object for the cache
    """
    global __METADATA_UUID
    if __METADATA_UUID is None:
        with MetadataInfo() as info:
            __METADATA_UUID = info.import_metadata().uuid
    key = __METADATA_UUID + ':' + ':'.join(repr(t) for t in args)
    return sha256(key.encode('utf8')).hexdigest()


class OTUQueryParams:
    def __init__(self, contextual_filter, taxonomy_filter, sample_integrity_warnings_filter):
        self.contextual_filter = contextual_filter
        self.taxonomy_filter = taxonomy_filter
        self.sample_integrity_warnings_filter = sample_integrity_warnings_filter

        # for use by caching, should be a stable state summary
        self.state_key = make_cache_key(repr(self))

    def filename(self, timestamp, extension):
        return 'AustralianMicrobiome-{}{}'.format(timestamp, extension)

    def summary(self, max_chars=100):
        # a short title, maximum length `max_chars`
        pfx = 'Australian Microbiome: '
        parts = []
        amplicon_descr, taxonomy_descr, trait_descr = self.taxonomy_filter.describe()
        if amplicon_descr is not None:
            parts.append(amplicon_descr)
        if taxonomy_descr:
            parts.append(taxonomy_descr[-1])
        if trait_descr is not None:
            parts.append(trait_descr)
        parts += self.contextual_filter.describe()
        parts += self.sample_integrity_warnings_filter.describe()
        return pfx + '; '.join(parts)

    def describe(self, max_chars=100):
        "a short title, maximum length `max_chars`"

        parts = []
        amplicon_descr, taxonomy_descr, trait_descr = self.taxonomy_filter.describe()
        contextual_descr  = self.contextual_filter.describe()
        sample_integrity_warnings_descr  = self.sample_integrity_warnings_filter.describe()
        indent = '  '

        def add_section(lines):
            parts.append('\n'.join(lines))

        def amplicon_section():
            p = ['Amplicon filter:']
            if amplicon_descr is not None:
                p.append(indent + amplicon_descr)
            else:
                p.append(indent + '(no amplicon filter applied)')
            return p

        def taxonomy_section():
            p = ['Taxonomy filter:']
            if taxonomy_descr:
                p += [(indent + line) for line in taxonomy_descr]
            else:
                p.append(indent + '(no taxonomy filter applied)')
            return p

        def trait_section():
            p = ['Traits filter:']
            if trait_descr is not None:
                p.append(indent + trait_descr)
            else:
                p.append(indent + '(no trait filter applied)')
            return p

        def contextual_section():
            p = ['Contextual filter:']
            if len(contextual_descr) > 0:
                for entry in contextual_descr:
                    p.append(indent + entry)
            else:
                p.append(indent + '(no contextual filter applied)')
            return p

        def sample_integrity_warnings_section():
            p = ['Sample Integrity Warnings filter:']
            if len(sample_integrity_warnings_descr) > 0:
                for entry in sample_integrity_warnings_descr:
                    p.append(indent + entry)
            else:
                p.append(indent + '(no sample integrity warnings filter applied)')
            return p

        def metadata_section():
            session = Session()
            metadata = session.query(ImportMetadata).one()
            session.close()
            return [
                'Australian Microbiome Database Metadata:',
                indent + 'Dataset methodology={}'.format(metadata.methodology),
                indent + 'Dataset analysis url={}'.format(metadata.analysis_url),
                indent + 'Dataset revision date={}'.format(metadata.revision_date),
                '',
                'For the schema definition refer to the location provided in the database_schema_definitions_url column'
            ]

        add_section(amplicon_section())
        add_section(taxonomy_section())
        add_section(trait_section())
        add_section(contextual_section())
        add_section(sample_integrity_warnings_section())
        add_section(metadata_section())

        return '\n\n'.join(parts)

    def __repr__(self):
        # Note: used for caching, so make sure all components have a defined
        # representation that's stable over time
        return 'OTUQueryParams<{},{},{}>'.format(
            self.contextual_filter,
            self.taxonomy_filter,
            self.sample_integrity_warnings_filter)


class TaxonomyOptions:
    hierarchy = tuple(zip(taxonomy_key_id_names, taxonomy_ontology_classes))

    def __init__(self):
        self._session = Session()

    def __enter__(self):
        return self

    def __exit__(self, exec_type, exc_value, traceback):
        self._session.close()

    def search(self, selected_amplicon, search_string):
        # search for the string in each ontology class
        # and return all taxonomies where it is present

        results = []
        taxonomy_ids = []

        for (OntologyClass) in taxonomy_ontology_classes[1:]:
            q1 = (
                self._session
                    .query(OntologyClass.id)
                    .filter(func.lower(OntologyClass.value).like(f"%{search_string.lower()}%"))
            )
            # log_query(q1)

            ids = [result[0] for result in q1.all()]

            q2 = (
                self._session
                    .query(Taxonomy.id, OntologyClass.id, OntologyClass.value)
                    .join(OntologyClass)
                    .filter(OntologyClass.id.in_(ids))
                    .filter(Taxonomy.amplicon_id == selected_amplicon)
            )
            # log_query(q2)

            # find the highest independent order (i.e. to prevent duplicates)
            taxonomy_ids.extend([result[0] for result in q2.all()])
            taxonomies = [result for result in q2.all()]

            results.extend(taxonomy_ids)

        if taxonomy_ids:
            order_by_fields = [Taxonomy.amplicon_id] + [cls.id for cls in taxonomy_ontology_classes]

            qtax = (
                self._session
                    .query(Taxonomy, *taxonomy_ontology_classes)
                    .join(*taxonomy_ontology_classes)
                    .filter(Taxonomy.id.in_(taxonomy_ids))
                    .order_by(*order_by_fields)
            )
            # log_query(qtax)

            taxonomy_records = [result for result in qtax.all()]
            taxonomy_records_lcd = [result[0] for result in qtax.all()]

            results = taxonomy_records

        return results

    def possibilities(self, taxonomy_filter, force_cache=False):
        cache = caches['search_results']
        key = make_cache_key(
            'TaxonomyOptions.possibilities',
            taxonomy_filter)
        result = None
        if not force_cache:
            result = cache.get(key)
        if result is None:
            result = self._possibilities(taxonomy_filter)
            cache.set(key, result, CACHE_FOREVER)
        return result

    def _possibilities(self, taxonomy_filter):
        """
        state should be a list of integer IDs for the relevant model, in the order of
        TaxonomyOptions.hierarchy. a value of None indicates there is no selection.
        """

        def determine_target(state):
            # this query is built up over time, and validates the hierarchy provided to us
            q = self._session.query(Taxonomy.id)
            q = apply_amplicon_filter(q, taxonomy_filter.amplicon_filter)
            for idx, ((taxonomy_attr, ontology_class), taxonomy) in enumerate(zip(TaxonomyOptions.hierarchy, state)):
                valid = True
                if taxonomy is None or taxonomy.get('value') is None:
                    valid = False
                else:
                    q = apply_taxonomy_filter(taxonomy_attr, q, taxonomy)
                    valid = q.first() is not None
                if not valid:
                    return taxonomy_attr, ontology_class, idx
            return None, None, None

        # scan through in order and find our target, by finding the first invalid selection
        target_attr, target_class, target_idx = determine_target(taxonomy_filter.state_vector)
        # the targets to be reset as a result of this choice
        clear = taxonomy_keys[target_idx:]

        # no completion: we have a complete hierarchy
        if target_attr is None:
            return {}
        else:
            # clear invalidated part of the state
            state = taxonomy_filter.state_vector[:target_idx] + [None] * (
                len(TaxonomyOptions.hierarchy) - target_idx)
            # build up a query for our target attribute
            q = self._session.query(
                getattr(Taxonomy, target_attr), target_class.value).group_by(
                    getattr(Taxonomy, target_attr), target_class.value).order_by(target_class.value)
            q = apply_amplicon_filter(q, taxonomy_filter.amplicon_filter)
            for (taxonomy_attr, ontology_class), taxonomy in zip(TaxonomyOptions.hierarchy, state):
                q = apply_taxonomy_filter(taxonomy_attr, q, taxonomy)
            q = apply_trait_filter(q, taxonomy_filter.trait_filter)
            q = q.join(target_class)
            possibilities = q.all()

        result = {
            'new_options': {
                'possibilities': possibilities,
            },
            'clear': clear
        }
        return result


class MetadataInfo:
    def __init__(self):
        self._session = Session()

    def __enter__(self):
        return self

    def __exit__(self, exec_type, exc_value, traceback):
        self._session.close()

    def import_metadata(self):
        return self._session.query(ImportMetadata).one()

    def file_logs(self):
        return self._session.query(ImportedFile).all()

    def excluded_samples(self):
        return self._session.query(ExcludedSamples).all()

    def ontology_errors(self):
        return self._session.query(OntologyErrors).all()


class OntologyInfo:
    def __init__(self):
        self._session = Session()

    def __enter__(self):
        return self

    def __exit__(self, exec_type, exc_value, traceback):
        self._session.close()

    def get_values(self, ontology_class):
        vals = self._session.query(ontology_class.id, ontology_class.value).all()
        vals.sort(key=lambda v: v[1])
        return vals

    def get_values_filtered(self, ontology_class, field_id):
        vals = self._session.query(ontology_class.id, ontology_class.value).filter(ontology_class.id == getattr(SampleContext, field_id)).distinct().all()
        vals.sort(key=lambda v: v[1])
        return vals

    def id_to_value(self, ontology_class, _id):
        if _id is None:
            return None
        return self._session.query(ontology_class.value).filter(ontology_class.id == _id).one()[0]

    def value_to_id(self, ontology_class, value):
        if value is None:
            return None
        return self._session.query(ontology_class.id).filter(ontology_class.value == value).one()[0]

    def get_taxonomy_labels(self):
        return {obj.id: rank_labels_lookup[obj.hierarchy_type]
                for obj in self._session.query(TaxonomySource).all()}


class SampleQuery:
    """
    find samples IDs which match the given taxonomical and
    contextual filters
    """

    def __init__(self, params):
        self._session = Session()
        # amplicon filter is a master filter over the taxonomy; it's not
        # a strict part of the hierarchy, but affects taxonomy options
        # available
        self._taxonomy_filter = params.taxonomy_filter
        self._contextual_filter = params.contextual_filter
        self._sample_integrity_warnings_filter = params.sample_integrity_warnings_filter

    def __enter__(self):
        return self

    def __exit__(self, exec_type, exc_value, traceback):
        self._session.close()

    def _q_all_cached(self, topic, q, mutate_result=None):
        cache = caches['search_results']

        stmt = q.with_labels().statement
        compiled = stmt.compile()
        params = compiled.params

        key = make_cache_key(
            'SampleQuery._q_all_cached',
            topic,
            str(compiled),
            params)

        result = cache.get(key)
        if result is None:
            result = q.all()
            if mutate_result:
                result = mutate_result(result)
            cache.set(key, result, CACHE_7DAYS)
        return result

    def matching_taxonomy_graph_data(self, all=False):
        taxolistall = {}
        groupByAttr = getattr(OTUSampleOTU, taxonomy_key_id_names[-1])
        for (taxonomy_attr, ontology_class), taxonomy in zip(TaxonomyOptions.hierarchy,
                                                             self._taxonomy_filter.state_vector):
            if taxonomy is None or taxonomy.get('value') is None:
                groupByAttr = getattr(OTUSampleOTU, taxonomy_attr)
                break
            taxolistall[taxonomy_attr] = taxonomy

        if groupByAttr:
            ampliconAttr = getattr(OTUSampleOTU, 'amplicon_id')
            traitsAttr = getattr(OTUSampleOTU, 'traits')
            amEnvironmentAttr = getattr(SampleContext, 'am_environment_id')
            q = self._session.query(
                ampliconAttr, groupByAttr, amEnvironmentAttr, traitsAttr, func.sum(OTUSampleOTU.count)
                ).group_by(groupByAttr).group_by(ampliconAttr).group_by(amEnvironmentAttr).group_by(traitsAttr)
            q = apply_op_and_val_filter(ampliconAttr, q, self._taxonomy_filter.amplicon_filter)
            q = apply_op_and_array_filter(traitsAttr, q, self._taxonomy_filter.trait_filter)
            for otu_attr, taxonomy in taxolistall.items():
                q = apply_op_and_val_filter(getattr(OTUSampleOTU, otu_attr), q, taxonomy)
            q = q.filter(SampleContext.id == OTUSampleOTU.sample_id)
            q = self._sample_integrity_warnings_filter.apply(q)
            q = self._contextual_filter.apply(q)
            # log_query(q)
        return self._q_all_cached('matching_taxonomy_graph_data', q)

    def import_traits(self, amplicon_filter):
        q = self._session.query(func.unnest(OTUSampleOTU.traits)).distinct().group_by(OTUSampleOTU.traits)
        q = apply_op_and_val_filter(OTUSampleOTU.amplicon_id, q, amplicon_filter)
        # log_query(q)
        vals = self._q_all_cached('import_traits', q)
        vals.sort(key=lambda v: v[0])
        return vals

    def matching_sample_graph_data(self, headers):
        query_headers = [getattr(SampleContext, h) for h in headers if h]
        q = self._session.query(*query_headers)
        subq = self._build_taxonomy_subquery()
        q = self._assemble_sample_query(q, subq)
        # log_query(q)
        return self._q_all_cached('matching_sample_graph', q)

    def matching_sample_headers(self, required_headers=None, sorting=()):
        query_headers = [SampleContext.id, SampleContext.am_environment_id]
        joins = []  # Keep track of any foreign ontology classes which may be needed to be joined to.

        if required_headers:
            for h in required_headers:
                if not h:
                    continue

                col = getattr(SampleContext, h)

                if hasattr(col, "ontology_class"):
                    # we must create an alias here, as a single ontology may be linked to multiple
                    # columns (e.g. Broad Land Use, Detailed Land use)
                    aliased_table = aliased(col.ontology_class)
                    foreign_id = getattr(aliased_table, 'id')
                    foreign_col = getattr(aliased_table, 'value')
                    query_headers.append(foreign_col)
                    joins.append((aliased_table, foreign_id == col))
                else:
                    query_headers.append(col)

        q = self._session.query(*query_headers)
        for join, cond in joins:
            q = q.outerjoin(join, cond)

        subq = self._build_taxonomy_subquery()
        q = self._assemble_sample_query(q, subq)

        for sort in sorting:
            sort_col = sort['col_idx']
            if sort.get('desc', False):
                q = q.order_by(query_headers[int(sort_col)].desc())
            else:
                q = q.order_by(query_headers[int(sort_col)])
        # log_query(q)
        return self._q_all_cached('matching_sample_headers', q)

    def matching_selected_samples(self, subq, *query_entities):
        q = self._session.query(*query_entities)
        q = self._assemble_sample_query(q, subq).order_by(SampleContext.id)
        # log_query(q)
        return self._q_all_cached('matching_selected_samples', q)

    def matching_samples(self, entity=SampleContext):
        return self.matching_selected_samples(
            self._build_taxonomy_subquery(),
            entity)

    def matching_otus_biom(self):
        q = self._session.query(OTU)
        subq = self._build_contextual_subquery()
        q = self._assemble_otu_query(q, subq).order_by(OTU.id)
        return q

    def matching_otu_ids(self):
        q = self._session\
                .query(OTU.id)\
                .filter(OTU.id == SampleOTU.otu_id)\
                .join(Taxonomy.otus)\
                .distinct()

        q = self.apply_sample_otu_filters(q)

        # log_query(q)
        return q

    def matching_otus(self, otu_ids):
        q = self._session\
                .query(OTU.id, OTU.code, Sequence.seq)\
                .join(Sequence, Sequence.id == OTU.id)\
                .filter(OTU.id.in_(otu_ids))

        # log_query(q)
        return q

    def otu_export(self):
        q = self._session.query(taxonomy_otu_export, SampleOTU, OTU).filter(
            taxonomy_otu_export.c.otu_id == SampleOTU.otu_id). filter(
                SampleOTU.otu_id == OTU.id)
        q = self._taxonomy_filter.apply(q, taxonomy_otu_export.c)
        if not self._sample_integrity_warnings_filter.is_empty():
            q = self._sample_integrity_warnings_filter.apply(
                q.filter(SampleContext.id == SampleOTU.sample_id))
        if not self._contextual_filter.is_empty():
            q = self._contextual_filter.apply(
                q.filter(SampleContext.id == SampleOTU.sample_id))

        # we don't cache this query: the result size is enormous,
        # and we're unlikely to have the same query run twice.
        # instead, we return the sqlalchemy query object so that
        # it can be iterated over
        # log_query(q)
        return q

    def matching_sample_otu_sequences(self):
        q = self._session\
                .query(OTU.code, Sequence.seq)\
                .filter(OTU.id == SampleOTU.otu_id)\
                .join(Taxonomy.otus)\
                .join(Sequence, Sequence.id == OTU.id)\
                .distinct()

        q = self.apply_sample_otu_filters(q)

        # log_query(q)
        return q

    def matching_sample_otus(self, *args):
        q = self._session\
                .query(*args)\
                .filter(OTU.id == SampleOTU.otu_id)\
                .join(Taxonomy.otus)

        q = self.apply_sample_otu_filters(q)

        # log_query(q)
        return q

    def matching_sample_otus_blast(self, otu_ids):
        q = self._session\
                .query(OTU.id, OTU.code, Sequence.seq, SampleOTU.count, SampleContext.id, SampleContext.latitude, SampleContext.longitude)\
                .join(Taxonomy.otus)\
                .join(SampleOTU, SampleOTU.otu_id == OTU.id)\
                .join(SampleContext, SampleContext.id == SampleOTU.sample_id)\
                .join(Sequence, Sequence.id == OTU.id)\
                .filter(OTU.id.in_(otu_ids))

        q = self.apply_sample_otu_filters(q)

        # log_query(q)
        return q

    # note: does not actually use the usual params in q
    # (since this function is passed them explicitly because they are needed upstream)
    def matching_sample_otus_krona(self, sample_id, amplicon_id, taxonomy_source_id):
        q = self._session\
                .query(SampleOTU, Taxonomy)\
                .join(taxonomy_otu, taxonomy_otu.c.otu_id == SampleOTU.otu_id)\
                .join(Taxonomy, Taxonomy.id == taxonomy_otu.c.taxonomy_id)\
                .filter(SampleOTU.sample_id == sample_id)\
                .filter(Taxonomy.amplicon_id == amplicon_id)\
                .filter(Taxonomy.taxonomy_source_id == taxonomy_source_id)

        # log_query(q)
        return q

    def apply_sample_otu_filters(self, q):
        q = self._taxonomy_filter.apply(q, Taxonomy)

        if not self._sample_integrity_warnings_filter.is_empty():
            q = self._sample_integrity_warnings_filter.apply(
                q.filter(SampleContext.id == SampleOTU.sample_id))
        if not self._contextual_filter.is_empty():
            q = self._contextual_filter.apply(
                q.filter(SampleContext.id == SampleOTU.sample_id))

        # log_query(q)
        return q

    def matching_sample_distance_matrix(self):
        q = self._session\
                .query(SampleOTU.sample_id, SampleOTU.otu_id, SampleOTU.count)\
                .filter(OTU.id == SampleOTU.otu_id)\
                .join(Taxonomy.otus)

        q = self.apply_sample_otu_filters(q)
        q = q.order_by(SampleOTU.sample_id, SampleOTU.otu_id)

        # log_query(q)
        return q

    def matching_sample_otus_groupby_lat_lng_id_20k(self):
        # Richness and abundance sums will be meaningless if we aren't
        # filtering on taxonomy_source_id, so use NULL in these cases.
        aggregates = (
            (sqlalchemy.null(), sqlalchemy.null())
            if self._taxonomy_filter.state_vector[0] is None else (
                func.sum(OTUSampleOTU.richness_20k),
                # Note: sum(OTUSampleOTU.sum_count_20k) can be NULL (Python None)
                func.sum(OTUSampleOTU.sum_count_20k)))

        q = (self._session.query(
            SampleContext.latitude,
            SampleContext.longitude,
            SampleContext.id,
            *aggregates)
            .filter(SampleContext.id == OTUSampleOTU.sample_id)
            .group_by(SampleContext.id))
        q = apply_op_and_val_filter(getattr(OTUSampleOTU, 'amplicon_id'), q, self._taxonomy_filter.amplicon_filter)
        q = apply_op_and_array_filter(getattr(OTUSampleOTU, 'traits'), q, self._taxonomy_filter.trait_filter)
        for (taxonomy_attr, ontology_class), taxonomy in zip(TaxonomyOptions.hierarchy,
                                                             self._taxonomy_filter.state_vector):
            q = apply_op_and_val_filter(getattr(OTUSampleOTU, taxonomy_attr), q, taxonomy)
        q = self._sample_integrity_warnings_filter.apply(q)
        q = self._contextual_filter.apply(q)
        # log_query(q)
        return q

    def _build_taxonomy_subquery(self):
        """
        return the Sample IDs (as ints) which have a non-zero OTU count for OTUs
        matching the taxonomy filter
        """
        if self._taxonomy_filter.is_empty():
            return None
        # Use of materialized view
        q = self._session.query(OTUSampleOTU.sample_id).group_by(OTUSampleOTU.sample_id)
        q = apply_op_and_val_filter(getattr(OTUSampleOTU, 'amplicon_id'), q, self._taxonomy_filter.amplicon_filter)
        q = apply_op_and_array_filter(getattr(OTUSampleOTU, 'traits'), q, self._taxonomy_filter.trait_filter)
        for (taxonomy_attr, ontology_class), taxonomy in zip(TaxonomyOptions.hierarchy,
                                                             self._taxonomy_filter.state_vector):
            q = apply_op_and_val_filter(getattr(OTUSampleOTU, taxonomy_attr), q, taxonomy)
        # log_query(q)
        return q

    def _build_contextual_subquery(self):
        """
        return the OTU ID (as ints) which have a non-zero OTU count for Samples
        matching the contextual filter
        """
        # shortcut: if we don't have any filters, don't produce a subquery
        if self._contextual_filter.is_empty() and self._sample_integrity_warnings_filter.is_empty():
            return None
        q = (self._session.query(SampleOTU.otu_id)
                          .join(SampleContext)
                          .filter(SampleContext.id == SampleOTU.sample_id)
                          .group_by(SampleOTU.otu_id))
        q = self._sample_integrity_warnings_filter.apply(q)
        q = self._contextual_filter.apply(q)

        return q

    def _assemble_sample_query(self, sample_query, taxonomy_subquery):
        """
        applies the passed taxonomy_subquery to apply taxonomy filters.

        paging support: applies limit and offset, and returns (count, [sample_id, ...])
        """
        # we use a window function here, to get count() over the whole query without having to
        # run it twice
        q = sample_query
        if taxonomy_subquery is not None:
            q = q.filter(SampleContext.id.in_(taxonomy_subquery))

        # apply the sample integrity warnings filters separately to the contextual filters
        # so that the contextual results are always a subset of the sample integrity warnings results
        #
        # i.e. now the WHERE clause with an "any" type filter will be of the form:
        # 
        # WHERE
        #     otu.sample_context.id IN (<subquery>)
        #     AND otu.sample_context.sample_integrity_warnings_id = 3
        #     AND (otu.sample_context.sample_type_id = 1 OR otu.sample_context.sample_type_id = 4)
        # 
        # and the WHERE clause with an "all" type filter will be of the form:
        # 
        # WHERE
        #     otu.sample_context.id IN (<subquery>)
        #     AND otu.sample_context.sample_integrity_warnings_id = 3
        #     AND otu.sample_context.sample_type_id = 1
        #     AND otu.sample_context.sample_type_id = 4
        #
        # rather than the "any" filter being of the form:
        # which returns unintended results
        #
        # WHERE
        #     otu.sample_context.id IN (<subquery>)
        #     AND (otu.sample_context.sample_integrity_warnings_id = 3
        #          OR otu.sample_context.sample_type_id = 1
        #          OR otu.sample_context.sample_type_id = 4)

        q = self._sample_integrity_warnings_filter.apply(q)
        q = self._contextual_filter.apply(q)

        return q

    def _assemble_otu_query(self, otu_query, contextual_subquery):
        """
        applies the passed contextual_subquery to apply taxonomy filters.

        paging support: applies limit and offset, and returns (count, [sample_id, ...])
        """
        # we use a window function here, to get count() over the whole query without having to
        # run it twice
        q = otu_query
        if contextual_subquery is not None:
            q = q.filter(OTU.id.in_(contextual_subquery))
        # apply taxonomic filter terms
        q = self._taxonomy_filter.apply(q.join(Taxonomy.otus), Taxonomy)
        # log_query(q)
        return q

class SampleSchemaDefinition:
    """
    find samples contextual database schema definition
    """
    def __init__(self):
        self._session = Session()

    def __enter__(self):
        return self

    def __exit__(self, exec_type, exc_value, traceback):
        self._session.close()

    def get_schema_definition_url(self):
        return self._session.query(SampleContext.database_schema_definitions_url).distinct().one()

class TaxonomyFilter:
    def __init__(self, amplicon_filter, state_vector, trait_filter):
        self.amplicon_filter = amplicon_filter
        sv_iter = iter(state_vector)
        self.state_vector =  [next(sv_iter, None) for _ in TaxonomyOptions.hierarchy]
        self.trait_filter = trait_filter

    def __repr__(self):
        return '<TaxonomyFilter(%s,state_vec[%s],%s)>' % (
            self.amplicon_filter,
            self.state_vector,
            self.trait_filter)

    def to_dict(self):
        amplicon_descr, taxonomy_descr, trait_descr = self.describe()
        return {
            "amplicon": amplicon_descr,
            "taxonomy": taxonomy_descr,
            "trait": trait_descr,
        }

    def describe(self):
        with OntologyInfo() as info:
            amplicon_description = describe_op_and_val(info, 'amplicon', OTUAmplicon, self.amplicon_filter)
            trait_description = describe_op_and_val_only('trait', self.trait_filter)
            try:
                ts = int(self.state_vector[0]['value'])
            except (KeyError, IndexError, TypeError, ValueError):
                labels_for_taxonomy = []
            else:
                labels_for_taxonomy = ['Taxonomy', *info.get_taxonomy_labels().get(ts, [])]
            taxonomy_descriptions = [
                describe_op_and_val(info, taxonomy_label, ontology_class, taxonomy)
                for (taxonomy_attr, ontology_class), taxonomy_label, taxonomy in
                zip(TaxonomyOptions.hierarchy, labels_for_taxonomy, self.state_vector)
                if taxonomy]
            return amplicon_description, taxonomy_descriptions, trait_description

    def is_empty(self): # See EmptyOTUQuery in frontend/
        return not self.amplicon_filter and self.state_vector[0] is None and not self.trait_filter

    def get_rank_equality_value(self, rank_level):
        return get_op_is_value(self.state_vector[rank_level])

    def apply(self, q, TaxonomyClass):
        q = apply_op_and_val_filter(
            TaxonomyClass.amplicon_id,
            q, self.amplicon_filter)
        q = apply_op_and_array_filter(TaxonomyClass.traits, q, self.trait_filter)
        for (taxonomy_attr, ontology_class), op_and_val in zip(TaxonomyOptions.hierarchy, self.state_vector):
            q = apply_op_and_val_filter(getattr(TaxonomyClass, taxonomy_attr),
                                        q, op_and_val)
        return q


class ContextualFilter:
    mode_operators = {
        'or': sqlalchemy.or_,
        'and': sqlalchemy.and_,
    }

    def __init__(self, mode, environment_filter, metagenome_only=False):
        self.mode = mode
        self.mode_func = ContextualFilter.mode_operators[self.mode]
        self.environment_filter = environment_filter
        self.terms = []
        self.metagenome_only = metagenome_only

    def __repr__(self):
        return '<ContextualFilter(%s,env[%s],mg[%s],[%s]>' % (
            self.mode,
            repr(self.environment_filter), repr(self.metagenome_only), ','.join(repr(t) for t in self.terms))

    def to_dict(self):
        return {
            "terms": self.describe(),
        }

    def describe(self):
        descr = []
        with OntologyInfo() as info:
            env_descr = describe_op_and_val(info, 'am_environment', Environment, self.environment_filter)
            descr.append(env_descr)
            descr += [term.describe() for term in self.terms]
        return [t for t in descr if t]

    def is_empty(self):
        return len(self.terms) == 0 and not self.environment_filter and not self.metagenome_only

    def add_term(self, term):
        self.terms.append(term)

    def restrict_metagenome_only(self, q):
        return q.filter(SampleContext.id == SampleMeta.sample_id).filter(
            SampleMeta.has_metagenome == True)

    def apply(self, q):
        """
        return q with contextual filter terms applied to it
        """
        # if there's an environment filter, it applies prior to the filters
        # below, so it's outside of the application of mode_func
        q = apply_environment_filter(q, self.environment_filter)
        if self.metagenome_only:
            q = self.restrict_metagenome_only(q)
        # chain together the conditions provided by each term,
        # combine into a single expression using our mode,
        # then filter the query
        return q.filter(
            self.mode_func(
                *(chain(*(t.conditions for t in self.terms)))))


class ContextualFilterTerm:
    def __init__(self, field_name, operator):
        self.field_name = field_name
        self.field = getattr(SampleContext, self.field_name)
        self.operator = operator

    @property
    def complement(self):
        return self.operator == 'complement'

    @property
    def conditions(self):
        if self.complement:
            return [sqlalchemy.not_(c) for c in (self.get_conditions())]
        return self.get_conditions()


class ContextualFilterTermBetween(ContextualFilterTerm):
    def get_conditions(self):
        return [
            self.field.between(self.val_from, self.val_to)
        ]

    def describe(self):
        if self.complement:
            return '{}<{},>{}'.format(
                SampleContext.display_name(self.field_name),
                self.val_from,
                self.val_to)
        else:
            return '{}<={}<={}'.format(
                self.val_from,
                SampleContext.display_name(self.field_name),
                self.val_to)


class ContextualFilterTermFloat(ContextualFilterTermBetween):
    def __init__(self, field_name, operator, val_from, val_to):
        super().__init__(field_name, operator)
        assert(type(val_from) is float)
        assert(type(val_to) is float)
        self.val_from = val_from
        self.val_to = val_to

    def __repr__(self):
        return '<TermFloat(%s,%s,%s,%s)>' % (self.field_name, self.operator, self.val_from, self.val_to)


class ContextualFilterTermLongitude(ContextualFilterTermFloat):
    def get_conditions(self):
        return [
            (self.field.between(self.val_from, self.val_to)) |
            (self.field.between(self.val_from + 360, self.val_to + 360)) |
            (self.field.between(self.val_from - 360, self.val_to - 360))
        ]


class ContextualFilterTermDate(ContextualFilterTermBetween):
    def __init__(self, field_name, operator, val_from, val_to):
        super().__init__(field_name, operator)
        assert(type(val_from) is datetime.date)
        assert(type(val_to) is datetime.date)
        self.val_from = val_from
        self.val_to = val_to

    def __repr__(self):
        return '<TermDate(%s,%s,%s,%s)>' % (self.field_name, self.operator, self.val_from, self.val_to)


class ContextualFilterTermTime(ContextualFilterTermBetween):
    def __init__(self, field_name, operator, val_from, val_to):
        super().__init__(field_name, operator)
        assert(type(val_from) is datetime.time)
        assert(type(val_to) is datetime.time)
        self.val_from = val_from
        self.val_to = val_to

    def __repr__(self):
        return '<TermTime(%s,%s,%s,%s)>' % (self.field_name, self.operator, self.val_from, self.val_to)


class ContextualFilterTermString(ContextualFilterTerm):
    def __init__(self, field_name, operator, val_contains):
        super().__init__(field_name, operator)
        assert(type(val_contains) is str)
        self.val_contains = val_contains

    def __repr__(self):
        return '<TermString(%s,%s,%s)>' % (self.field_name, self.operator, self.val_contains)

    def get_conditions(self):
        cond = self.field.contains(self.val_contains)
        return [cond]

    def describe(self):
        if self.complement:
            return '{} does not contain "{}"'.format(
                SampleContext.display_name(self.field_name),
                self.val_contains)
        else:
            return '{} contains "{}"'.format(
                SampleContext.display_name(self.field_name),
                self.val_contains)


class ContextualFilterTermOntology(ContextualFilterTerm):
    def __init__(self, field_name, operator, val_is):
        super().__init__(field_name, operator)
        assert(type(val_is) is int)
        self.val_is = val_is

    def __repr__(self):
        return '<TermOntology(%s,%s,%s)>' % (self.field_name, self.operator, self.val_is)

    def get_conditions(self):
        return [
            self.field == self.val_is
        ]

    def describe(self):
        with OntologyInfo() as info:
            val = info.id_to_value(self.field.ontology_class, self.val_is)
        if self.complement:
            return "{} is not '{}'".format(
                SampleContext.display_name(self.field_name),
                val)
        else:
            return "{} is '{}'".format(
                SampleContext.display_name(self.field_name),
                val)


class ContextualFilterTermSampleID(ContextualFilterTerm):
    def __init__(self, field_name, operator, val_is_in):
        super().__init__(field_name, operator)
        assert(type(val_is_in) is list)
        self.val_is_in = val_is_in

    def __repr__(self):
        return '<TermSampleID(%s,%s,%s)>' % (self.field_name, self.operator, self.val_is_in)

    def get_conditions(self):
        return [
            self.field.in_(self.val_is_in)
        ]

    def describe(self):
        if self.complement:
            return '{} is not in "{}"'.format(
                SampleContext.display_name('id'),
                self.val_is_in)
        else:
            return '{} is in "{}"'.format(
                SampleContext.display_name('id'),
                self.val_is_in)


# if the sample_id is an integer, then sort as integer and not alpha-numerically
# i.e. avoid results like 138939, 13894, 138940, 138941
# otherwise (if sample_id has letters), then place at the end and sort normally
def sort_sample_ids_key(s):
    try:
        int(s)
        return int(s)
    except ValueError:
        try:
            return float(s)
        except ValueError:
            return float('inf')

def get_sample_ids():
    session = Session()
    ids = [t[0] for t in session.query(SampleContext.id).all()]
    session.close()

    return sorted(ids, key=lambda x: (sort_sample_ids_key(x), x))


OP_DESCR = {
    'is': ' is ',
    'isnot': ' is not ',
}


def describe_op_and_val(ontology_info, attr, cls, q):
    if q is None:
        return None
    return ''.join([attr, OP_DESCR[q.get('operator')], repr(ontology_info.id_to_value(cls, q.get('value')))])


def describe_op_and_val_only(attr, q):
    if q is None:
        return None
    return ''.join(([attr, OP_DESCR[q.get('operator')], repr(q.get('value'))]))

def get_op_is_value(op_and_val):
    op, val = (op_and_val and
               (op_and_val.get('operator'), op_and_val.get('value')) or
               (None, None))
    return val if ((val is not None) and (op != 'isnot')) else None

def apply_op_and_val_filter(attr, q, op_and_val):
    if op_and_val is None or op_and_val.get('value') is None:
        return q
    value = op_and_val.get('value')
    if op_and_val.get('operator', 'is') == 'isnot':
        q = q.filter(attr != value)
    else:
        q = q.filter(attr == value)
    return q

def apply_op_and_array_filter(attr, q, op_and_array):
    if op_and_array is None or op_and_array.get('value') is None:
        return q
    value = op_and_array.get('value')
    if op_and_array.get('operator', 'is') == 'isnot':
        q = q.filter(attr.all(value, operator=operators.ne))
    else:
        q = q.filter(attr.any(value))
    return q


def apply_taxonomy_filter(taxonomy_attr, q, op_and_val):
    return apply_op_and_val_filter(getattr(Taxonomy, taxonomy_attr), q, op_and_val)

apply_environment_filter = partial(apply_op_and_val_filter, SampleContext.am_environment_id)
apply_amplicon_filter = partial(apply_op_and_val_filter, Taxonomy.amplicon_id)
apply_trait_filter = partial(apply_op_and_array_filter, Taxonomy.traits)


def log_query(q):
    try:
        s = q.statement.compile(dialect=postgresql.dialect(), compile_kwargs={'literal_binds': True})
    except NotImplementedError:
        s = q.statement.compile(dialect=postgresql.dialect())
    logger.debug(f"Query [{inspect.currentframe().f_back.f_code.co_name}]: \n{s}")
