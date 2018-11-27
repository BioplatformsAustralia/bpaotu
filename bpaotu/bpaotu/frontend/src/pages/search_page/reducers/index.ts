import { combineReducers } from 'redux'

import selectedAmpliconReducer from './amplicon'
import contextualReducer from './contextual'
import samplesMapModalReducer from './samples_map_modal'
import searchResultsReducer from './search'
import submitToGalaxyReducer from './submit_to_galaxy'
import taxonomyReducer from './taxonomy'
import blastSearchReducer from './blast_search'
const filtersReducer = combineReducers({
  selectedAmplicon: selectedAmpliconReducer,
  taxonomy: taxonomyReducer,
  contextual: contextualReducer
})

const pageReducer = combineReducers({
  filters: filtersReducer,
  samplesMapModal: samplesMapModalReducer,
  galaxy: submitToGalaxyReducer,
  results: searchResultsReducer,
  blastSearch: blastSearchReducer
})

export default pageReducer
