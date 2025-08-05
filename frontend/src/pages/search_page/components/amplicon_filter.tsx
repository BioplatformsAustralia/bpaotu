import React, { useState, useEffect } from 'react'

import { get as _get } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import DropDownFilter from 'components/drop_down_filter'

import {
  selectAmplicon,
  selectAmpliconOperator,
  getDefaultAmplicon,
  getDefaultMetagenomeAmplicon,
} from '../reducers/amplicon'

const AmpliconFilter = (props) => {
  const [defaultAmplicon, setDefaultAmplicon] = useState(null)

  const calculateDefaultAmplicon = () => {
    if (defaultAmplicon || props.options.length === 0) {
      return
    }
    const ampliconFunction = props.metagenomeMode
      ? getDefaultMetagenomeAmplicon
      : getDefaultAmplicon
    const amplicon = ampliconFunction(props.options)
    if (amplicon) {
      setDefaultAmplicon(amplicon)
      props.selectValue(amplicon.id)
    }
  }

  useEffect(() => {
    if (!props.keepExistingValue) {
      calculateDefaultAmplicon()
    }
  }, [props.options, props.metagenomeMode, props.keepExistingValue])

  useEffect(() => {
    if (!props.keepExistingValue) {
      if (props.selected.value === '' && !props.metagenomeMode && defaultAmplicon) {
        props.selectValue(defaultAmplicon.id)
      }
    }
  }, [props.selected.value, props.metagenomeMode, defaultAmplicon, props.keepExistingValue])

  return <DropDownFilter {...props} />
}

const mapStateToProps = (state) => {
  return {
    label: 'Amplicon',
    options: state.referenceData.amplicons.values,
    optionsLoadingError: state.referenceData.amplicons.error,
    isDisabled: _get(state, 'referenceData.amplicons.values', []).length === 0,
    optionsLoading: state.referenceData.amplicons.isLoading,
    selected: state.searchPage.filters.selectedAmplicon,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      selectValue: selectAmplicon,
      selectOperator: selectAmpliconOperator,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(AmpliconFilter)
