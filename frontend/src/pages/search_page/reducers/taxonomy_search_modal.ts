import { get as _get } from 'lodash'
import { createActions, handleActions } from 'redux-actions'

import { executeTaxonomySearch } from 'api'

import { searchPageInitialState, ErrorList } from './types'

export const {
  openTaxonomySearchModal,
  closeTaxonomySearchModal,
  handleTaxonomySearchString,
  runTaxonomySearchStarted,
  runTaxonomySearchEnded,
  handleSetSelectIndex,
} = createActions(
  'OPEN_TAXONOMY_SEARCH_MODAL',
  'CLOSE_TAXONOMY_SEARCH_MODAL',
  'HANDLE_TAXONOMY_SEARCH_STRING',
  'RUN_TAXONOMY_SEARCH_STARTED',
  'RUN_TAXONOMY_SEARCH_ENDED',
  'HANDLE_SET_SELECT_INDEX'
)

export const runTaxonomySearch = () => (dispatch, getState) => {
  const state = getState()
  dispatch(runTaxonomySearchStarted())

  const selectedAmplicon = state.searchPage.filters.selectedAmplicon.value
  const searchString = state.searchPage.taxonomySearchModal.searchStringInput

  executeTaxonomySearch(selectedAmplicon, searchString)
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

export default handleActions(
  {
    [openTaxonomySearchModal as any]: (state, action) => ({
      ...state,
      isOpen: true,
      selectIndex: null, // set to null on open rather than close to prevent seeing change as modal closes
    }),
    [closeTaxonomySearchModal as any]: (state, action) => ({
      ...state,
      isOpen: false,
    }),
    [handleTaxonomySearchString as any]: (state, action: any) => {
      return {
        ...state,
        searchStringInput: action.payload,
      }
    },
    [runTaxonomySearchStarted as any]: (state, action: any) => ({
      ...state,
      isLoading: true,
      searchString: null,
      results: [],
    }),
    [runTaxonomySearchEnded as any]: {
      next: (state, action: any) => {
        return {
          ...state,
          isLoading: false,
          searchString: state.searchStringInput,
          results: action.payload.data.results,
          error: action.payload.data.error,
        }
      },
      throw: (state, action: any) => ({
        ...state,
        isLoading: false,
      }),
    },
    [handleSetSelectIndex as any]: (state, action: any) => {
      return {
        ...state,
        selectIndex: action.payload,
      }
    },
  },
  searchPageInitialState.taxonomySearchModal
)
