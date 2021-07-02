import { map, reject, isEmpty, partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { getTaxonomyDataForGraph } from '../api'
import { handleSimpleAPIResponse } from './utils'
import { describeSearch } from '../pages/search_page/reducers/search'

const { fetchTaxonomyDataForGraphStarted, fetchTaxonomyDataForGraphEnded } = createActions(
  'FETCH_TAXONOMY_DATA_FOR_GRAPH_STARTED',
  'FETCH_TAXONOMY_DATA_FOR_GRAPH_ENDED'
)

export const fetchTaxonomyDataForGraph = () => (dispatch, getState) => {
  const state = getState();
  const filters = describeSearch(state.searchPage.filters, state.contextualDataDefinitions)
  const options = {
    ...state.contextualPage.results,
    columns: reject(map(state.contextualPage.selectColumns.columns, c => c.name), name => isEmpty(name))
  }
  dispatch(fetchTaxonomyDataForGraphStarted())
  handleSimpleAPIResponse(dispatch, partial(getTaxonomyDataForGraph, filters, options), fetchTaxonomyDataForGraphEnded)
}

const initialState = {
  isLoading: false,
  // environment: [],
  // filters: [],
  graphdata: {},
}

export default handleActions(
  {
    [fetchTaxonomyDataForGraphStarted as any]: (state, action) => ({
      ...initialState,
      isLoading: true
    }),
    [fetchTaxonomyDataForGraphEnded as any]: (state, action: any) => {
      // const isSampleID = definition => definition.type === 'sample_id'
      // console.log("isSampleID", isSampleID)
      // const isEnvironment = definition => definition.name === 'am_environment_id'
      // console.log("isEnvironment", isEnvironment)
      // const environment = find(action.payload.data.graphdata, isEnvironment)
      // const sample_id = find(action.payload.data.graphdata, isSampleID)
      // const allButEnvironment = reject(action.payload.data.graphdata, isEnvironment)
      return {
        isLoading: false,
        // environment: map(environment.values, ([id, name]) => ({ id, name })),
        // filters: allButEnvironment,
        // values: action.payload.data.graphdata,
        // sample_ids: sample_id.values,
        graphdata: action.payload.data.graphdata,
      }
    }
  },
  initialState
)
