import React, { useState, useEffect, useCallback } from 'react'

import { get as _get } from 'lodash'

import DropDownFilter from 'components/drop_down_filter'

import { useAppDispatch, useAppSelector } from 'hooks/redux'

import {
  selectAmplicon,
  selectAmpliconOperator,
  getDefaultAmplicon,
  getDefaultMetagenomeAmplicon,
} from '../reducers/amplicon'
import { AmpliconFilterInfo } from './amplicon_taxonomy_filter_card'

const AmpliconFilter = ({ selectBoxOnly = false, keepExistingValue = false }) => {
  const dispatch = useAppDispatch()

  const [defaultAmplicon, setDefaultAmplicon] = useState(null)

  const options = useAppSelector((state) => state.referenceData.amplicons.values)

  const optionsLoadingError = useAppSelector((state) => state.referenceData.amplicons.error)

  const optionsLoading = useAppSelector((state) => state.referenceData.amplicons.isLoading)

  const metagenomeMode = useAppSelector((state) => state.searchPage.filters.metagenomeMode)

  const selected = useAppSelector((state) => state.searchPage.filters.selectedAmplicon)

  const isDisabled = _get(options, 'length', 0) === 0

  const selectValue = useCallback(
    (value) => {
      dispatch(selectAmplicon(value))
    },
    [dispatch],
  )

  const selectOperator = useCallback(
    (value) => {
      dispatch(selectAmpliconOperator(value))
    },
    [dispatch],
  )

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
    if (!keepExistingValue && selected.value === '' && !metagenomeMode && defaultAmplicon) {
      selectValue(defaultAmplicon.id)
    }
  }, [selected.value, metagenomeMode, defaultAmplicon, keepExistingValue, selectValue])

  return (
    <DropDownFilter
      label="Amplicon"
      info={AmpliconFilterInfo}
      options={options}
      optionsLoadingError={optionsLoadingError}
      isDisabled={isDisabled}
      optionsLoading={optionsLoading}
      selectBoxOnly={selectBoxOnly}
      selected={selected}
      selectValue={selectValue}
      selectOperator={selectOperator}
    />
  )
}

export default AmpliconFilter
