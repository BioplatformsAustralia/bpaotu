import { combineReducers } from 'redux'
import ampliconsReducer from './amplicons'
import traitsReducer from './traits'

export default combineReducers({
  amplicons: ampliconsReducer,
  traits: traitsReducer
})
