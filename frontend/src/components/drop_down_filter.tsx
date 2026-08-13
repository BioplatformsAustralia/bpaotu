import * as React from 'react'
import { map } from 'lodash'
import { Col, FormGroup, Input } from 'reactstrap'
import Select from 'react-select'

import { FilterHeader } from 'components/filter_header'
import { OperatorAndValue } from 'search'

const CouldNotLoadValues = "Couldn't load values!"

interface DropDownFilterProps {
  label: string
  info?: string
  isDisabled: boolean
  selectBoxOnly?: boolean
  optionsLoadingError: boolean
  selected: OperatorAndValue
  optionsLoading: boolean
  options: OptionIdAndValue[]
  selectValue: (id: string) => void
  selectOperator: (id: string) => void
  onChange?: () => void
}

type OptionIdAndValue = {
  id: string
  value: string
}

const DropDownFilter = ({
  label,
  info,
  isDisabled,
  selected,
  selectBoxOnly,
  optionsLoadingError,
  optionsLoading,
  options,
  selectValue,
  selectOperator,
  onChange,
}: DropDownFilterProps) => {
  const renderOption = (option: OptionIdAndValue) => ({
    value: option.id,
    label: option.value,
  })
  const renderOptions = () => {
    if (optionsLoadingError) {
      return [{ value: '', label: CouldNotLoadValues }]
    }

    return [{ value: '', label: '---' }, ...options.map(renderOption)]
  }

  const onValueChange = (evt) => {
    selectValue(evt.value)

    if (onChange) {
      onChange()
    }
  }

  const onOperatorChange = (evt) => {
    selectOperator(evt.target.value)

    if (onChange) {
      onChange()
    }
  }

  if (label === null) {
    return null // Don't render
  }

  const SelectBox = () => {
    return (
      <Select
        placeholder={optionsLoadingError ? CouldNotLoadValues : '---'}
        isSearchable={true}
        isLoading={optionsLoading}
        options={renderOptions()}
        isDisabled={isDisabled || optionsLoadingError}
        value={map(options, renderOption).filter((option) => option.value === selected.value)}
        onChange={onValueChange}
      />
    )
  }

  if (selectBoxOnly) {
    return <SelectBox />
  }

  return (
    <FormGroup className="form-group" row={true} noMargin>
      <FilterHeader label={label} info={info} />
      <Col sm={3}>
        <Input
          type="select"
          name="operator"
          className="form-control"
          disabled={isDisabled}
          value={selected.operator}
          onChange={onOperatorChange}
        >
          <option value="is">is</option>
          <option value="isnot">isn't</option>
        </Input>
      </Col>
      <Col sm={6}>
        <SelectBox />
      </Col>
    </FormGroup>
  )
}

export default DropDownFilter
