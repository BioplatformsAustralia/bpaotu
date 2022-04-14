import * as React from 'react'
import { get as _get } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { selectAmplicon, selectAmpliconOperator, getDefaultAmplicon } from '../reducers/amplicon'
import DropDownFilter from '../../../components/drop_down_filter'

class AmpliconFilter extends React.Component<any> {

  componentDidUpdate() {
    const defaultAmplicon = getDefaultAmplicon(this.props.options)
    if (this.props.selected.value === '' && defaultAmplicon) {
      this.props.selectValue(defaultAmplicon.id)
    }
  }

  public render() {
    return (
      <DropDownFilter {...this.props} />
    )
  }
}

function mapStateToProps(state) {
  return {
    label: 'Amplicon',
    options: state.referenceData.amplicons.values,
    optionsLoadingError: state.referenceData.amplicons.error,
    isDisabled: _get(state, 'referenceData.amplicons.values', []).length === 0,
    optionsLoading: state.referenceData.amplicons.isLoading,
    selected: state.searchPage.filters.selectedAmplicon
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      selectValue: selectAmplicon,
      selectOperator: selectAmpliconOperator
    },
    dispatch
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AmpliconFilter)
