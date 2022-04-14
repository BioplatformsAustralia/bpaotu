import { createActions, handleActions } from 'redux-actions'
import { searchPageInitialState } from './types'

export const {
  openMetagenomeModal,
  openBulkMetagenomeModal,
  closeMetagenomeModal
} = createActions(
  'OPEN_METAGENOME_MODAL',
  'OPEN_BULK_METAGENOME_MODAL',
  'CLOSE_METAGENOME_MODAL'
)

export default handleActions(
    {
        [openMetagenomeModal as any]: (state, action) => ({
            ...state,
            sample_id: action.payload.row.sample_id
        }),

        [openBulkMetagenomeModal as any]: (state, action) => ({
            ...state,
            sample_id: '*'
        }),

        [closeMetagenomeModal as any]: (state, action) => ({
            ...state,
            sample_id: null
        })
    },
    searchPageInitialState.metagenomeModal
)
