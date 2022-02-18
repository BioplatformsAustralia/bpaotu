import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createAction } from 'redux-actions'

import DropDownFilter from '../../../components/drop_down_filter'
import DropDownSelector from './taxonomy_selector'
import { updateTaxonomyDropDowns } from '../reducers/taxonomy'
import { taxonomy_ranks } from '../../../constants'

const taxonomyFilterStateToProps = (rank, label : any = "") => state => {
  const { options, isDisabled, isLoading, selected } = state.searchPage.filters.taxonomy[rank]

  return {
    label: label || state.referenceData.ranks.rankLabels[rank] || null,
    options,
    selected,
    optionsLoading: isLoading,
    isDisabled
  }
}
const taxonomyDispatchToProps = rank => dispatch => {
  const nameU = rank.toUpperCase()
  return bindActionCreators(
    {
      selectValue: createAction('SELECT_' + nameU),
      selectOperator: createAction(`SELECT_${nameU}_OPERATOR`),
      onChange: updateTaxonomyDropDowns(rank)
    },
    dispatch
  )
}

const connectUpTaxonomyDropDownFilter = (rank) =>
  connect(
    taxonomyFilterStateToProps(rank),
    taxonomyDispatchToProps(rank)
  )(DropDownFilter)

export const TaxonomySelector = connect(
  taxonomyFilterStateToProps('taxonomy_source', 'Taxonomy'),
  taxonomyDispatchToProps('taxonomy_source')
)(DropDownSelector)

export const TaxonomyDropDowns = taxonomy_ranks.map(
  (rank) => {
    const TaxonomyLevelDropDown = connectUpTaxonomyDropDownFilter(rank);
    return <TaxonomyLevelDropDown key={rank}/>;
  });
