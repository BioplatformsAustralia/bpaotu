import {partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { searchPageInitialState } from './types'
import { executeMetagenomeSearch } from '../../../api'
import { handleSimpleAPIResponse } from '../../../reducers/utils'

export const {
  openBulkMetagenomeModal,
  closeMetagenomeModal,
  fetchMetagenomeStarted,
  fetchMetagenomeEnded,
} = createActions(
    'OPEN_BULK_METAGENOME_MODAL',
    'CLOSE_METAGENOME_MODAL',
    'FETCH_METAGENOME_STARTED',
    'FETCH_METAGENOME_ENDED'
)

export const openMetagenomeModal = (sample_id) => (dispatch, getState) => {
    dispatch(fetchMetagenomeStarted(sample_id))
    handleSimpleAPIResponse(dispatch, partial(executeMetagenomeSearch, sample_id), fetchMetagenomeEnded)
  }

export default handleActions(
    {
        [fetchMetagenomeStarted as any]: (state, action) => ({
            ...state,
            isOpen: true,
            isLoading: true,
            metagenome_data: [],
            sample_id: action.payload
        }),

        [fetchMetagenomeEnded as any]: (state, action) => {
            if (action.error) {
                const response = action.payload.response
                return {
                    ...state,
                    isLoading: false,
                    error: `${response.status}: ${response.statusText}. ${response.data}`,
                    metagenome_data: {}
                }
            }
            return {
                     ...state,
                     isLoading: false,
                     error: "",
                     metagenome_data: action.payload.data
                 }

        },


        [openBulkMetagenomeModal as any]: (state, action) => ({
            ...state,
            isOpen: true,
            sample_id: '*'
        }),

        [closeMetagenomeModal as any]: (state, action) => ({
            ...state,
            isOpen: false,
            sample_id: null
        })
    },
    searchPageInitialState.metagenomeModal
)
