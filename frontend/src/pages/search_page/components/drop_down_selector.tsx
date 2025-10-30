import React, { useEffect, useMemo } from 'react'
import { map } from 'lodash'
import { Col, FormGroup } from 'reactstrap'
import Select from 'react-select'

import { FilterHeader } from 'components/filter_header'

const DropDownSelector = (props) => {
  const {
    label,
    info,
    placeholder,
    options,
    selected,
    selectOperator,
    selectValue,
    onChange,
    isDisabled,
    optionsLoading,
    optionsLoadingError,
    getDefaultOption,
  } = props

  // Default operator
  useEffect(() => {
    selectOperator('is')
  }, [selectOperator])

  // If selected value is empty and options are available, select default option
  useEffect(() => {
    if (selected.value === '' && options.length) {
      selectValue(getDefaultOption(options))
      onChange()
    }
  }, [selected, options, selectValue, onChange])

  const renderOption = (option) => ({
    value: option.id,
    label: option.value,
  })

  const renderedOptions = useMemo(() => {
    if (optionsLoadingError) {
      return [{ value: '', label: "Couldn't load values!" }]
    }
    return map(options, renderOption)
  }, [options, optionsLoadingError])

  const selectedOption = useMemo(() => {
    return renderedOptions.find((option) => option.value === selected.value)
  }, [renderedOptions, selected.value])

  const onValueChange = (evt) => {
    const id = evt.value
    selectValue(id)
    onChange()
  }

  return (
    <FormGroup row>
      <FilterHeader label={label} info={info} />
      <Col sm={9}>
        <Select
          isSearchable
          isLoading={optionsLoading}
          isDisabled={isDisabled || optionsLoadingError}
          value={selectedOption}
          options={renderedOptions}
          onChange={onValueChange}
          placeholder={placeholder}
        />
      </Col>
    </FormGroup>
  )
}

export default DropDownSelector
