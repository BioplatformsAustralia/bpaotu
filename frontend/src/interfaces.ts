import { SearchConfig } from 'search'

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any
    base_url: string
    otu_search_config: SearchConfig
  }
}
