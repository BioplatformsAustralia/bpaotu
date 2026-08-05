import { createActions, handleActions } from 'redux-actions'
import { type Reducer, type AnyAction } from 'redux'

import { searchPageInitialState, type SearchPageState } from './types'

type SamplesGraphModalState = SearchPageState['samplesGraphModal']

export const { openSamplesGraphModal, closeSamplesGraphModal } = createActions(
  'OPEN_SAMPLES_Graph_MODAL',
  'CLOSE_SAMPLES_Graph_MODAL',
)

const samplesGraphModalReducer: Reducer<SamplesGraphModalState, AnyAction> = handleActions<
  SamplesGraphModalState,
  any
>(
  {
    [openSamplesGraphModal as any]: (state, action) => ({
      ...state,
      isOpen: true,
    }),
    [closeSamplesGraphModal as any]: (state, action) => ({
      ...state,
      isOpen: false,
    }),
  },
  searchPageInitialState.samplesGraphModal,
)

export default samplesGraphModalReducer
