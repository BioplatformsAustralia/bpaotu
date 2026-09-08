import { compose } from 'redux'
import type { SearchConfig } from 'search'

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose
    base_url: string
    otu_search_config: SearchConfig
  }
}

export {}
