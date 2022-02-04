import * as React from 'react'
import { capitalize } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createAction } from 'redux-actions'

import DropDownFilter from '../../../components/drop_down_filter'
import DropDownSelector from './taxonomy_selector'
import { updateTaxonomyDropDowns } from '../reducers/taxonomy'
import { taxonomy_levels } from '../../../constants'

const taxonomyFilterStateToProps = (name, label : any = "") => state => {
  const { options, isDisabled, isLoading, selected } = state.searchPage.filters.taxonomy[name]
  return {
    label: label || capitalize(name),
    options,
    selected,
    optionsLoading: isLoading,
    isDisabled
  }
}
const taxonomyDispatchToProps = name => dispatch => {
  const nameU = name.toUpperCase()
  return bindActionCreators(
    {
      selectValue: createAction('SELECT_' + nameU),
      selectOperator: createAction(`SELECT_${nameU}_OPERATOR`),
      onChange: updateTaxonomyDropDowns(name)
    },
    dispatch
  )
}

const connectUpTaxonomyDropDownFilter = (name) =>
  connect(
    taxonomyFilterStateToProps(name),
    taxonomyDispatchToProps(name)
  )(DropDownFilter)

export const TaxonomySelector = connect(
  taxonomyFilterStateToProps('taxonomy_source', 'Taxonomy'),
  taxonomyDispatchToProps('taxonomy_source')
)(DropDownSelector)

export const TaxonomyDropDowns = taxonomy_levels.map(
  (name) => {
    const TaxonomyLevelDropDown = connectUpTaxonomyDropDownFilter(name);
    return <TaxonomyLevelDropDown key={name}/>;
  });
