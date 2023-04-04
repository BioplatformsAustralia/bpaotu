import { find, get as _get, isEmpty, map, reject, uniq } from 'lodash'
import { createActions, handleActions, createAction } from 'redux-actions'

import analytics from 'app/analytics'
import { executeSearch } from '../../../api'
import { getAmpliconFilter, isMetagenomeSearch } from '../reducers/amplicon'
import { submitToGalaxyEnded, submitToGalaxyStarted } from './submit_to_galaxy'
import { ErrorList, searchPageInitialState, EmptyOperatorAndValue } from './types'
import { taxonomy_keys } from '../../../constants'

export const { changeTableProperties, searchStarted, searchEnded } = createActions(
  'CHANGE_TABLE_PROPERTIES',
  'SEARCH_STARTED',
  'SEARCH_ENDED'
)
export const clearSearchResults = createAction('CLEAR_SEARCH_RESULTS')

function marshallContextualFilters(filtersState, dataDefinitions) {
  const filterDataDefinition = (name) => find(dataDefinitions.filters, (dd) => dd.name === name)
  const filters = map(
    reject(filtersState, (filter) => filter.name === ''),
    (filter) => {
      const dataDefinition = filterDataDefinition(filter.name)

      const values: any = {}
      switch (dataDefinition.type) {
        case 'string':
          values.contains = filter.value
          break
        case 'float':
        case 'date':
          values.from = filter.value
          values.to = filter.value2
          break
        case 'ontology':
          values.is = filter.value
          break
        case 'sample_id':
          values.is = filter.values
          break
      }
      return {
        field: filter.name,
        operator: filter.operator,
        ...values,
      }
    }
  )

  return filters
}

function marshallContextual(state, contextualDataDefinitions) {
  const { selectedEnvironment, filtersMode } = state

  return {
    environment: selectedEnvironment.value === '' ? null : selectedEnvironment,
    mode: filtersMode,
    filters: marshallContextualFilters(state.filters, contextualDataDefinitions),
  }
}

export const describeSearch = (state) => {
  const stateFilters = state.searchPage.filters
  const contextualDataDefinitions = state.contextualDataDefinitions
  const selectedAmplicon = getAmpliconFilter(state)
  const haveAmplicon = selectedAmplicon.value !== ''
  const selectedTrait = haveAmplicon ? stateFilters.selectedTrait : EmptyOperatorAndValue
  const selectedTaxonomies = map(taxonomy_keys, (taxonomy) =>
    haveAmplicon ? stateFilters.taxonomy[taxonomy].selected : EmptyOperatorAndValue
  )

  return {
    amplicon_filter: selectedAmplicon,
    trait_filter: selectedTrait,
    taxonomy_filters: selectedTaxonomies,
    contextual_filters: marshallContextual(stateFilters.contextual, contextualDataDefinitions),
    sample_integrity_warnings_filter: marshallContextual(
      stateFilters.sampleIntegrityWarning,
      contextualDataDefinitions
    ),
    metagenome_only: isMetagenomeSearch(state),
  }
}

export const search = () => (dispatch, getState) => {
  const state = getState()

  dispatch(searchStarted())

  const filters = describeSearch(state)

  const contextualColumns = reject(
    map(filters.contextual_filters.filters, (f) => f.field),
    (name) => isEmpty(name)
  )
  const sampleIntegrityWarningsColumns = reject(
    map(filters.sample_integrity_warnings_filter.filters, (f) => f.field),
    (name) => isEmpty(name)
  )

  const options = {
    ...state.searchPage.results,
    columns: uniq([...contextualColumns, ...sampleIntegrityWarningsColumns]),
  }

  // only send event once per search
  // (i.e. only after clicking 'Sample search', not when using pagination controls)
  if (options.cleared) {
    const params = { columns: options.columns.sort() }

    if (isMetagenomeSearch(state)) {
      analytics.track('otu_sample_search_metagenome', params)
    } else {
      analytics.track('otu_sample_search', params)
    }
  }

  executeSearch(filters, options)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(searchEnded(new ErrorList(...data.data.errors)))
        return
      }
      dispatch(searchEnded(data))
    })
    .catch((error) => {
      dispatch(searchEnded(new ErrorList('Unhandled server-side error!')))
    })
}

export default handleActions(
  {
    [changeTableProperties as any]: (state, action: any) => {
      const { page, pageSize, sorted } = action.payload
      return {
        ...state,
        page,
        pageSize,
        sorted,
      }
    },

    [clearSearchResults as any]: (state, action: any) => ({
      ...state,
      ...searchPageInitialState.results,
    }),

    [searchStarted as any]: (state, action: any) => ({
      ...state,
      errors: [],
      isLoading: true,
      cleared: false,
    }),
    [searchEnded as any]: {
      next: (state, action: any) => {
        const rowsCount = action.payload.data.rowsCount
        const pages = Math.ceil(rowsCount / state.pageSize)
        const newPage = Math.min(pages - 1 < 0 ? 0 : pages - 1, state.page)
        return {
          ...state,
          isLoading: false,
          data: action.payload.data.data,
          rowsCount,
          pages,
          page: newPage,
        }
      },
      throw: (state, action: any) => ({
        ...state,
        isLoading: false,
        errors: action.payload.msgs,
      }),
    },
    [submitToGalaxyStarted as any]: (state, action) => ({
      ...state,
      errors: [],
    }),
    [submitToGalaxyEnded as any]: {
      next: (state, action: any) => state,
      throw: (state, action: any) => ({
        ...state,
        errors: action.payload.msgs,
      }),
    },
  },
  searchPageInitialState.results
)
