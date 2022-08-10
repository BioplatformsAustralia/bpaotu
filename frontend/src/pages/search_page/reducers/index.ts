import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'

import { metagenomeAmpliconReducer, selectedAmpliconReducer } from './amplicon'
import selectedTraitReducer from './trait'
import blastSearchReducer from './blast_search'
import contextualReducer from './contextual'
import samplesMapModalReducer from './samples_map_modal'
import samplesGraphModalReducer from './samples_graph_modal'
import metagenomeModalReducer from './metagenome_modal'
import searchResultsReducer from './search'
import submitToGalaxyReducer from './submit_to_galaxy'
import taxonomyReducer,  {taxonomyOptionsLoading}    from './taxonomy'
import tipsReducer from './tips'

const taxonomyLoadingReducer = handleActions(
  { [taxonomyOptionsLoading as any]: (state, action: any) => {
    return (action.payload)
  }}, false)

const filtersReducer = combineReducers({
  metagenomeAmplicon: metagenomeAmpliconReducer,
  selectedAmplicon: selectedAmpliconReducer,
  selectedTrait: selectedTraitReducer,
  taxonomyLoading: taxonomyLoadingReducer,
  taxonomy: taxonomyReducer,
  contextual: contextualReducer
})

const pageReducer = combineReducers({
  filters: filtersReducer,
  samplesMapModal: samplesMapModalReducer,
  samplesGraphModal: samplesGraphModalReducer,
  metagenomeModal: metagenomeModalReducer,
  galaxy: submitToGalaxyReducer,
  tips: tipsReducer,
  results: searchResultsReducer,
  blastSearch: blastSearchReducer
})

export default pageReducer
