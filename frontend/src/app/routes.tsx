import * as React from 'react'
import { Route, Routes } from 'react-router-dom'

import ContextualPage from 'pages/contextual_page'
import MapPage from 'pages/map_page'
import { SampleSearchPage, MetagenomeSearchPage } from 'pages/search_page'
import PrivacyPolicy from 'pages/privacy_policy_page'

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<SampleSearchPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/contextual" element={<ContextualPage />} />
      <Route path="/metagenome" element={<MetagenomeSearchPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    </Routes>
  )
}

export default AppRoutes
