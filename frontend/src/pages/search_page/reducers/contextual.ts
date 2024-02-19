import { find, isNull, filter, negate, toNumber } from 'lodash'
import reduceReducers from 'reduce-reducers'
import { combineActions, createActions, handleAction, handleActions } from 'redux-actions'

import { changeElementAtIndex, removeElementAtIndex } from 'reducers/utils'
import { searchPageInitialState } from './types'

export const { selectEnvironment, selectEnvironmentOperator, selectContextualFiltersMode } =
  createActions(
    'SELECT_ENVIRONMENT',
    'SELECT_ENVIRONMENT_OPERATOR',
    'SELECT_CONTEXTUAL_FILTERS_MODE'
  )

const selectedEnvironmentReducer = handleActions(
  {
    [selectEnvironment as any]: (state, action: any) => ({
      ...state,
      value: action.payload,
    }),
    [selectEnvironmentOperator as any]: (state, action: any) => ({
      ...state,
      operator: action.payload,
    }),
  },
  searchPageInitialState.filters.contextual.selectedEnvironment
)

const contextualFiltersModeReducer = handleAction(
  selectContextualFiltersMode,
  (state, action: any) => action.payload,
  searchPageInitialState.filters.contextual.filtersMode
)

/*
To keep things simple we don't use different object for different types. ex. String contextual filter would have a 
contains operator and only one value, Date contextual filter would have a between operator and from/to values etc.
There are pros and cons either way. This way the display of the React Components is fairly generic, but the state
will have multiple "values" fields that are empty if they don't make sense for the given type.
Ex. values is used only by Sample ID, String filters only use value, "Between" filters use value and value2 etc.
*/
// const EmptyContextualFilter = {
//   name: '',
//   operator: '',
//   value: '',
//   value2: '',
//   values: [],
// }

// TEMP TO HELP FASTER DEV BY SETTING INITIAL SAMPLE IDS EASILY
const EmptyContextualFilter = {
  name: 'id',
  operator: '',
  value: [],
  value2: '',
  values: [
    '10601',
    '10602',
    '10603',
    '10604',
    '10605',
    '10606',
    '10607',
    '10608',
    '10609',
    '10610',
    '10611',
    '10612',
    '10613',
    '10614',
    '10615',
    '10616',
    '10617',
    '10618',
    '10619',
    '10620',
    '10621',
    '10622',
    '10623',
    '10624',
    '10625',
    '10626',
    '10627',
    '10628',
    '10629',
    '10630',
    '37001',
    '37002',
    '37003',
    '37004',
    '37005',
    '37006',
    '37007',
    '37008',
    '37009',
    '37010',
    '37011',
    '37012',
    '37013',
    '37014',
    '37015',
    '37016',
    '37017',
    '37018',
    '37019',
    '37020',
    '37021',
    '37022',
    '37023',
    '37024',
    '37025',
    '37026',
    '37027',
    '37028',
    '37029',
    '37030',
    // '37031',
    // '37032',
    // '37033',
    // '37034',
    // '37035',
    // '37036',
    // '37037',
    // '37038',
    // '37039',
    // '37040',
    // '37041',
    // '37042',
    // '37043',
    // '37044',
    // '37045',
    // '37046',
    // '37047',
    // '37048',
    // '37049',
    // '37050',
    // '37051',
    // '37052',
    // '37053',
    // '37054',
    // '37055',
    // '37056',
    // '37057',
    // '37058',
    // '37059',
    // '37060',
    // '37061',
    // '37062',
    // '37063',
    // '37064',
    // '37065',
    // '37066',
    // '37067',
    // '37068',
    // '37069',
    // '37070',
    // '37071',
    // '37072',
    // '37073',
    // '37074',
    // '37075',
    // '37076',
    // '37077',
    // '37078',
    // '37079',
    // '37080',
    // '37081',
    // '37082',
    // '37083',
    // '37084',
    // '37085',
    // '37086',
    // '37087',
    // '37088',
    // '37089',
    // '37090',
    // '37091',
    // '37092',
    // '37093',
    // '37094',
    // '37095',
    // '37096',
    // '37097',
    // '37098',
    // '37099',
    // '37100',
  ],
}

