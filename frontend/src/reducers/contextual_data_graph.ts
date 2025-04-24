import { map, reject, isEmpty, partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { getContextualDataForGraph } from 'api'
import { handleSimpleAPIResponse } from 'reducers/utils'
import { describeSearch } from 'pages/search_page/reducers/search'

const { fetchContextualDataForGraphStarted, fetchContextualDataForGraphEnded } = createActions(
  'FETCH_CONTEXTUAL_DATA_FOR_GRAPH_STARTED',
  'FETCH_CONTEXTUAL_DATA_FOR_GRAPH_ENDED'
)

export const fetchContextualDataForGraph = () => (dispatch, getState) => {
  const state = getState()
  const filters = describeSearch(state)
  const options = {
    ...state.contextualPage.results,
    columns: reject(
      map(state.contextualPage.selectColumns.columns, (c) => c.name),
      (name) => isEmpty(name)
    ),
  }
  dispatch(fetchContextualDataForGraphStarted())
  handleSimpleAPIResponse(
    dispatch,
    partial(getContextualDataForGraph, filters, options),
    fetchContextualDataForGraphEnded
  )
}

const initialState = {
  isLoading: false,
  graphdata: {},
}

export default handleActions(
  {
    [fetchContextualDataForGraphStarted as any]: (state, action) => ({
      ...initialState,
      isLoading: true,
    }),
    [fetchContextualDataForGraphEnded as any]: (state, action: any) => {
      return {
        isLoading: false,
        graphdata: action.payload.data.graphdata,
      }
    },
  },
  initialState
)
