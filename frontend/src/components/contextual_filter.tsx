import React, { useEffect, useRef } from 'react'
import { filter as _filter, get as _get, isArray, find } from 'lodash'
import { Col, Input, Row, UncontrolledTooltip } from 'reactstrap'
import Octicon from 'components/octicon'

import { ContextualDropDown } from './contextual_drop_down'

const ContextualFilter = (props) => {
  const {
    index,
    filter,
    dataDefinition,
    dataDefinitions,
    definitions,
    optionsLoading,
    remove,
    select,
    changeValue,
    changeOperator,
    changeValue2,
    changeValues,
  } = props

  const selectRef = useRef(null)

  useEffect(() => {
    // Without this, submitting the initial value always sends "" instead of
    // the numeric index of the initial value. See EmptyContextualFilter
    // (contextual.ts)
    if (selectRef.current) {
      changeValue(index, selectRef.current.props.value)
    }
  }, [changeValue, index])

  const type = dataDefinition && dataDefinition.type
  const TypeToOperatorAndValue = {
    string: StringOperatorAndValue,
    float: BetweenOperatorAndValue,
    date: BetweenOperatorAndValue,
    time: BetweenOperatorAndValue,
    ontology: DropDownOperatorAndValue,
    sample_id: DropDownOperatorAndValue,
  }

  const TypeBasedOperatorAndValue = TypeToOperatorAndValue[type]
  const filterTipId = 'FilterTip-' + index + '-' + filter.name
  const definition = find(definitions, (def) => def.name === filter.name)

  return (
    <ContextualDropDown
      key={`${filter.name}-${index}`}
      index={index}
      filter={filter}
      dataDefinition={find(dataDefinitions, (dd) => dd.name === filter.name)}
      options={dataDefinitions}
      optionsLoading={optionsLoading}
      remove={remove}
      select={select}
      // for contextual filter search
      dropDownSize={3}
      dropDownSizeNoRemove={4}
    >
      {TypeBasedOperatorAndValue && (
        <>
          <Col sm={{ size: 'auto' }} className="text-center">
            <span id={filterTipId}>
              <Octicon name="info" />
            </span>
            <UncontrolledTooltip target={filterTipId} placement="auto">
              {dataDefinition.definition}
            </UncontrolledTooltip>
          </Col>
          <Col sm={7}>
            <TypeBasedOperatorAndValue
              selectRef={selectRef}
              filter={filter}
              dataDefinition={dataDefinition}
              changeOperator={(op) => changeOperator(index, op)}
              changeValue={(value) => changeValue(index, value)}
              changeValue2={(value) => changeValue2(index, value)}
              changeValues={(value) => changeValues(index, value)}
            />
          </Col>
        </>
      )}
    </ContextualDropDown>
  )
}

const forTargetValue = (f) => {
  return (evt) => f(evt.target.value)
}

const StringOperatorAndValue = ({ filter, dataDefinition, changeOperator, changeValue }) => {
  return (
    <Row>
      <Col sm={4} className="no-padding-right">
        <Input type="select" value={filter.operator} onChange={forTargetValue(changeOperator)}>
          <option value="">contains</option>
          <option value="complement">doesn't contain</option>
        </Input>
      </Col>
      <Col sm={8} className="no-padding-right">
        <Input value={filter.value} onChange={forTargetValue(changeValue)} />
      </Col>
    </Row>
  )
}

const BetweenOperatorAndValue = ({
  filter,
  dataDefinition,
  changeOperator,
  changeValue,
  changeValue2,
}) => {
  const valueType = getValueType(dataDefinition)
  const sizes = {
    date: { op: 2, values: 5 },
    time: { op: 2, values: 5 },
    number: { op: 4, values: 4 },
  }

  return (
    <Row>
      <Col sm={sizes[valueType].op} className="no-padding-right">
        <Input type="select" value={filter.operator} onChange={forTargetValue(changeOperator)}>
          <option value="">between</option>
          <option value="complement">not between</option>
        </Input>
      </Col>
      <Col sm={sizes[valueType].values} className="no-padding-right">
        <Input
          type={valueType}
          value={filter.value}
          onChange={forTargetValue(changeValue)}
          placeholder="lower value"
        />
      </Col>
      <Col sm={sizes[valueType].values} className="no-padding-right">
        <Input
          type={valueType}
          value={filter.value2}
          onChange={forTargetValue(changeValue2)}
          placeholder="higher value"
        />
      </Col>
    </Row>
  )
}

const DropDownOperatorAndValue = ({
  filter,
  dataDefinition,
  changeOperator,
  changeValue,
  changeValues,
  selectRef,
}) => {
  const renderOptions = dataDefinition.values.map((value) => {
    // The values are list of tuples [id, text] in general.
    // But for Sample ID the values are a list of the sample ids.
    const toIdAndText = (v) => {
      return isArray(v) ? (v[1] === '' ? [v[0], '(null)'] : v) : [v, v]
    }

    const [id, text] = toIdAndText(value)

    return (
      <option key={id} value={id}>
        {text}
      </option>
    )
  })

  const isMultiSelect = dataDefinition.type === 'sample_id'

  const onChange = (evt) => {
    if (isMultiSelect) {
      const values = _filter(evt.target.options, (o) => o.selected).map((o: any) => o.value)
      changeValues(values)
    } else {
      changeValue(evt.target.value)
    }
  }

  const select_value = () => {
    if (isMultiSelect) {
      return filter.values
    }

    if (filter.value !== '') {
      return filter.value
    }

    if (dataDefinition.values.length) {
      const first_value = dataDefinition.values[0]
      return isArray(first_value) ? first_value[0] : first_value
    }

    return ''
  }

  return (
    <Row>
      <Col sm={4} className="no-padding-right">
        <Input type="select" value={filter.operator} onChange={forTargetValue(changeOperator)}>
          <option value="">is</option>
          <option value="complement">isn't</option>
        </Input>
      </Col>
      <Col sm={8} className="no-padding-right">
        <Input
          type="select"
          multiple={isMultiSelect}
          value={select_value()}
          onChange={onChange}
          ref={selectRef}
        >
          {renderOptions}
        </Input>
      </Col>
    </Row>
  )
}

const getValueType = (dataDefinition) => {
  switch (dataDefinition.type) {
    case 'date':
      return 'date'
    case 'time':
      return 'time'
    default:
      return 'number'
  }
}

export default ContextualFilter
