import React, { useState, useEffect, useCallback } from 'react'

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
  const { options, metagenomeMode, keepExistingValue, selected, selectValue } = props

  const calculateDefaultAmplicon = useCallback(() => {
    if (defaultAmplicon || options.length === 0) {
      return
    }
    const ampliconFunction = metagenomeMode ? getDefaultMetagenomeAmplicon : getDefaultAmplicon
    const amplicon = ampliconFunction(options)
    if (amplicon) {
      setDefaultAmplicon(amplicon)
      selectValue(amplicon.id)
    }
  }, [defaultAmplicon, options, metagenomeMode, selectValue])

  useEffect(() => {
    if (!keepExistingValue) {
      calculateDefaultAmplicon()
    }
  }, [calculateDefaultAmplicon, keepExistingValue])

  useEffect(() => {
    if (!keepExistingValue) {
      if (selected.value === '' && !metagenomeMode && defaultAmplicon) {
        selectValue(defaultAmplicon.id)
      }
    }
  }, [selected.value, metagenomeMode, defaultAmplicon, keepExistingValue, selectValue])

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
