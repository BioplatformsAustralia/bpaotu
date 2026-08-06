import { createActions, handleActions } from 'redux-actions'
import { type Reducer, type AnyAction } from 'redux'

import { EmptyOperatorAndValue } from './types'
import { OperatorAndValue } from 'search'

type SelectedTraitState = OperatorAndValue

export const { selectTrait, selectTraitOperator } = createActions(
  'SELECT_TRAIT',
  'SELECT_TRAIT_OPERATOR',
)

const selectedTraitReducer: Reducer<SelectedTraitState, AnyAction> = handleActions<
  SelectedTraitState,
  any
>(
  {
    [selectTrait as any]: (state, action: any) => ({
      ...state,
      value: action.payload,
    }),
    [selectTraitOperator as any]: (state, action: any) => ({
      ...state,
      operator: action.payload,
    }),
  },
  EmptyOperatorAndValue,
)

export default selectedTraitReducer
