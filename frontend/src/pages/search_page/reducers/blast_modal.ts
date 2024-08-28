import { partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { executeBlastOtuSearch } from 'api'
import { handleSimpleAPIResponse } from 'reducers/utils'
import { describeSearch } from './search'
import { searchPageInitialState } from './types'

export const {
  openBlastModal,
  closeBlastModal,
  blastModalFetchSamplesStarted,
  blastModalFetchSamplesEnded,
} = createActions(
  'OPEN_BLAST_MODAL',
  'CLOSE_BLAST_MODAL',

  'BLAST_MODAL_FETCH_SAMPLES_STARTED',
  'BLAST_MODAL_FETCH_SAMPLES_ENDED'
)

export const fetchBlastModalSamples = () => (dispatch, getState) => {
  const state = getState()
  const filters = describeSearch(state)

  dispatch(blastModalFetchSamplesStarted())
  handleSimpleAPIResponse(
    dispatch,
    partial(executeBlastOtuSearch, filters),
    blastModalFetchSamplesEnded
  )
}

export default handleActions(
  {
    [openBlastModal as any]: (state, action) => ({
      ...state,
      isOpen: true,
    }),
    [closeBlastModal as any]: (state, action) => ({
      ...state,
      isOpen: false,
    }),
    [blastModalFetchSamplesStarted as any]: (state, action) => ({
      ...state,
      isLoading: true,
      rowsCount: -1, // to avoid clash with "0"
    }),
    [blastModalFetchSamplesEnded as any]: (state, action: any) => ({
      ...state,
      isLoading: false,
      rowsCount: action.payload.data.rowsCount,
    }),
  },
  searchPageInitialState.blastModal
)
