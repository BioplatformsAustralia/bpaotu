import { map, zipObject } from 'lodash'
import { createActions, handleAction, handleActions } from 'redux-actions'

import { getReferenceData } from '../../api'
import { taxonomy_keys } from '../../constants'
import { handleSimpleAPIResponse } from '../utils'

export const { fetchReferenceDataEnded, selectTaxonomySource } = createActions(
  'FETCH_REFERENCE_DATA_ENDED',
  'SELECT_TAXONOMY_SOURCE'
)

export function fetchReferenceData() {
  return (dispatch: any) => {
    handleSimpleAPIResponse(dispatch, getReferenceData, fetchReferenceDataEnded)
  }
}

const initialAmpliconsState = {
  isLoading: true,
  values: [],
  error: false
}

const initialRanksState = {
  rankLabelsLookup: {},
  rankLabels: {}
}

export const ranksReducer = handleActions(
  {
    [fetchReferenceDataEnded as any]: {
      next: (state, action: any) => ({
        ...state,
        rankLabelsLookup: action.payload.data.ranks
      }),
      throw: (state, action: any) => {
        // tslint:disable-next-line:no-console
        console.error('Error while loading rank labels: ', action.payload)
        return {
          ...state,
          rankLabelsLookup: {}
        }
      }
    },

    [selectTaxonomySource as any]: (state, action: any) => {
      const selected_ts = action.payload; // .operator is always "is" for taxonomy source
      const rank_label_list = state.rankLabelsLookup[selected_ts] || []
      return {
        ...state,
        rankLabels: zipObject(taxonomy_keys, ['Taxonomy', ...rank_label_list])
      }
    }
  },
  initialRanksState
);

export const ampliconsReducer = handleAction(
  fetchReferenceDataEnded,
  {
    next: (state, action: any) => ({
      isLoading: false,
      error: false,
      values: map(action.payload.data.amplicons, (option: any) => ({ id: option[0], value: option[1] }))
    }),
    throw: (state, action: any) => {
      // tslint:disable-next-line:no-console
      console.error('Error while loading amplicons: ', action.payload)
      return {
        isLoading: false,
        error: true,
        values: []
      }
    }
  },
  initialAmpliconsState
)
