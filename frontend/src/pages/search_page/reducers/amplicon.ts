import { find } from 'lodash'
import { createActions, handleActions } from 'redux-actions'

import { clearAllTaxonomyFilters } from './taxonomy'
import { EmptyOperatorAndValue } from './types'

export const { selectAmplicon, selectAmpliconOperator } = createActions(
  'SELECT_AMPLICON', 'SELECT_AMPLICON_OPERATOR')

export function getDefaultAmplicon(values) {
  const defaultAmplicon = find(values, amplicon => amplicon.value === window.otu_search_config.default_amplicon)
  return (defaultAmplicon)? defaultAmplicon : (values.length)? values[0]: undefined
}

export function getAmpliconFilter(state) {
  const { selectedAmplicon } = state.searchPage.filters
  return selectedAmplicon
}

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
