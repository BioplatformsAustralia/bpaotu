import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as search from './search';

// TODO revise if we should switch to multiple entry points instead.
// ie. one entrypoint for each page
export { init as init_tables } from './table_page';
export { init as init_search } from './search_page';

declare global {
    interface Window {
      otu_search_config: search.SearchConfig,
      CKANAuthToken: string,
      maps: any[],
      loadmapsamples_map: any,
      L: any
    }
};