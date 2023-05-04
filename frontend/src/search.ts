import { times } from 'lodash'
import { taxonomy_keys } from 'app/constants'

export interface SearchConfig {
  base_url: string
  static_base_url: string
  galaxy_base_url: string

  galaxy_integration: boolean
  ckan_base_url: string
  ckan_check_permissions: string
  default_amplicon: string
  metaxa_amplicon: string
  default_taxonomies: string[]

  reference_data_endpoint: string
  trait_endpoint: string
  taxonomy_endpoint: string
  contextual_endpoint: string
  contextual_graph_endpoint: string
  taxonomy_graph_endpoint: string
  search_endpoint: string
  export_endpoint: string
  export_biom_endpoint: string
  nondenoised_request_endpoint: string
  submit_to_galaxy_endpoint: string
  execute_workflow_on_galaxy_endpoint: string
  galaxy_submission_endpoint: string
  submit_blast_endpoint: string
  blast_submission_endpoint: string
  search_sample_sites_endpoint: string
  required_table_headers_endpoint: string
  contextual_csv_download_endpoint: string
  contextual_schema_definition_endpoint: string
  cookie_consent_declined_endpoint: string
  version: string
}

export enum BooleanOperator {
  AND = 'and',
  OR = 'OR',
}

export interface OperatorAndValue {
  value: string
  operator: 'is' | 'isnot'
}

export interface ContextualFilters {
  filters: any // TODO
  environment: any // TODO
  mode: BooleanOperator
}

export interface OTUQuery {
  taxonomy_filters: OperatorAndValue[]
  contextual_filters: ContextualFilters
  sample_integrity_warnings_filter: ContextualFilters
  amplicon_filter: string
  trait_filter: string
  required_headers?: string[]
  metagenome_only: boolean
}

export const emptyTaxonomyFilter: OperatorAndValue = {
  value: '',
  operator: 'isnot',
}

export const emptyContextualFilters: ContextualFilters = {
  filters: {},
  environment: null,
  mode: BooleanOperator.AND,
}

export const EmptyOTUQuery: OTUQuery = {
  // Be careful using this. We are not filtering on taxonomy source, so there's
  // a risk that you'll get duplicate OTUs. Queries that use this in a taxonomy
  // subquery (select .. from .. where ... in (taxonomy_subquery)) should be OK,
  // as the duplicates don't matter in that case.
  taxonomy_filters: times(taxonomy_keys.length, (_) => emptyTaxonomyFilter),
  contextual_filters: emptyContextualFilters,
  sample_integrity_warnings_filter: emptyContextualFilters,
  amplicon_filter: '',
  trait_filter: '',
  metagenome_only: false,
}
