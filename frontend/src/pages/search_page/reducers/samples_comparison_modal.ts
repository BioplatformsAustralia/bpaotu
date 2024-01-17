import { createActions, handleActions } from 'redux-actions'
import { searchPageInitialState } from './types'

export const { openSamplesComparisonModal, closeSamplesComparisonModal } = createActions(
  'OPEN_SAMPLES_Comparison_MODAL',
  'CLOSE_SAMPLES_Comparison_MODAL'
)

export default handleActions(
  {
    [openSamplesComparisonModal as any]: (state, action) => ({
      ...state,
      isOpen: true,
    }),
    [closeSamplesComparisonModal as any]: (state, action) => ({
      ...state,
      isOpen: false,
    }),
  },
  searchPageInitialState.samplesComparisonModal
)
