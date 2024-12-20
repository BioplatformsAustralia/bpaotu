import { filter, get as _get, includes, isNumber, join, last, reject, upperCase } from 'lodash'
import { createActions, handleActions } from 'redux-actions'

import { executeTaxonomySearch } from 'api'
import { changeElementAtIndex, removeElementAtIndex } from 'reducers/utils'

import { describeSearch } from './search'
import { searchPageInitialState, ErrorList } from './types'

import { updateTaxonomyDropDowns } from '../reducers/taxonomy'

export const {
  openTaxonomySearchModal,
  closeTaxonomySearchModal,
  handleTaxonomySearchString,
  runTaxonomySearchStarted,
  runTaxonomySearchEnded,
} = createActions(
  'OPEN_TAXONOMY_SEARCH_MODAL',
  'CLOSE_TAXONOMY_SEARCH_MODAL',
  'HANDLE_TAXONOMY_SEARCH_STRING',
  'RUN_TAXONOMY_SEARCH_STARTED',
  'RUN_TAXONOMY_SEARCH_ENDED'
)

export const runTaxonomySearch = () => (dispatch, getState) => {
  const state = getState()
  dispatch(runTaxonomySearchStarted())

  const filters = describeSearch(state)
  const searchString = state.searchPage.taxonomySearchModal.searchString
  console.log('runTaxonomySearch', 'searchString', searchString)

  executeTaxonomySearch(searchString)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(runTaxonomySearchEnded(new ErrorList(data.data.errors)))
        return
      }
      dispatch(runTaxonomySearchEnded(data))
    })
    .catch((error) => {
      dispatch(runTaxonomySearchEnded(new ErrorList('Unhandled server-side error!')))
    })
}

export const setTaxonomy = (taxonomy) => (dispatch, getState) => {
  const state = getState()

  console.log('setTaxonomy', 'state', state)
  console.log('setTaxonomy', 'taxonomy', taxonomy)
}

export default handleActions(
  {
    [openTaxonomySearchModal as any]: (state, action) => ({
      ...state,
      isOpen: true,
    }),
    [closeTaxonomySearchModal as any]: (state, action) => ({
      ...state,
      isOpen: false,
    }),
    [handleTaxonomySearchString as any]: (state, action: any) => {
      return {
        ...state,
        searchString: action.payload,
      }
    },
    [runTaxonomySearchStarted as any]: (state, action: any) => ({
      ...state,
      isLoading: true,
      results: [],
    }),
    [runTaxonomySearchEnded as any]: {
      next: (state, action: any) => {
        return {
          ...state,
          isLoading: false,
          searchString: state.searchString,
          results: action.payload.data.results,
        }
      },
      throw: (state, action: any) => ({
        ...state,
        isLoading: false,
      }),
    },
  },
  searchPageInitialState.taxonomySearchModal
)
