import * as React from 'react'
import { map } from 'lodash'
import { Col, FormGroup, Input } from 'reactstrap'
import Select from 'react-select'

import { FilterHeader } from 'components/filter_header'
import { OperatorAndValue } from 'search'

interface Props {
  label: string
  info: string
  selected: OperatorAndValue
  optionsLoading: boolean
  options: OperatorAndValue[]
  selectValue: (id: string) => void
  selectOperator: (id: string) => void
  onChange: (id: string) => void
}

const DropDownFilter = (props) => {
  const {
    label,
    info,
    isDisabled,
    selected,
    selectBoxOnly,
    optionsLoadingError,
    optionsLoading,
    options,
  } = props

  const renderOptions = () => {
    if (optionsLoadingError) {
      return [{ value: '', label: "Couldn't load values!" }]
    }

    return [{ value: '', label: '---' }, ...options.map(renderOption)]
  }

  const renderOption = (option) => ({ value: option.id, label: option.value })

  const onValueChange = (evt) => {
    const id = evt.value
    props.selectValue(id)

    if (props.onChange) {
      props.onChange()
    }
  }

  const onOperatorChange = (evt) => {
    const value = evt.target.value
    props.selectOperator(value)

    if (props.onChange) {
      props.onChange()
    }
  }

  if (label === null) {
    return null // Don't render
  }

  const SelectBox = () => {
    return (
      <Select
        placeholder={optionsLoadingError ? optionsLoadingError : '---'}
        isSearchable={true}
        isLoading={optionsLoading}
        options={renderOptions()}
        isDisabled={isDisabled || optionsLoadingError}
        value={map(options, renderOption).filter((option) => option.value === props.selected.value)}
        onChange={onValueChange}
      />
    )
  }

  if (selectBoxOnly) {
    return <SelectBox />
  }

  return (
    <FormGroup row={true}>
      <FilterHeader label={props.label} info={props.info} />
      <Col sm={3}>
        <Input
          type="select"
          name="operator"
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
