import { combineReducers } from 'redux'

import magsResultsReducer from './mags'
import magsSamplesReducer from './samples'

const pageReducer = combineReducers({
  results: magsResultsReducer,
  samples: magsSamplesReducer,
})

export default pageReducer
