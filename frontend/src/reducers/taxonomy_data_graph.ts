import { map, reject, isEmpty, partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { type Reducer, type AnyAction } from 'redux'

import { getTaxonomyDataForGraph } from 'api'
import { handleSimpleAPIResponse } from 'reducers/utils'
import { describeSearch } from 'pages/search_page/reducers/search'

export interface TaxonomyDataForGraphState {
  isLoading: boolean
  graphdata: Record<string, unknown>
}

const { fetchTaxonomyDataForGraphStarted, fetchTaxonomyDataForGraphEnded } = createActions(
  'FETCH_TAXONOMY_DATA_FOR_GRAPH_STARTED',
  'FETCH_TAXONOMY_DATA_FOR_GRAPH_ENDED'
)

export const fetchTaxonomyDataForGraph = () => (dispatch, getState) => {
  const state = getState()
  const filters = describeSearch(state)
  const options = {
    ...state.contextualPage.results,
    columns: reject(
      map(state.contextualPage.selectColumns.columns, (c) => c.name),
      (name) => isEmpty(name)
    ),
  }
  dispatch(fetchTaxonomyDataForGraphStarted())
  handleSimpleAPIResponse(
    dispatch,
    partial(getTaxonomyDataForGraph, filters, options),
    fetchTaxonomyDataForGraphEnded
  )
}

const initialState: TaxonomyDataForGraphState = {
  isLoading: false,
  graphdata: {},
}

const taxonomyDataForGraphReducer: Reducer<
  TaxonomyDataForGraphState,
  AnyAction
> = handleActions<TaxonomyDataForGraphState, any>(
  {
    [fetchTaxonomyDataForGraphStarted as any]: (state, action) => ({
      ...initialState,
      isLoading: true,
    }),
    [fetchTaxonomyDataForGraphEnded as any]: (state, action: any) => {
      return {
        isLoading: false,
        graphdata: action.payload.data.graphdata,
      }
    },
  },
  initialState
)

export default taxonomyDataForGraphReducer
