import { createActions, handleActions } from 'redux-actions'
import { searchPageInitialState } from './types'

export const {
  openSamplesGraphModal,
  closeSamplesGraphModal
} = createActions(
  'OPEN_SAMPLES_Graph_MODAL',
  'CLOSE_SAMPLES_Graph_MODAL'
)

export default handleActions(
  {
    [openSamplesGraphModal as any]: (state, action) => ({
      ...state,
      isOpen: true
    }),
    [closeSamplesGraphModal as any]: (state, action) => ({
      ...state,
      isOpen: false
    })
  },
  searchPageInitialState.samplesGraphModal
)
