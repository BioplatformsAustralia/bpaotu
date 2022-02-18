import { combineReducers } from 'redux'
import { ampliconsReducer, ranksReducer } from './reference_data'
import traitsReducer from './traits'

export default combineReducers({
  amplicons: ampliconsReducer,
  ranks: ranksReducer,
  traits: traitsReducer
})
