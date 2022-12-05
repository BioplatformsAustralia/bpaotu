import * as React from 'react'
import { get as _get } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  selectAmplicon, selectAmpliconOperator, getDefaultAmplicon,
  getDefaultMetagenomeAmplicon
} from '../reducers/amplicon'
import DropDownFilter from '../../../components/drop_down_filter'

class AmpliconFilter extends React.Component<any> {

  defaultAmplicon: any

  setDefaultAmplicon() {
    if (this.defaultAmplicon || this.props.options.length === 0) {
      return
    }
    this.defaultAmplicon = (this.props.metagenomeMode ?
      getDefaultMetagenomeAmplicon :
      getDefaultAmplicon)(this.props.options)
    if (this.defaultAmplicon) {
      this.props.selectValue(this.defaultAmplicon.id)
    }
  }

  componentDidMount() {
    this.defaultAmplicon = null
    this.setDefaultAmplicon()
  }

  componentDidUpdate() {
    this.setDefaultAmplicon()
    if (this.props.selected.value === '' && !this.props.metagenomeMode) {
      if (this.defaultAmplicon) {
        this.props.selectValue(this.defaultAmplicon.id)
      }
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
