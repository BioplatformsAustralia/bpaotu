import logging
import datetime
import sqlalchemy
from django.core.cache import caches
from sqlalchemy.orm import sessionmaker
from itertools import chain
from hashlib import sha256
from .otu import (
    OTU,
    OTUKingdom,
    OTUPhylum,
    OTUClass,
    OTUOrder,
    OTUFamily,
    OTUGenus,
    OTUSpecies,
    SampleContext,
    SampleOTU,
    make_engine)


logger = logging.getLogger("rainbow")
engine = make_engine()
Session = sessionmaker(bind=engine)


class TaxonomyOptions:
    hierarchy = [
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

    def possibilities(self, state):
        cache = caches['search_results']
        hash_str = 'TaxonomyOptions:cached:' + repr(state)
        key = sha256(hash_str.encode('utf8')).hexdigest()
        result = cache.get(key)
        if not result:
            result = self._possibilities(state)
            cache.set(key, result)
        return result

    def _possibilities(self, state):
        """
        state should be a list of integer IDs for the relevent model, in the order of
        TaxonomyOptions.hierarchy. a value of None indicates there is no selection.
        """

        def drop_id(attr):
            "return without `_id`"
            return attr[:-3]

        def determine_target():
            # this query is built up over time, and validates the hierarchy provided to us
            q = self._session.query(OTU.kingdom_id).group_by(OTU.kingdom_id)
            for idx, ((otu_attr, ontology_class), value) in enumerate(zip(TaxonomyOptions.hierarchy, state)):
                valid = True
                if value is None:
                    valid = False
                else:
                    q = q.filter(getattr(OTU, otu_attr) == value)
                    valid = q.count() > 0
                if not valid:
                    return otu_attr, ontology_class, idx
            return None, None, None

        # scan through in order and find our target, by finding the first invalid selection
        target_attr, target_class, target_idx = determine_target()
        # the targets to be reset as a result of this choice
        clear = [drop_id(attr) for attr, _ in TaxonomyOptions.hierarchy[target_idx:]]

        # no completion: we have a complete hierarchy
        if target_attr is None:
            return {}
        # performance: hard-code kingdom (it's the slowest query, and the most common)
        elif target_class is OTUKingdom:
            possibilities = self._session.query(target_class.id, target_class.value).all()
        else:
            # clear invalidated part of the state
            state = state[:target_idx] + [None] * (len(TaxonomyOptions.hierarchy) - target_idx)
            # build up a query of the OTUs for our target attribute
            q = self._session.query(getattr(OTU, target_attr), target_class.value).group_by(getattr(OTU, target_attr), target_class.value).order_by(target_class.value)
            for (otu_attr, ontology_class), value in zip(TaxonomyOptions.hierarchy, state):
                if value is None:
                    break
                q = q.filter(getattr(OTU, otu_attr) == value)
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


class SampleQuery:
    """
    find samples IDs which match the given taxonomical and
    contextual filters
    """

    def __init__(self, amplicon_filter, contextual_filter, taxonomy_filter):
        self._session = Session()
        # amplicon filter is a master filter over the taxonomy; it's not
        # a strict part of the hierarchy, but affects taxonomy options
        # available
        self._amplicon_filter = amplicon_filter
        self._taxonomy_filter = taxonomy_filter
        self._contextual_filter = contextual_filter

    def __enter__(self):
        return self

    def __exit__(self, exec_type, exc_value, traceback):
        self._session.close()

    def _q_all_cached(self, topic, q):
        cache = caches['search_results']
        hash_str = 'SampleQuery:cached:%s:' % (topic) \
            + repr(self._amplicon_filter) + ':' \
            + repr(self._taxonomy_filter) + ':' \
            + repr(self._contextual_filter)
        key = sha256(hash_str.encode('utf8')).hexdigest()
        result = cache.get(key)
        if not result:
            result = q.all()
            cache.set(key, result)
        return result

    def matching_sample_ids_and_project(self):
        q = self._session.query(SampleContext.id, SampleContext.project_id)
        subq = self._build_taxonomy_subquery()
        q = self._apply_filters(q, subq).order_by(SampleContext.id)
        return self._q_all_cached('matching_sample_ids_and_project', q)

    def matching_samples(self):
        q = self._session.query(SampleContext)
        subq = self._build_taxonomy_subquery()
        q = self._apply_filters(q, subq).order_by(SampleContext.id)
        return self._q_all_cached('matching_samples', q)

    def matching_sample_otus(self):
        # we do a cross-join, but convert to an inner-join with
        # filters. as SampleContext is in the main query, the
        # machinery for filtering above will just work
        q = self._session.query(OTU, SampleOTU, SampleContext) \
            .filter(OTU.id == SampleOTU.otu_id) \
            .filter(SampleContext.id == SampleOTU.sample_id)
        q = self._apply_taxonomy_filters(q)
        q = self._contextual_filter.apply(q)
        # we don't cache this query: the result size is enormous,
        # and we're unlikely to have the same query run twice.
        # instead, we return the sqlalchemy query object so that
        # it can be iterated over
        return q

    def _apply_taxonomy_filters(self, q):
        if self._amplicon_filter:
            q = q.filter(OTU.amplicon_id == self._amplicon_filter)
        for (otu_attr, ontology_class), value in zip(TaxonomyOptions.hierarchy, self._taxonomy_filter):
            if value is None:
                break
            q = q.filter(getattr(OTU, otu_attr) == value)
        return q

    def _build_taxonomy_subquery(self):
        """
        return the BPA IDs (as ints) which have a non-zero OTU count for OTUs
        matching the taxonomy filter
        """
        # shortcut: if we don't have any filters, don't produce a subquery
        if not self._amplicon_filter and self._taxonomy_filter[0] is None:
            return None
        q = self._session.query(SampleOTU.sample_id).distinct().join(OTU)
        return self._apply_taxonomy_filters(q)

    def _apply_filters(self, sample_query, taxonomy_subquery):
        """
        run a contextual query, returning the BPA IDs which match.
        applies the passed taxonomy_subquery to apply taxonomy filters.

        paging support: applies limit and offset, and returns (count, [bpa_id, ...])
        """
        # we use a window function here, to get count() over the whole query without having to
        # run it twice
        q = sample_query
        if taxonomy_subquery is not None:
            q = q.filter(SampleContext.id.in_(taxonomy_subquery))
        # apply contextual filter terms
        q = self._contextual_filter.apply(q)
        return q


class ContextualFilter:
    mode_operators = {
        'or': sqlalchemy.or_,
        'and': sqlalchemy.and_,
    }

    def __init__(self, mode):
        self.mode = mode
        self.mode_func = ContextualFilter.mode_operators[self.mode]
        self.terms = []

    def __repr__(self):
        return '<ContextualFilter(%s,[%s]>' % (self.mode, ','.join(repr(t) for t in self.terms))

    def add_term(self, term):
        self.terms.append(term)

    def apply(self, q):
        """
        return q with contextual filter terms applied to it
        """
        # chain together the conditions provided by each term,
        # combine into a single expression using our mode,
        # then filter the query
        return q.filter(
            self.mode_func(
                *(chain(*(t.get_conditions() for t in self.terms)))))


class ContextualFilterTerm:
    def __init__(self, field_name):
        self.field_name = field_name
        self.field = getattr(SampleContext, self.field_name)


class ContextualFilterTermFloat(ContextualFilterTerm):
    def __init__(self, field_name, val_from, val_to):
        super(ContextualFilterTermFloat, self).__init__(field_name)
        assert(type(val_from) is float)
        assert(type(val_to) is float)
        self.val_from = val_from
        self.val_to = val_to

    def __repr__(self):
        return '<TermFloat(%s,%s,%s)>' % (self.field_name, self.val_from, self.val_to)

    def get_conditions(self):
        return [
            self.field >= self.val_from,
            self.field <= self.val_to
        ]


class ContextualFilterTermDate(ContextualFilterTerm):
    def __init__(self, field_name, val_from, val_to):
        super(ContextualFilterTermDate, self).__init__(field_name)
        assert(type(val_from) is datetime.date)
        assert(type(val_to) is datetime.date)
        self.val_from = val_from
        self.val_to = val_to

    def __repr__(self):
        return '<TermDate(%s,%s,%s)>' % (self.field_name, self.val_from, self.val_to)

    def get_conditions(self):
        return [
            self.field >= self.val_from,
            self.field <= self.val_to
        ]


class ContextualFilterTermString(ContextualFilterTerm):
    def __init__(self, field_name, val_contains):
        super(ContextualFilterTermString, self).__init__(field_name)
        assert(type(val_contains) is str)
        self.val_contains = val_contains

    def __repr__(self):
        return '<TermString(%s,%s)>' % (self.field_name, self.val_contains)

    def get_conditions(self):
        return [
            self.field.contains(self.val_contains)
        ]


class ContextualFilterTermOntology(ContextualFilterTerm):
    def __init__(self, field_name, val_is):
        super(ContextualFilterTermOntology, self).__init__(field_name)
        assert(type(val_is) is int)
        self.val_is = val_is

    def __repr__(self):
        return '<TermOntology(%s,%s)>' % (self.field_name, self.val_is)

    def get_conditions(self):
        return [
            self.field == self.val_is
        ]


class ContextualFilterTermSampleID(ContextualFilterTerm):
    def __init__(self, field_name, val_is_in):
        super(ContextualFilterTermSampleID, self).__init__(field_name)
        assert(type(val_is_in) is list)
        for t in val_is_in:
            assert(type(t) is int)
        self.val_is_in = val_is_in

    def __repr__(self):
        return '<TermSampleID(%s,%s)>' % (self.field_name, self.val_is_in)

    def get_conditions(self):
        return [
            self.field.in_(self.val_is_in)
        ]


def get_sample_ids():
    session = Session()
    ids = [t[0] for t in session.query(SampleContext.id).all()]
    session.close()
    return ids
