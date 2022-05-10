import { get as _get } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { selectTrait, selectTraitOperator } from '../reducers/trait'

import DropDownFilter from '../../../components/drop_down_filter'
import { updateTaxonomyDropDowns } from '../reducers/taxonomy'

function mapStateToProps(state) {
  return {
    label: 'Trait',
    options: state.referenceData.traits.values,
    optionsLoadingError: state.referenceData.traits.error,
    isDisabled: _get(state, 'referenceData.traits.values', []).length === 0,
    optionsLoading: state.referenceData.traits.isLoading,
    selected: state.searchPage.filters.selectedTrait
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      selectValue: selectTrait,
      selectOperator: selectTraitOperator,
      onChange: updateTaxonomyDropDowns('')
    },
    dispatch
  )
}

const TraitFilter = connect(
  mapStateToProps,
  mapDispatchToProps
)(DropDownFilter)

export default TraitFilter
