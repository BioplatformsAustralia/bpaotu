import { createActions, handleActions } from 'redux-actions'

import { EmptyOperatorAndValue } from './types'

export const { selectTrait, selectTraitOperator } = createActions('SELECT_TRAIT', 'SELECT_TRAIT_OPERATOR')

export default handleActions(
  {
    [selectTrait as any]: (state, action: any) => ({
      ...state,
      value: action.payload
    }),
    [selectTraitOperator as any]: (state, action: any) => ({
      ...state,
      operator: action.payload
    })
  },
  EmptyOperatorAndValue
)
