import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'

import { metagenomeModeReducer, selectedAmpliconReducer } from './amplicon'
import selectedTraitReducer from './trait'
import blastSearchReducer from './blast_search'
import contextualReducer from './contextual'
import sampleIntegrityWarningReducer from './sample_integrity_warning'
import sampleIdsReducer from './sample_ids'
import samplesMapModalReducer from './samples_map_modal'
import samplesGraphModalReducer from './samples_graph_modal'
import metagenomeModalReducer from './metagenome_modal'
import searchResultsReducer from './search'
import submitToGalaxyReducer from './submit_to_galaxy'
import taxonomyReducer, { taxonomyOptionsLoading } from './taxonomy'
import tipsReducer from './tips'

const taxonomyLoadingReducer = handleActions(
  {
    [taxonomyOptionsLoading as any]: (state, action: any) => {
      return action.payload
    },
  },
  false
)

const filtersReducer = combineReducers({
  metagenomeMode: metagenomeModeReducer,
  selectedAmplicon: selectedAmpliconReducer,
  selectedTrait: selectedTraitReducer,
  taxonomyLoading: taxonomyLoadingReducer,
  taxonomy: taxonomyReducer,
  contextual: contextualReducer,
  sampleIntegrityWarning: sampleIntegrityWarningReducer,
  sampleIds: sampleIdsReducer,
})

const pageReducer = combineReducers({
  filters: filtersReducer,
  samplesMapModal: samplesMapModalReducer,
  samplesGraphModal: samplesGraphModalReducer,
  metagenomeModal: metagenomeModalReducer,
  galaxy: submitToGalaxyReducer,
  tips: tipsReducer,
  results: searchResultsReducer,
  blastSearch: blastSearchReducer,
})

export default pageReducer