export const {
  selectContextualFilter,
  changeContextualFilterOperator,
  changeContextualFilterValue,
  changeContextualFilterValue2,
  changeContextualFilterValues,

  addContextualFilter,
  removeContextualFilter,
  clearContextualFilters,
} = createActions(
  {
    SELECT_CONTEXTUAL_FILTER: (index, value) => ({ index, value }),
    CHANGE_CONTEXTUAL_FILTER_OPERATOR: (index, operator) => ({ index, operator }),
    CHANGE_CONTEXTUAL_FILTER_VALUE: (index, value) => ({ index, value }),
    CHANGE_CONTEXTUAL_FILTER_VALUE2: (index, value) => ({ index, value }),
    CHANGE_CONTEXTUAL_FILTER_VALUES: (index, values) => ({ index, values }),
  },
  'ADD_WARNING_CONTEXTUAL_FILTER',
  'REMOVE_WARNING_CONTEXTUAL_FILTER',
  'ADD_CONTEXTUAL_FILTER',
  'REMOVE_CONTEXTUAL_FILTER',
  'CLEAR_CONTEXTUAL_FILTERS'
)

export const doesFilterMatchEnvironment = (environment) => (filter) => {
  if (environment.value === '') {
    return true
  }
  const eq = (fltr) => fltr.environment === toNumber(environment.value)
  const op = environment.operator === 'is' ? eq : negate(eq)
  return isNull(filter.environment) || op(filter)
}

const contextualFiltersReducer = handleActions(
  {
    [addContextualFilter as any]: (state: any, action) => ({
      ...state,
      filters: [...state.filters, EmptyContextualFilter],
    }),
    [removeContextualFilter as any]: (state: any, action) => ({
      ...state,
      filters: removeElementAtIndex(state.filters, action.payload),
    }),
    [clearContextualFilters as any]: (state: any, action) => ({
      ...state,
      filters: [],
    }),
    [combineActions(selectEnvironment, selectEnvironmentOperator) as any]: (state, action) => ({
      ...state,
      filters: filter(state.filters, (f) => {
        if (f.name === '') {
          return true
        }
        if (state.dataDefinitions) {
          const dataDefinition = find(state.dataDefinitions.filters, (dd) => dd.name === f.name)
          return doesFilterMatchEnvironment(state.selectedEnvironment)(dataDefinition)
            ? f
            : EmptyContextualFilter
        }
      }),
    }),
    [selectContextualFilter as any]: (state: any, action: any) => ({
      ...state,
      filters: changeElementAtIndex(state.filters, action.payload.index, (filter) => ({
        ...EmptyContextualFilter,
        name: action.payload.value,
      })),
    }),
    [changeContextualFilterOperator as any]: (state: any, action: any) => ({
      ...state,
      filters: changeElementAtIndex(state.filters, action.payload.index, (filter) => ({
        ...filter,
        operator: action.payload.operator,
      })),
    }),
    [changeContextualFilterValue as any]: (state: any, action: any) => ({
      ...state,
      filters: changeElementAtIndex(state.filters, action.payload.index, (filter) => ({
        ...filter,
        value: action.payload.value,
      })),
    }),
    [changeContextualFilterValue2 as any]: (state: any, action: any) => ({
      ...state,
      filters: changeElementAtIndex(state.filters, action.payload.index, (filter) => ({
        ...filter,
        value2: action.payload.value,
      })),
    }),
    [changeContextualFilterValues as any]: (state: any, action: any) => ({
      ...state,
      filters: changeElementAtIndex(state.filters, action.payload.index, (filter) => ({
        ...filter,
        values: action.payload.values,
      })),
    }),
  },
  searchPageInitialState.filters.contextual.filters
)

const combinedContextualReducers = (state = searchPageInitialState.filters.contextual, action) => ({
  ...state,
  selectedEnvironment: selectedEnvironmentReducer(state.selectedEnvironment, action),
  filtersMode: contextualFiltersModeReducer(state.filtersMode, action),
  // filters: array of filters is filled in here by the reduceReducers below
})

// This reducer is using reduceReducers because it needs access to both the dataDefinitions and the filters.
// Otherwise we could just use combineReducers just like for the other reducers in the app.
const contextualReducer = reduceReducers(combinedContextualReducers, contextualFiltersReducer)

export default contextualReducer
