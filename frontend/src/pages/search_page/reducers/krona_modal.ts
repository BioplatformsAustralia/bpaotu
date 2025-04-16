import { get as _get, partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'

import { executeKrona } from 'api'
import { handleSimpleAPIResponse } from 'reducers/utils'

import { searchPageInitialState, ErrorList } from './types'
import { describeSearch } from './search'

export const { openKronaModal, closeKronaModal, runKronaStarted, runKronaEnded } = createActions(
  'OPEN_KRONA_MODAL',
  'CLOSE_KRONA_MODAL',
  'RUN_KRONA_STARTED',
  'RUN_KRONA_ENDED'
)

export const runKronaRequest = (sampleId) => (dispatch, getState) => {
  const state = getState()

  dispatch(runKronaStarted())

  const filters = describeSearch(state)

  executeKrona(filters, sampleId)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(runKronaEnded(new ErrorList(...data.data.errors)))
        return
      }
      dispatch(runKronaEnded(data))
    })
    .catch((error) => {
      dispatch(runKronaEnded(error))
    })
}

export default handleActions(
  {
    [runKronaStarted as any]: (state, action) => ({
      ...state,
      isOpen: true,
      isLoading: true,
    }),
    [runKronaEnded as any]: (state, action) => {
      try {
        if (action.error) {
          const response = action.payload.response
          return {
            ...state,
            isLoading: false,
            error: `${response.statusText}. ${response.data.error}`,
            html: '',
          }
        }
        return {
          ...state,
          isLoading: false,
          error: '',
          html: action.payload.data.html,
        }
      } catch (e) {
        return {
          ...state,
          isLoading: false,
          error: e.toString(),
          html: '',
        }
      }
    },
    [openKronaModal as any]: (state, action) => ({
      ...state,
      isOpen: true,
      sample_id: action.payload,
      isLoading: false,
      error: '',
    }),
    [closeKronaModal as any]: (state, action) => ({
      ...state,
      isOpen: false,
      isLoading: false,
      sample_id: '',
      error: '',
    }),
  },
  searchPageInitialState.kronaModal
)
