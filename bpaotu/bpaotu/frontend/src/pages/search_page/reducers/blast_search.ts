import { find, get as _get, isEmpty, map, reject, uniq } from 'lodash'
import { createAction, createActions, handleAction, handleActions } from 'redux-actions'

export const HANDLE_BLAST_SEQUENCE = 'HANDLE_BLAST_SEQUENCE'
// export const RUN_BLAST_STARTED = 'RUN_BLAST_STARTED'
// export const RUN_BLAST_ENDED = 'RUN_BLAST_ENDED'

export const handleBlastSequence = createAction(HANDLE_BLAST_SEQUENCE)

const blastInitialState = {
  sequenceValue: '',
  errors: []
}

export default handleActions(
  {
    [handleBlastSequence as any]: (state, action: any) => ({
      ...state,
      sequenceValue: action.payload
    })
  },
  blastInitialState
)
