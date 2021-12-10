import { map } from 'lodash'
import { createActions, handleAction } from 'redux-actions'
import { getTaxonomySources } from '../../api'
import { selectTaxonomySource } from '../../pages/search_page/reducers/taxonomy_source'

export const { fetchTaxonomySourcesStarted, fetchTaxonomySourcesEnded } = createActions(
  'FETCH_TAXONOMY_SOURCES_STARTED',
  'FETCH_TAXONOMY_SOURCES_ENDED'
)

export const fetchTaxonomySources = (dispatch: any, getState) => {
  return (dispatch: any, getState) => {
    dispatch(selectTaxonomySource(''))
    dispatch(fetchTaxonomySourcesStarted())
    return getTaxonomySources()
      .then(data => {
        dispatch(fetchTaxonomySourcesEnded(data))
      })
      .catch(err => {
        dispatch(fetchTaxonomySourcesEnded(err))
      })
  }
}

const initialState = {
  isLoading: true,
  values: [],
  error: false
}

export default handleAction(
  fetchTaxonomySourcesEnded,
  {
    next: (state, action: any) => ({
      isLoading: false,
      error: false,
      values: map(action.payload.data.possibilities, (option: any) => ({ id: option[0], value: option[1] }))
    }),
    throw: (state, action: any) => {
      // tslint:disable-next-line:no-console
      console.error('Error while loading taxonomy sources: ', action.payload)
      return {
        isLoading: false,
        error: true,
        values: []
      }
    }
  },
  initialState
)
