import React, { useState, useEffect, useCallback, useMemo } from 'react'

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

  // calculate defaultAmplicon
  const defaultAmplicon = useMemo(() => {
    if (options.length === 0) {
      return null
    }

    const fn = metagenomeMode ? getDefaultMetagenomeAmplicon : getDefaultAmplicon

    return fn(options)
  }, [options, metagenomeMode])

  useEffect(() => {
    if (!keepExistingValue && defaultAmplicon) {
      selectValue(defaultAmplicon.id)
    }
  }, [defaultAmplicon, keepExistingValue, selectValue])

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
