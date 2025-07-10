import json
from collections import OrderedDict
from .otu import (SampleContext)
from .query import (ContextualFilter,
                    ContextualFilterTermDate, ContextualFilterTermTime,
                    ContextualFilterTermFloat, ContextualFilterTermLongitude,
                    ContextualFilterTermOntology,
                    ContextualFilterTermSampleID, ContextualFilterTermString,
                    OTUQueryParams,
                    TaxonomyFilter, TaxonomyOptions)
from .util import parse_date, parse_time, parse_float


def param_to_filters(query_str, contextual_filtering=True):
    """
    take a JSON encoded query_str, validate, return any errors
    and the filter instances
    """

    otu_query = json.loads(query_str)
    taxonomy_filter = make_clean_taxonomy_filter(
        otu_query['amplicon_filter'],
        otu_query['taxonomy_filters'],
        otu_query['trait_filter'])
    context_spec = otu_query['contextual_filters']
    sample_integrity_spec = otu_query['sample_integrity_warnings_filter']
    contextual_filter = ContextualFilter(context_spec['mode'],
                                         context_spec['environment'],
                                         otu_query['metagenome_only'])
    sample_integrity_warnings_filter = ContextualFilter(sample_integrity_spec['mode'],
                                                        sample_integrity_spec['environment'],
                                                        otu_query['metagenome_only'])

    errors = []

    if contextual_filtering:
        for filter_spec in context_spec['filters']:
            field_name = filter_spec['field']
            if field_name not in SampleContext.__table__.columns:
                errors.append("Please select a contextual data field to filter upon.")
                continue

            try:
                contextual_filter.add_term(_parse_contextual_term(filter_spec))
            except Exception:
                errors.append("Invalid value provided for contextual field `%s'" % field_name)
                logger.critical("Exception parsing field: `%s'", field_name, exc_info=True)

    # process sample integrity separately
    if contextual_filtering:
        for filter_spec in sample_integrity_spec['filters']:
            field_name = filter_spec['field']
            if field_name not in SampleContext.__table__.columns:
                errors.append("Please select a sample integrity warning data field to filter upon.")
                continue

            try:
                sample_integrity_warnings_filter.add_term(_parse_contextual_term(filter_spec))
            except Exception:
                errors.append("Invalid value provided for sample integrity warning field `%s'" % field_name)
                logger.critical("Exception parsing field: `%s'", field_name, exc_info=True)

    return (OTUQueryParams(
        contextual_filter=contextual_filter,
        taxonomy_filter=taxonomy_filter,
        sample_integrity_warnings_filter=sample_integrity_warnings_filter), errors)

def selected_contextual_filters(query_str, contextual_filtering=True):
    otu_query = json.loads(query_str)
    context_spec = otu_query['contextual_filters']
    contextual_filter = []

    if contextual_filtering:
        for filter_spec in context_spec['filters']:
            field_name = filter_spec['field']
            contextual_filter.append(field_name)

    return contextual_filter

def int_if_not_already_none(v):
    if v is None or v == '':
        return None
    v = str(v)  # let's not let anything odd through
    return int(v)

def get_operator_and_int_value(v):
    if v is None or v == '':
        return None
    if v.get('value', '') == '':
        return None
    return OrderedDict((
        ('operator', v.get('operator', 'is')),
        ('value', int_if_not_already_none(v['value'])),
    ))

def get_operator_and_string_value(v):
    if v is None or v == '':
        return None
    if v.get('value', '') == '':
        return None
    return OrderedDict((
        ('operator', v.get('operator', 'is')),
        ('value', v['value']),
    ))

clean_trait_filter = get_operator_and_string_value
clean_amplicon_filter = get_operator_and_int_value
clean_environment_filter = get_operator_and_int_value

def make_clean_taxonomy_filter(amplicon_filter, state_vector, trait_filter):
    """
    take an amplicon filter and a taxonomy filter
    # (a list of phylum, kingdom, ...) and clean it
    """
    assert(len(state_vector) == len(TaxonomyOptions.hierarchy))
    return TaxonomyFilter(
        clean_amplicon_filter(amplicon_filter),
        list(map(
            get_operator_and_int_value,
            state_vector)),
        clean_trait_filter(trait_filter))

def _parse_contextual_term(filter_spec):
    field_name = filter_spec['field']

    operator = filter_spec.get('operator')
    column = SampleContext.__table__.columns[field_name]
    typ = str(column.type)
    if column.name == 'id':
        if len(filter_spec['is']) == 0:
            raise ValueError("Value can't be empty")
        return ContextualFilterTermSampleID(field_name, operator, [t for t in filter_spec['is']])
    elif hasattr(column, 'ontology_class'):
        return ContextualFilterTermOntology(field_name, operator, int(filter_spec['is']))
    elif typ == 'DATE':
        return ContextualFilterTermDate(
            field_name, operator, parse_date(filter_spec['from']), parse_date(filter_spec['to']))
    elif typ == 'TIME':
        return ContextualFilterTermTime(
            field_name, operator, parse_time(filter_spec['from']), parse_time(filter_spec['to']))
    elif typ == 'FLOAT':
        return (ContextualFilterTermLongitude
                if field_name == 'longitude'
                else ContextualFilterTermFloat)(
            field_name, operator, parse_float(filter_spec['from']), parse_float(filter_spec['to']))
    elif typ == 'CITEXT':
        value = str(filter_spec['contains'])
        # if value == '':
        #     raise ValueError("Value can't be empty")
        return ContextualFilterTermString(field_name, operator, value)
    else:
        raise ValueError("invalid filter term type: %s", typ)
