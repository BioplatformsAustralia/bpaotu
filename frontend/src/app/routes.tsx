import * as React from 'react'
import { Routes, Route } from 'react-router-dom'

import ContextualPage from 'pages/contextual_page'
import MapPage from 'pages/map_page'
import MagsPage from 'pages/mags_page'
import { SampleMagsPage, InspectMagPage, MagDownloadErrorPage } from 'pages/mags_page/pages'
import { SampleSearchPage, MetagenomeSearchPage } from 'pages/search_page'
import PrivacyPolicy from 'pages/privacy_policy_page'

export default (_) => (
  <div>
    <Routes>
      <Route path="/" element={<SampleSearchPage />} />
      <Route path="/metagenome" element={<MetagenomeSearchPage />} />
      <Route path="/contextual" element={<ContextualPage />} />
      <Route path="/mags" element={<MagsPage />} />
      <Route path="/mags/sample/:sample_id" element={<SampleMagsPage />} />
      <Route path="/mags/mag/:mag_id" element={<InspectMagPage />} />
      <Route path="/mags/download_error" element={<MagDownloadErrorPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    </Routes>
  </div>
)
