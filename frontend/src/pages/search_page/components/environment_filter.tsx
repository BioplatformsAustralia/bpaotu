import React from 'react'
import { concat, map } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { Col, FormGroup, Input, Label, UncontrolledTooltip } from 'reactstrap'
import Select from 'react-select'

import Octicon from 'components/octicon'

import { selectEnvironment, selectEnvironmentOperator } from '../reducers/contextual'

export const EnvironmentInfo =
  'Data may be filtered on environment to restrict samples to either soil or marine environment sources. Marine environment includes pelagic, coastal, sediment and host associated samples which can be further selected by applying "Sample Type" filter under Contextual Filters.'

const defaultOption = { value: '', label: '---' }

const EnvironmentFilter = () => {
  const dispatch = useDispatch()

  const { selected } = useSelector((state: any) => ({
    selected: state.searchPage.filters.contextual.selectedEnvironment,
  }))

  const { options, loading } = useSelector((state: any) => ({
    options: state.contextualDataDefinitions.environment,
    loading: state.contextualDataDefinitions.isLoading,
  }))

  const renderOption = (option) => ({ value: option.id, label: option.name })
  const renderOptions = () => concat([defaultOption], map(options, renderOption))

  return (
    <FormGroup row={true}>
      <Label sm={3}>
        Environment{' '}
        <span id="environmentTip">
          <Octicon name="info" />
        </span>
        <UncontrolledTooltip target="environmentTip" placement="auto">
          {EnvironmentInfo}
        </UncontrolledTooltip>
      </Label>
      <Col sm={3}>
        <Input
          type="select"
          name="operator"
          value={selected.operator}
          onChange={(evt) => dispatch(selectEnvironmentOperator(evt.target.value))}
        >
          <option value="is">is</option>
          <option value="isnot">isn't</option>
        </Input>
      </Col>
      <Col sm={6}>
        <Select
          placeholder={defaultOption.label}
          isSearchable={true}
          options={renderOptions()}
          defaultValue={defaultOption}
          value={map(options, renderOption).filter((option) => option.value === selected.value)}
          onChange={(evt) => dispatch(selectEnvironment(evt.value))}
        />
      </Col>
    </FormGroup>
  )
}

export default EnvironmentFilter
