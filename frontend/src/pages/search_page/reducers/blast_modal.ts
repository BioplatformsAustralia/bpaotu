import { createActions, handleActions } from 'redux-actions'
import { searchPageInitialState } from './types'

export const { openBlastModal, closeBlastModal } = createActions(
  'OPEN_BLAST_MODAL',
  'CLOSE_BLAST_MODAL'
)

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
  },
  searchPageInitialState.blastModal
)
