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
  handleClear,
  markTaxonomySearchAttempted,
} = createActions(
  'OPEN_TAXONOMY_SEARCH_MODAL',
  'CLOSE_TAXONOMY_SEARCH_MODAL',
  'HANDLE_TAXONOMY_SEARCH_STRING',
  'RUN_TAXONOMY_SEARCH_STARTED',
  'RUN_TAXONOMY_SEARCH_ENDED',
  'HANDLE_SET_SELECT_INDEX',
  'HANDLE_CLEAR',
  'MARK_TAXONOMY_SEARCH_ATTEMPTED'
)

const MIN_SEARCH_LENGTH = 4

const validateSearchString = (raw: string) => {
  const trimmed = raw.trim()

  if (!trimmed) {
    return { isValid: false, error: null }
  }

  if (trimmed.length < MIN_SEARCH_LENGTH) {
    return {
      isValid: false,
      error: `Please enter at least ${MIN_SEARCH_LENGTH} characters`,
    }
  }

  return { isValid: true, error: null }
}

export const runTaxonomySearch = () => (dispatch, getState) => {
  dispatch(markTaxonomySearchAttempted())

  const state = getState()
  const { searchStringInput, isSearchValid } = state.searchPage.taxonomySearchModal

  if (!isSearchValid) return

  dispatch(runTaxonomySearchStarted())

  const selectedAmplicon = state.searchPage.filters.selectedAmplicon.value
  const searchString = searchStringInput.trim()

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
      hasAttemptedSearch: false, // reset attempted/validation state
      searchValidationError: null,
    }),
    [closeTaxonomySearchModal as any]: (state, action) => ({
      ...state,
      isOpen: false,
    }),
    [handleTaxonomySearchString as any]: (state, action: any) => {
      const { isValid, error } = validateSearchString(action.payload)

      return {
        ...state,
        searchStringInput: action.payload,
        isSearchValid: isValid,
        searchValidationError: error,
      }
    },
    [runTaxonomySearchStarted as any]: (state, action: any) => ({
      ...state,
      isLoading: true,
      searchString: null,
      error: null,
    }),
    [runTaxonomySearchEnded as any]: {
      next: (state, action: any) => {
        const trimmed = (state.searchStringInput || '').trim()

        return {
          ...state,
          isLoading: false,
          searchString: trimmed,
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
    [handleClear as any]: (state, action: any) => {
      return {
        ...searchPageInitialState.taxonomySearchModal,
        isOpen: true,
      }
    },
    [markTaxonomySearchAttempted as any]: (state) => ({
      ...state,
      hasAttemptedSearch: true,
    }),
  },
  searchPageInitialState.taxonomySearchModal
)
