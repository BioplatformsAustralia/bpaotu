import { find } from 'lodash'
import { createActions, handleActions, handleAction } from 'redux-actions'

import { clearAllTaxonomyFilters } from './taxonomy'
import { EmptyOperatorAndValue } from './types'

export const { preselectAmplicon, selectAmplicon, selectAmpliconOperator } = createActions(
  'PRESELECT_AMPLICON', 'SELECT_AMPLICON', 'SELECT_AMPLICON_OPERATOR')

export function getDefaultAmplicon(values) {
  const defaultAmplicon = find(values, amplicon => amplicon.value === window.otu_search_config.default_amplicon)
  return (defaultAmplicon)? defaultAmplicon : (values.length)? values[0]: undefined
}

export function getAmpliconFilter(state) {
  const { selectedAmplicon, metagenomeAmplicon } = state.searchPage.filters
  if (metagenomeAmplicon) {
    const amplicon = find(state.referenceData.amplicons.values, amplicon => amplicon.value === metagenomeAmplicon)
    return {value: amplicon === undefined? '': amplicon.id, operator: 'is' }
  }
  return selectedAmplicon
}

export function isMetagenomeSearch(state) {
  return Boolean(state.searchPage.filters.metagenomeAmplicon)
}

export const metagenomeAmpliconReducer = handleAction(
  preselectAmplicon,
  (state, action: any) => (action.payload),
  ''
)

export const selectedAmpliconReducer =  handleActions(
  {
    [clearAllTaxonomyFilters as any]: (state, action: any) => {
      return EmptyOperatorAndValue
    },
    [selectAmplicon as any]: (state, action: any) => ({
      ...state,
      value: action.payload
    }),
    [selectAmpliconOperator as any]: (state, action: any) => ({
      ...state,
      operator: action.payload
    })
  },
  EmptyOperatorAndValue
)
