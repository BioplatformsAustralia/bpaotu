interface SearchConfig {
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

declare enum BooleanOperator {
    AND = "and",
    OR = "OR"
}

interface TaxonomyFilter {
    value: string,
    operator: BooleanOperator
}

interface ContextualFilters {
    filters: any, // TODO
    environment: any, // TODO
    mode: BooleanOperator
}

interface OTUQuery {
    taxonomy_filters: TaxonomyFilter[],
    contextual_filters: ContextualFilters,
    amplicon_filter: string,
    required_headers?: string[]
}