import * as _ from 'lodash';

export interface SearchConfig {
  ckan_auth_integration: boolean,
  ckan_base_url: string,
  amplicon_endpoint: string,
  taxonomy_endpoint: string,
  contextual_endpoint: string,
  search_endpoint: string,
  export_endpoint: string,
  export_biom_endpoint: string,
  submit_to_galaxy_endpoint: string,
  search_sample_sites_endpoint: string,
  required_table_headers_endpoint: string,
  contextual_csv_download_endpoint: string,
  ckan_check_permissions: string
}

enum BooleanOperator {
    AND = "and",
    OR = "OR"
}

export interface TaxonomyFilter {
    value: string,
    operator: BooleanOperator
}

export interface ContextualFilters {
    filters: any, // TODO
    environment: any, // TODO
    mode: BooleanOperator
}

export interface OTUQuery {
    taxonomy_filters: TaxonomyFilter[],
    contextual_filters: ContextualFilters,
    amplicon_filter: string,
    required_headers?: string[]
}

const empty_taxonomy_filter: TaxonomyFilter = {
    value: '',
    operator: BooleanOperator.AND
}

const emptyContextualFilters: ContextualFilters = {
    filters: {},
    environment: null,
    mode: BooleanOperator.AND
}

export const EmptyOTUQuery: OTUQuery = {
    taxonomy_filters: _.times(7, _ => empty_taxonomy_filter),
    contextual_filters: emptyContextualFilters,
    amplicon_filter: ''
}
