import * as _ from 'lodash'

export const empty_taxonomy_filter: TaxonomyFilter = {
    value: '',
    operator: BooleanOperator.AND
}

export const emptyContextualFilters: ContextualFilters = {
    filters: {},
    environment: null,
    mode: BooleanOperator.AND
}

export const EmptyOTUQuery: OTUQuery = {
    taxonomy_filters: _.times(7, _ => empty_taxonomy_filter),
    contextual_filters: emptyContextualFilters,
    amplicon_filter: ''
}