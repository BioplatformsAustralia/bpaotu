import { find, isNull, filter, negate, toNumber } from 'lodash'
import reduceReducers from 'reduce-reducers'
import { combineActions, createActions, handleAction, handleActions } from 'redux-actions'

import { changeElementAtIndex, removeElementAtIndex } from 'reducers/utils'
import { searchPageInitialState } from './types'

export const { changeSampleIdsFilterOperator, changeSampleIdsFilterValues } = createActions({
  CHANGE_SAMPLE_IDS_FILTER_OPERATOR: (index, operator) => ({ index, operator }),
  CHANGE_SAMPLE_IDS_FILTER_VALUES: (index, values) => ({ index, values }),
})

const sampleIdsFiltersReducer = handleActions(
  {
    [changeSampleIdsFilterOperator as any]: (state: any, action: any) => {
      return {
        ...state,
        idOperator: action.payload.index,
      }
    },
    [changeSampleIdsFilterValues as any]: (state: any, action: any) => {
      return {
        ...state,
        idValues: action.payload.index,
      }
    },
  },
  searchPageInitialState.filters.sampleIds
)

const sampleIdsReducer = sampleIdsFiltersReducer

export default sampleIdsReducer
