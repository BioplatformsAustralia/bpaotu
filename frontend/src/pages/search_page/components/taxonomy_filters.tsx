import { capitalize } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createAction } from 'redux-actions'

import DropDownFilter from '../../../components/drop_down_filter'
import DropDownSelector from './taxonomy_selector'
import { updateTaxonomyDropDowns } from '../reducers/taxonomy'

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
export const KingdomFilter = connectUpTaxonomyDropDownFilter('kingdom')
export const PhylumFilter = connectUpTaxonomyDropDownFilter('phylum')
export const ClassFilter = connectUpTaxonomyDropDownFilter('class')
export const OrderFilter = connectUpTaxonomyDropDownFilter('order')
export const FamilyFilter = connectUpTaxonomyDropDownFilter('family')
export const GenusFilter = connectUpTaxonomyDropDownFilter('genus')
export const SpeciesFilter = connectUpTaxonomyDropDownFilter('species')
