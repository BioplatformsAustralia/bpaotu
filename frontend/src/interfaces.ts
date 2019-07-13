import { SearchConfig } from './search'

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any
    config_url: string
    otu_search_config: SearchConfig
  }
}
