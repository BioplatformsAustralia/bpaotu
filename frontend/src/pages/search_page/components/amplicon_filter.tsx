import React, { useEffect, useState } from 'react'
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
  const { options, metagenomeMode, selectValue, selected } = props

  const [defaultAmplicon, setDefaultAmplicon] = useState(null)

  const updateDefaultAmplicon = () => {
    if (!defaultAmplicon && options.length > 0) {
      const amplicon = (metagenomeMode ? getDefaultMetagenomeAmplicon : getDefaultAmplicon)(options)
      if (amplicon) {
        setDefaultAmplicon(amplicon)
        selectValue(amplicon.id)
      }
    }
  }

  useEffect(() => {
    updateDefaultAmplicon()
  }, [options, metagenomeMode, selectValue])

  useEffect(() => {
    if (selected.value === '' && !metagenomeMode && defaultAmplicon) {
      selectValue(defaultAmplicon.id)
    }
  }, [selected.value, metagenomeMode, selectValue, defaultAmplicon])

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
