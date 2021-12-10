import { combineReducers } from 'redux'
import ampliconsReducer from './amplicons'
import traitsReducer from './traits'
import taxonomySourcesReducer from './taxonomy_sources'

export default combineReducers({
  amplicons: ampliconsReducer,
  traits: traitsReducer,
  taxonomySources: taxonomySourcesReducer
})
