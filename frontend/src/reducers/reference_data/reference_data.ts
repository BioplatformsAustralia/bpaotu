import { map, zipObject } from 'lodash'
import { createActions, handleAction, handleActions } from 'redux-actions'
import { type Reducer, type AnyAction } from 'redux'

import { getReferenceData } from 'api'
import { taxonomy_keys } from 'app/constants'
import { handleSimpleAPIResponse } from 'reducers/utils'
import { referenceDataInitialState, ReferenceDataState } from './types'

type RanksState = ReferenceDataState['ranks']
type AmpliconsState = ReferenceDataState['amplicons']

export const { fetchReferenceDataEnded, selectTaxonomySource } = createActions(
  'FETCH_REFERENCE_DATA_ENDED',
  'SELECT_TAXONOMY_SOURCE',
)

export function fetchReferenceData() {
  return (dispatch: any) => {
    handleSimpleAPIResponse(dispatch, getReferenceData, fetchReferenceDataEnded)
  }
}

export const ranksReducer: Reducer<RanksState, AnyAction> = handleActions<RanksState, any>(
  {
    [fetchReferenceDataEnded as any]: {
      next: (state, action: any) => ({
        ...state,
        rankLabelsLookup: action.payload.data.ranks,
      }),
      throw: (state, action: any) => {
        // tslint:disable-next-line:no-console
        console.error('Error while loading rank labels: ', action.payload)
        return {
          ...state,
          rankLabelsLookup: {},
        }
      },
    },

    [selectTaxonomySource as any]: (state, action: any) => {
      const selected_ts = action.payload // .operator is always "is" for taxonomy source
      const rank_label_list = state.rankLabelsLookup[selected_ts] || []
      return {
        ...state,
        rankLabels: zipObject(taxonomy_keys, ['Taxonomy', ...rank_label_list]),
      }
    },
  },
  referenceDataInitialState.ranks,
)

export const ampliconsReducer: Reducer<AmpliconsState, AnyAction> = handleAction<
  AmpliconsState,
  any
>(
  fetchReferenceDataEnded,
  {
    next: (state, action: any) => ({
      isLoading: false,
      error: false,
      values: map(action.payload.data.amplicons, (option: any) => ({
        id: option[0],
        value: option[1],
      })),
    }),
    throw: (state, action: any) => {
      // tslint:disable-next-line:no-console
      console.error('Error while loading amplicons: ', action.payload)
      return {
        isLoading: false,
        error: true,
        values: [],
      }
    },
  },
  referenceDataInitialState.amplicons,
)
