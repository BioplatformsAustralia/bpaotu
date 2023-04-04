import { combineReducers } from 'redux'
import contextualPageReducer from 'pages/contextual_page/reducers'
import searchPageReducer from 'pages/search_page/reducers'
import mapPageReducer from 'pages/map_page/reducers'

import authReducer from 'reducers/auth'
import referenceDataReducer from 'reducers/reference_data'
import contextualDataDefinitionsReducer from 'reducers/contextual_data_definitions'
import contextualDataForGraphReducer from 'reducers/contextual_data_graph'
import taxonomyDataForGraphReducer from 'reducers/taxonomy_data_graph'

const rootReducer = combineReducers({
  referenceData: referenceDataReducer,
  mapPage: mapPageReducer,
  searchPage: searchPageReducer,
  contextualPage: contextualPageReducer,
  contextualDataDefinitions: contextualDataDefinitionsReducer,
  contextualDataForGraph: contextualDataForGraphReducer,
  taxonomyDataForGraph: taxonomyDataForGraphReducer,
  auth: authReducer,
})

export default rootReducer
