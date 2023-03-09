import { find, isNull, filter, negate, toNumber } from 'lodash'
import reduceReducers from 'reduce-reducers'

import { combineActions, createActions, handleAction, handleActions } from 'redux-actions'

import { changeElementAtIndex, removeElementAtIndex } from '../../../reducers/utils'
import { searchPageInitialState } from './types'

export const { selectEnvironment, selectEnvironmentOperator, selectSampleIntegrityWarningFiltersMode } = createActions(
  'SELECT_ENVIRONMENT',
  'SELECT_ENVIRONMENT_OPERATOR',
  'SELECT_SAMPLE_INTEGRITY_WARNING_FILTERS_MODE'
)

const selectedEnvironmentReducer = handleActions(
  {
    [selectEnvironment as any]: (state, action: any) => ({
      ...state,
      value: action.payload
    }),
    [selectEnvironmentOperator as any]: (state, action: any) => ({
      ...state,
      operator: action.payload
    })
  },
  searchPageInitialState.filters.sampleIntegrityWarning.selectedEnvironment
)

// unclear as to why selectSampleIntegrityWarningsMode does not work here
// when selectContextualFiltersMode works in contextual.ts
const sampleIntegrityWarningFiltersModeReducer = handleAction(
  selectSampleIntegrityWarningFiltersMode,
  (state, action: any) => action.payload,
  searchPageInitialState.filters.sampleIntegrityWarning.filtersMode
)

const EmptySampleIntegrityWarningFilter = {
  name: '',
  operator: '',
  value: '',
  value2: '',
  values: []
}

const SampleIntegrityWarningsSampleIntegrityWarning = {
  name: 'sample_integrity_warnings_id',
  operator: 'is',
  value: '0',
  value2: '',
  values: []
}
export const {
  selectSampleIntegrityWarningFilter,
  changeSampleIntegrityWarningFilterOperator,
  changeSampleIntegrityWarningFilterValue,
  changeSampleIntegrityWarningFilterValue2,
  changeSampleIntegrityWarningFilterValues,

  checkSampleIntegrityWarningFilter,
  uncheckSampleIntegrityWarningFilter,
  addSampleIntegrityWarningFilter,
  removeSampleIntegrityWarningFilter,
  clearSampleIntegrityWarningFilters
} = createActions(
  {
    SELECT_SAMPLE_INTEGRITY_WARNING_FILTER: (index, value) => ({ index, value }),
    CHANGE_SAMPLE_INTEGRITY_WARNING_FILTER_OPERATOR: (index, operator) => ({ index, operator }),
    CHANGE_SAMPLE_INTEGRITY_WARNING_FILTER_VALUE: (index, value) => ({ index, value }),
    CHANGE_SAMPLE_INTEGRITY_WARNING_FILTER_VALUE2: (index, value) => ({ index, value }),
    CHANGE_SAMPLE_INTEGRITY_WARNING_FILTER_VALUES: (index, values) => ({ index, values })
  },
  'CHECK_SAMPLE_INTEGRITY_WARNING_FILTER',
  'UNCHECK_SAMPLE_INTEGRITY_WARNING_FILTER',
  'ADD_SAMPLE_INTEGRITY_WARNING_FILTER',
  'REMOVE_SAMPLE_INTEGRITY_WARNING_FILTER',
  'CLEAR_SAMPLE_INTEGRITY_WARNING_FILTERS'
)

export const doesFilterMatchEnvironment = environment => filter => {
  if (environment.value === '') {
    return true
  }
  const eq = fltr => fltr.environment === toNumber(environment.value)
  const op = environment.operator === 'is' ? eq : negate(eq)
  return isNull(filter.environment) || op(filter)
}

const sampleIntegrityWarningFiltersReducer = handleActions(
  {
    [checkSampleIntegrityWarningFilter as any]: (state: any, action) => ({
      ...state,
      filters: [...state.filters, SampleIntegrityWarningsSampleIntegrityWarning]
    }),
    [uncheckSampleIntegrityWarningFilter as any]: (state: any, action) => ({
      ...state,
      filters: []
    }),
    [addSampleIntegrityWarningFilter as any]: (state: any, action) => ({
      ...state,
      filters: [...state.filters, EmptySampleIntegrityWarningFilter]
    }),
    [removeSampleIntegrityWarningFilter as any]: (state: any, action) => ({
      ...state,
      filters: removeElementAtIndex(state.filters, action.payload)
    }),
    [clearSampleIntegrityWarningFilters as any]: (state: any, action) => ({
      ...state,
      filters: []
    }),
    [combineActions(selectEnvironment, selectEnvironmentOperator) as any]: (state, action) => ({
      ...state,
      filters: filter(state.filters, f => {
        if (f.name === '') {
          return true
        }
        if(state.dataDefinitions) 
        {
          const dataDefinition = find(state.dataDefinitions.filters, dd => dd.name === f.name)
          return doesFilterMatchEnvironment(state.selectedEnvironment)(dataDefinition) ? f : EmptySampleIntegrityWarningFilter
        }
      })
    }),
    [selectSampleIntegrityWarningFilter as any]: (state: any, action: any) => ({
      ...state,
      filters: changeElementAtIndex(state.filters, action.payload.index, filter => ({
        ...EmptySampleIntegrityWarningFilter,
        name: action.payload.value
      }))
    }),
    [changeSampleIntegrityWarningFilterOperator as any]: (state: any, action: any) => ({
      ...state,
      filters: changeElementAtIndex(state.filters, action.payload.index, filter => ({
        ...filter,
        operator: action.payload.operator
      }))
    }),
    [changeSampleIntegrityWarningFilterValue as any]: (state: any, action: any) => ({
      ...state,
      filters: changeElementAtIndex(state.filters, action.payload.index, filter => ({
        ...filter,
        value: action.payload.value
      }))
    }),
    [changeSampleIntegrityWarningFilterValue2 as any]: (state: any, action: any) => ({
      ...state,
      filters: changeElementAtIndex(state.filters, action.payload.index, filter => ({
        ...filter,
        value2: action.payload.value
      }))
    }),
    [changeSampleIntegrityWarningFilterValues as any]: (state: any, action: any) => ({
      ...state,
      filters: changeElementAtIndex(state.filters, action.payload.index, filter => ({
        ...filter,
        values: action.payload.values
      }))
    })
  },
  searchPageInitialState.filters.sampleIntegrityWarning.filters
)

const combinedSampleIntegrityWarningReducers = (state = searchPageInitialState.filters.sampleIntegrityWarning, action) => ({
  ...state,
  selectedEnvironment: selectedEnvironmentReducer(state.selectedEnvironment, action),
  filtersMode: sampleIntegrityWarningFiltersModeReducer(state.filtersMode, action)
  // filters: array of filters is filled in here by the reduceReducers below
})

// This reducer is using reduceReducers because it needs access to both the dataDefinitions and the filters.
// Otherwise we could just use combineReducers just like for the other reducers in the app.
const sampleIntegrityWarningReducer = reduceReducers(combinedSampleIntegrityWarningReducers, sampleIntegrityWarningFiltersReducer)

export default sampleIntegrityWarningReducer
