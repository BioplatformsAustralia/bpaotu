import { partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { executeBlastOtuSearch } from 'api'
import { handleSimpleAPIResponse } from 'reducers/utils'
import { describeSearch } from './search'
import { searchPageInitialState } from './types'

export const {
  openBlastModal,
  closeBlastModal,
  blastSearchModalFetchSamplesStarted,
  blastSearchModalFetchSamplesEnded,
} = createActions(
  'OPEN_BLAST_MODAL',
  'CLOSE_BLAST_MODAL',

  'BLAST_MODAL_FETCH_SAMPLES_STARTED',
  'BLAST_MODAL_FETCH_SAMPLES_ENDED'
)

export const fetchBlastModalSamples = () => (dispatch, getState) => {
  const state = getState()
  const filters = describeSearch(state)

  dispatch(blastSearchModalFetchSamplesStarted())
  handleSimpleAPIResponse(
    dispatch,
    partial(executeBlastOtuSearch, filters),
    blastSearchModalFetchSamplesEnded
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
    [blastSearchModalFetchSamplesStarted as any]: (state, action) => ({
      ...state,
      isLoading: true,
      rowsCount: -1, // to avoid clash with "0"
    }),
    [blastSearchModalFetchSamplesEnded as any]: (state, action: any) => ({
      ...state,
      isLoading: false,
      rowsCount: action.payload.data.rowsCount,
    }),
  },
  searchPageInitialState.blastSearchModal
)
