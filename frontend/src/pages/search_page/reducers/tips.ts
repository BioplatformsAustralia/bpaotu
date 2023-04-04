import { searchPageInitialState } from './types'

import { createActions, handleActions } from 'redux-actions'

export const { showPhinchTipAction, clearTipsAction } = createActions(
  'SHOW_PHINCH_TIP_ACTION',
  'CLEAR_TIPS_ACTION'
)

export const showPhinchTip = () => (dispatch, getState) => {
  dispatch(showPhinchTipAction())
}

export const clearTips = () => (dispatch, getState) => {
  dispatch(clearTipsAction())
}

function alert(text, color = 'primary') {
  return { color, text }
}

const TIP_PHINCH = alert(
  'Tip: Visit <a target="_other" href="http://phinch.org/">phinch.org</a> to visualise your BIOM file.',
  'success'
)

export default handleActions(
  {
    [clearTipsAction as any]: (state, action) => ({
      ...state,
      alerts: [],
    }),
    [showPhinchTipAction as any]: {
      next: (state, action: any) => {
        const alerts = [TIP_PHINCH]
        return {
          alerts,
        }
      },
      throw: (state, action) => ({
        ...state,
        isSubmitting: false,
      }),
    },
  },
  searchPageInitialState.tips
)
