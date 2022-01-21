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
    OTUAmplicon,
    OTUKingdom,
    OTUPhylum,
    OTUClass,
    OTUOrder,
    OTUFamily,
    OTUGenus,
    OTUSpecies,
    SampleContext,
    SampleOTU,
    OTUSampleOTU,
    OTUSampleOTU20K,
    SampleOTU20K,
    ImportMetadata,
    ImportedFile,
    ExcludedSamples,
    OntologyErrors,
    Taxonomy,
    TaxonomySource,
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
    def __init__(self, contextual_filter, taxonomy_filter):
        self.contextual_filter = contextual_filter
        self.taxonomy_filter = taxonomy_filter
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
        return pfx + '; '.join(parts)

    def describe(self, max_chars=100):
        "a short title, maximum length `max_chars`"

        parts = []
        amplicon_descr, taxonomy_descr, trait_descr = self.taxonomy_filter.describe()
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
            for entry in self.contextual_filter.describe():
                p.append(indent + entry)
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
            ]

        add_section(amplicon_section())
        add_section(taxonomy_section())
        add_section(trait_section())
        add_section(contextual_section())
        add_section(metadata_section())

        return '\n\n'.join(parts)

    def __repr__(self):
        # Note: used for caching, so make sure all components have a defined
        # representation that's stable over time
        return 'OTUQueryParams<{},{}>'.format(
            self.contextual_filter,
            self.taxonomy_filter)


