import { find } from 'lodash'
import { createActions, handleActions, handleAction } from 'redux-actions'

import { clearAllTaxonomyFilters } from './taxonomy'
import { EmptyOperatorAndValue } from './types'

export const { setMetagenomeMode, selectAmplicon, selectAmpliconOperator } = createActions(
  'SET_METAGENOME_MODE',
  'SELECT_AMPLICON',
  'SELECT_AMPLICON_OPERATOR'
)

function lookupAmplicon(values, ampliconName) {
  const defaultAmplicon = find(values, (amplicon) => amplicon.value === ampliconName)
  return defaultAmplicon ? defaultAmplicon : values.length ? values[0] : undefined
}

export const getDefaultAmplicon = (values) =>
  lookupAmplicon(values, window.otu_search_config.default_amplicon)

export const getDefaultMetagenomeAmplicon = (values) =>
  lookupAmplicon(values, window.otu_search_config.metaxa_amplicon)

export function getAmpliconFilter(state) {
  return state.searchPage.filters.selectedAmplicon
}

export function isMetagenomeSearch(state) {
  return Boolean(state.searchPage.filters.metagenomeMode)
}

export const metagenomeModeReducer = handleAction(
  setMetagenomeMode,
  (state, action: any) => action.payload,
  ''
)

export const selectedAmpliconReducer = handleActions(
  {
    [clearAllTaxonomyFilters as any]: (state, action: any) => {
      return EmptyOperatorAndValue
    },
    [selectAmplicon as any]: (state, action: any) => {
      console.log('selectAmplicon', 'action', action)
      return {
        ...state,
        value: action.payload,
      }
    },
    [selectAmpliconOperator as any]: (state, action: any) => ({
      ...state,
      operator: action.payload,
    }),
  },
  EmptyOperatorAndValue
)
