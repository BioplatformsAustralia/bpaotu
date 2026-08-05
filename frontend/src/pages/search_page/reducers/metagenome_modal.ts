import { partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { type Reducer, type AnyAction} from 'redux'

import { executeMetagenomeSearch } from 'api'
import { handleSimpleAPIResponse } from 'reducers/utils'

import { searchPageInitialState, type SearchPageState } from './types'
import { describeSearch } from './search'

type MetagenomeModalState = SearchPageState['metagenomeModal']

export const {
  openMetagenomeModal,
  closeMetagenomeModal,
  fetchMetagenomeStarted,
  fetchMetagenomeEnded,
} = createActions(
  'OPEN_METAGENOME_MODAL',
  'CLOSE_METAGENOME_MODAL',
  'FETCH_METAGENOME_STARTED',
  'FETCH_METAGENOME_ENDED'
)

export const openMetagenomeModalSearch = () => (dispatch, getState) => {
  const state = getState()
  const filters = describeSearch(state)
  dispatch(fetchMetagenomeStarted())
  handleSimpleAPIResponse(dispatch, partial(executeMetagenomeSearch, filters), fetchMetagenomeEnded)
}

const metagenomeModalReducer: Reducer<MetagenomeModalState, AnyAction> =
  handleActions<MetagenomeModalState, any>(
  {
    [fetchMetagenomeStarted as any]: (state, action) => ({
      ...state,
      isOpen: true,
      sample_ids: [],
      isLoading: true,
    }),

    [fetchMetagenomeEnded as any]: (state, action) => {
      try {
        if (action.error) {
          const response = action.payload.response
          return {
            ...state,
            isLoading: false,
            error: `${response.status}: ${response.statusText}. ${response.data}`,
            sample_ids: [],
          }
        }
        return {
          ...state,
          isLoading: false,
          error: '',
          sample_ids: action.payload.data.sample_ids,
        }
      } catch (e) {
        return {
          ...state,
          isLoading: false,
          error: e.toString(),
          sample_ids: [],
        }
      }
    },

    [openMetagenomeModal as any]: (state, action) => ({
      ...state,
      isOpen: true,
      sample_ids: [action.payload],
      isLoading: false,
      error: '',
    }),

    [closeMetagenomeModal as any]: (state, action) => ({
      ...state,
      isOpen: false,
      isLoading: false,
      sample_ids: [],
      error: '',
    }),
  },
  searchPageInitialState.metagenomeModal
)

export default metagenomeModalReducer
