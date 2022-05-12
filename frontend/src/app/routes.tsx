import * as React from 'react'
import { Route, Switch } from 'react-router-dom'

import NonDenoisedPage from '../pages/non_denoised_page'
import ContextualPage from '../pages/contextual_page'
import { SampleSearchPage } from '../pages/search_page'

export default _ => (
  <div>
    <Switch>
      <Route exact={true} path="/" component={SampleSearchPage} />
      <Route path="/contextual" component={ContextualPage} />
      <Route path="/non-denoised" component={NonDenoisedPage} />
    </Switch>
  </div>
)
