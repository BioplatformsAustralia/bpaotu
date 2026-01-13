import { combineReducers } from 'redux'

import magsResultsReducer from './mags'
// samples

const pageReducer = combineReducers({
  results: magsResultsReducer,
  // samples:
})

export default pageReducer