class TaxonomyOptions:
    hierarchy = [
        ('taxonomy_source_id', TaxonomySource),
        ('kingdom_id', OTUKingdom),
        ('phylum_id', OTUPhylum),
        ('class_id', OTUClass),
        ('order_id', OTUOrder),
        ('family_id', OTUFamily),
        ('genus_id', OTUGenus),
        ('species_id', OTUSpecies),
    ]

    def __init__(self):
        self._session = Session()

    def __enter__(self):
        return self

    def __exit__(self, exec_type, exc_value, traceback):
        self._session.close()

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
        state should be a list of integer IDs for the relevent model, in the order of
        TaxonomyOptions.hierarchy. a value of None indicates there is no selection.
        """

        def drop_id(attr):
            "return without `_id`"
            return attr[:-3]

        def determine_target(state):
            # this query is built up over time, and validates the hierarchy provided to us
            q = self._session.query(Taxonomy.kingdom_id).join(OTU).group_by(
                    Taxonomy.kingdom_id)
            q = apply_amplicon_filter(q, taxonomy_filter.amplicon_filter)
            for idx, ((taxonomy_attr, ontology_class), taxonomy) in enumerate(zip(TaxonomyOptions.hierarchy, state)):
                valid = True
                if taxonomy is None or taxonomy.get('value') is None:
                    valid = False
                else:
                    q = apply_taxonomy_filter(taxonomy_attr, q, taxonomy)
                    valid = q.count() > 0
                if not valid:
                    return taxonomy_attr, ontology_class, idx
            return None, None, None

        # scan through in order and find our target, by finding the first invalid selection
        target_attr, target_class, target_idx = determine_target(taxonomy_filter.state_vector)
        # the targets to be reset as a result of this choice
        clear = [drop_id(attr) for attr, _ in TaxonomyOptions.hierarchy[target_idx:]]

        # no completion: we have a complete hierarchy
        if target_attr is None:
            return {}
        else:
            # clear invalidated part of the state
            state = taxonomy_filter.state_vector[:target_idx] + [None] * (
                len(TaxonomyOptions.hierarchy) - target_idx)
            # build up a query of the OTUs for our target attribute
            q = self._session.query(
                getattr(Taxonomy, target_attr), target_class.value).join(OTU).group_by(
                    getattr(Taxonomy, target_attr), target_class.value).order_by(target_class.value)

            q = apply_amplicon_filter(q, taxonomy_filter.amplicon_filter)
            for (taxonomy_attr, ontology_class), taxonomy in zip(TaxonomyOptions.hierarchy, state):
                q = apply_taxonomy_filter(taxonomy_attr, q, taxonomy)
            q = apply_trait_filter(q, taxonomy_filter.trait_filter)
            q = q.join(target_class)
            possibilities = q.all()

        result = {
            'new_options': {
                'target': drop_id(target_attr),
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


class OTUSampleOTUQuery:
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
            'OTUSampleOTUQuery._q_all_cached',
            topic,
            str(compiled),
            params)

        result = cache.get(key)
        if not result:
            result = q.all()
            if mutate_result:
                result = mutate_result(result)
            cache.set(key, result, CACHE_7DAYS)
        return result

    def matching_taxonomy_graph_data(self, all=False):
        taxolistall = {}
        groupByAttr = getattr(OTUSampleOTU, "species_id")
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
        if not result:
            result = q.all()
            if mutate_result:
                result = mutate_result(result)
            cache.set(key, result, CACHE_7DAYS)
        return result

    def matching_sample_graph_data(self, headers=None):
        query_headers = []
        if headers:
            for h in headers:
                if not h:
                    continue
                col = getattr(SampleContext, h)
                query_headers.append(col)

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

    def matching_samples(self):
        q = self._session.query(SampleContext)
        subq = self._build_taxonomy_subquery()
        q = self._assemble_sample_query(q, subq).order_by(SampleContext.id)
        # log_query(q)
        return self._q_all_cached('matching_samples', q)

    def matching_samples_20k(self):
        q = self._session.query(SampleContext)
        subq = self._build_taxonomy_subquery_20k()
        q = self._assemble_sample_query(q, subq).order_by(SampleContext.id)
        # log_query(q)
        return self._q_all_cached('matching_samples_20k', q)

    def matching_selected_samples_20k(self, subq):
        q = self._session.query(SampleContext)
        q = self._assemble_sample_query(q, subq).order_by(SampleContext.id)
        # log_query(q)
        return self._q_all_cached('matching_selected_samples_20k', q)

    def matching_otus(self):
        q = self._session.query(OTU)
        subq = self._build_contextual_subquery()
        q = self._assemble_otu_query(q, subq).order_by(OTU.id)
        return q

    def has_matching_sample_otus(self, kingdom_id):
        def to_boolean(result):
            return result[0][0]

        q = self._session.query(self.matching_sample_otus(
            SampleOTU.sample_id,
            SampleOTU.otu_id,
            SampleOTU.count, kingdom_id=kingdom_id).exists())
        return self._q_all_cached('has_matching_sample_otus:%s' % (kingdom_id), q, to_boolean)

    def matching_sample_otus(self, *args, kingdom_id=None):
        # we do a cross-join, but convert to an inner-join with
        # filters. as SampleContext is in the main query, the
        # machinery for filtering above will just work
        q = self._session.query(*args) \
            .filter(OTU.id == SampleOTU.otu_id) \
            .filter(SampleContext.id == SampleOTU.sample_id)
        q = self._taxonomy_filter.apply(q)
        q = self._contextual_filter.apply(q)
        if kingdom_id is not None:
            q = q.filter(Taxonomy.kingdom_id == kingdom_id)
        # we don't cache this query: the result size is enormous,
        # and we're unlikely to have the same query run twice.
        # instead, we return the sqlalchemy query object so that
        # it can be iterated over
        # log_query(q)
        return q

    def matching_sample_otus_groupby_lat_lng_id_20k(self, *args):
        q = self._session.query(*args, func.sum(OTUSampleOTU20K.richness), func.sum(OTUSampleOTU20K.count)) \
            .filter(SampleContext.id == OTUSampleOTU20K.sample_id) \
            .group_by(SampleContext.latitude, SampleContext.longitude, SampleContext.id)
        q = apply_op_and_val_filter(getattr(OTUSampleOTU20K, 'amplicon_id'), q, self._taxonomy_filter.amplicon_filter)
        q = apply_op_and_array_filter(getattr(OTUSampleOTU20K, 'traits'), q, self._taxonomy_filter.trait_filter)
        for (taxonomy_attr, ontology_class), taxonomy in zip(TaxonomyOptions.hierarchy,
                                                             self._taxonomy_filter.state_vector):
            q = apply_op_and_val_filter(getattr(OTUSampleOTU20K, taxonomy_attr), q, taxonomy)
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

    def _build_taxonomy_subquery_20k(self):
        """
        return the Sample IDs (as ints) which have a non-zero OTU count for OTUs
        matching the taxonomy filter
        """
        if self._taxonomy_filter.is_empty():
            return None
        # Use of materialized view
        q = self._session.query(OTUSampleOTU20K.sample_id).group_by(OTUSampleOTU20K.sample_id)
        q = apply_op_and_val_filter(getattr(OTUSampleOTU20K, 'amplicon_id'), q, self._taxonomy_filter.amplicon_filter)
        q = apply_op_and_array_filter(getattr(OTUSampleOTU20K, 'traits'), q, self._taxonomy_filter.trait_filter)
        for (taxonomy_attr, ontology_class), taxonomy in zip(TaxonomyOptions.hierarchy,
                                                             self._taxonomy_filter.state_vector):
            q = apply_op_and_val_filter(getattr(OTUSampleOTU20K, taxonomy_attr), q, taxonomy)
        # log_query(q)
        return q

    def _build_contextual_subquery(self):
        """
        return the OTU ID (as ints) which have a non-zero OTU count for Samples
        matching the contextual filter
        """
        # shortcut: if we don't have any filters, don't produce a subquery
        if self._contextual_filter.is_empty():
            return None
        q = (self._session.query(SampleOTU.otu_id)
                          .join(SampleContext)
                          .filter(SampleContext.id == SampleOTU.sample_id)
                          .group_by(SampleOTU.otu_id))
        return self._contextual_filter.apply(q)

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
        # apply contextual filter terms
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
        q = self._taxonomy_filter.apply(q)
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
        self.state_vector =  state_vector
        self.trait_filter = trait_filter
        assert(len(self.state_vector) == len(TaxonomyOptions.hierarchy))

    def describe(self):
        with OntologyInfo() as info:
            amplicon_description = describe_op_and_val(info, 'amplicon_id', OTUAmplicon, self.amplicon_filter)
            trait_description = describe_op_and_val_only('trait', self.trait_filter)
            taxonomy_descriptions = []
            for (taxonomy_attr, ontology_class), taxonomy in zip(TaxonomyOptions.hierarchy, self.state_vector):
                descr = describe_op_and_val(info, taxonomy_attr, ontology_class, taxonomy)
                if descr:
                    taxonomy_descriptions.append(descr)
            return amplicon_description, taxonomy_descriptions, trait_description

    def is_empty(self): # FIXME this might always be false
        return not self.amplicon_filter and self.state_vector[0] is None and not self.trait_filter

    def apply(self, q):
        """
        q: sqlalchemy query object selecting from or joined with OTU()
        """
        q = apply_amplicon_filter(
            q.filter(OTU.id == Taxonomy.otu_id),
            self.amplicon_filter)
        q = apply_trait_filter(q, self.trait_filter)
        for (taxonomy_attr, ontology_class), taxonomy in zip(TaxonomyOptions.hierarchy, self.state_vector):
            q = apply_taxonomy_filter(taxonomy_attr, q, taxonomy)
        return q

    def __repr__(self):
        return '<TaxonomyFilter(%s,state_vec[%s],%s)>' % (
            self.amplicon_filter,
            self.state_vector,
            self.trait_filter)


class ContextualFilter:
    mode_operators = {
        'or': sqlalchemy.or_,
        'and': sqlalchemy.and_,
    }

    def __init__(self, mode, environment_filter):
        self.mode = mode
        self.mode_func = ContextualFilter.mode_operators[self.mode]
        self.environment_filter = environment_filter
        self.terms = []

    def __repr__(self):
        return '<ContextualFilter(%s,env[%s],[%s]>' % (
            self.mode,
            repr(self.environment_filter), ','.join(repr(t) for t in self.terms))

    def describe(self):
        descr = []
        with OntologyInfo() as info:
            env_descr = describe_op_and_val(info, 'am_environment_id', Environment, self.environment_filter)
            descr.append(env_descr)
            descr += [term.describe() for term in self.terms]
        return [t for t in descr if t]

    def is_empty(self):
        return len(self.terms) == 0 and not self.environment_filter

    def add_term(self, term):
        self.terms.append(term)

    def apply(self, q):
        """
        return q with contextual filter terms applied to it
        """
        # if there's an environment filter, it applies prior to the filters
        # below, so it's outside of the application of mode_func
        q = apply_environment_filter(q, self.environment_filter)
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


class ContextualFilterTermDate(ContextualFilterTermBetween):
    def __init__(self, field_name, operator, val_from, val_to):
        super().__init__(field_name, operator)
        assert(type(val_from) is datetime.date)
        assert(type(val_to) is datetime.date)
        self.val_from = val_from
        self.val_to = val_to

    def __repr__(self):
        return '<TermDate(%s,%s,%s,%s)>' % (self.field_name, self.operator, self.val_from, self.val_to)


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


def get_sample_ids():
    session = Session()
    ids = [t[0] for t in session.query(SampleContext.id).all()]
    session.close()
    return ids


OP_DESCR = {
    'is': ' is ',
    'isnot': ' is not ',
}


def describe_op_and_val(ontology_info, attr, cls, q):
    if q is None:
        return None
    return ''.join(([attr[:-3], OP_DESCR[q.get('operator')], repr(ontology_info.id_to_value(cls, q.get('value')))]))


def describe_op_and_val_only(attr, q):
    if q is None:
        return None
    return ''.join(([attr, OP_DESCR[q.get('operator')], repr(q.get('value'))]))


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
apply_amplicon_filter = partial(apply_op_and_val_filter, OTU.amplicon_id)
apply_trait_filter = partial(apply_op_and_array_filter, Taxonomy.traits)


def log_query(q):
    try:
        s = q.statement.compile(dialect=postgresql.dialect(), compile_kwargs={'literal_binds': True})
    except NotImplementedError:
        s = q.statement.compile(dialect=postgresql.dialect())
    logger.debug(f"Query [{inspect.currentframe().f_back.f_code.co_name}]: \n{s}")
