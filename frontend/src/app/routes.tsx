import * as React from 'react'
import { Route, Switch } from 'react-router-dom'

import NonDenoisedPage from '../pages/non_denoised_page'
import ContextualPage from '../pages/contextual_page'
import MapPage from '../pages/map_page'
import { SampleSearchPage, MetaGenomeSearchPage} from '../pages/search_page'

export default _ => (
  <div>
    <Switch>
      <Route exact={true} path="/" component={SampleSearchPage} />
      <Route path="/map" component={MapPage} />
      <Route path="/contextual" component={ContextualPage} />
      <Route path="/metagenome" component={MetaGenomeSearchPage} />
      <Route path="/non-denoised" component={NonDenoisedPage} />
    </Switch>
  </div>
)
