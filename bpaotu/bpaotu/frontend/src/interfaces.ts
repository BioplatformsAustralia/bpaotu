import { SearchConfig } from './search';

declare global {
  interface Window {
    otu_search_config: SearchConfig,
    CKANAuthToken: string,
    maps: any[],
    loadmapsamples_map: any,
    L: any
  }
}

