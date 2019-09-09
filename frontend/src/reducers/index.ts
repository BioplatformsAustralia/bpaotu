import { combineReducers } from 'redux'
import contextualPageReducer from '../pages/contextual_page/reducers'
import mapPageReducer from '../pages/map_page/reducers'
import searchPageReducer from '../pages/search_page/reducers'
import authReducer from './auth'
import referenceDataReducer from './reference_data'
import contextualDataDefinitionsReducer from './contextual_data_definitions'

const rootReducer = combineReducers({
  referenceData: referenceDataReducer,
  mapPage: mapPageReducer,
  searchPage: searchPageReducer,
  contextualPage: contextualPageReducer,
  contextualDataDefinitions: contextualDataDefinitionsReducer,
  auth: authReducer
})

export default rootReducer
