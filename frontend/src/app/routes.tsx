import * as React from 'react'
import { Route, Switch } from 'react-router-dom'

import ContextualPage from 'pages/contextual_page'
import MapPage from 'pages/map_page'
import MagsPage from 'pages/mags_page'
import { SampleMagsPage, InspectMagPage, MagDownloadErrorPage } from 'pages/mags_page/pages'
import { SampleSearchPage, MetagenomeSearchPage } from 'pages/search_page'
import PrivacyPolicy from 'pages/privacy_policy_page'

export default (_) => (
  <div>
    <Switch>
      <Route path="/" component={SampleSearchPage} exact={true} />
      <Route path="/metagenome" component={MetagenomeSearchPage} />
      <Route path="/contextual" component={ContextualPage} />
      <Route path="/mags" component={MagsPage} exact={true} />
      <Route path="/mags/sample/:sample_id" component={SampleMagsPage} />
      <Route path="/mags/mag/:mag_id" component={InspectMagPage} />
      <Route path="/mags/download_error" component={MagDownloadErrorPage} />
      <Route path="/map" component={MapPage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
    </Switch>
  </div>
)
