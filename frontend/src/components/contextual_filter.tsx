import * as React from 'react'
import { filter as _filter, get as _get, isArray, find } from 'lodash'
import { Col, Input, Row, UncontrolledTooltip } from 'reactstrap'
import Octicon from 'components/octicon'

import { ContextualDropDown } from './contextual_drop_down'

const TypeToOperatorAndValue = {
  string: StringOperatorAndValue,
  float: BetweenOperatorAndValue,
  date: BetweenOperatorAndValue,
  ontology: DropDownOperatorAndValue,
  sample_id: DropDownOperatorAndValue,
}

export default class ContextualFilter extends ContextualDropDown {
  // for contextual filter search
  protected dropDownSize = 3
  protected dropDownSizeNoRemove = 4

  public selectRef: any

  constructor(props) {
    super(props)
    this.selectRef = React.createRef()
  }

  public componentDidMount() {
    if (this.selectRef.current) {
      // Without this, submitting the initial value always sends "" instead of
      // the numeric index of the initial value. See EmptyContextualFilter
      // (contextual.ts)
      this.props.changeValue(this.props.index, this.selectRef.current.props.value)
    }
  }

  protected renderOperatorAndValue() {
    const type = _get(this.props, 'dataDefinition.type')
    const TypeBasedOperatorAndValue = TypeToOperatorAndValue[type]

    const filterTipId = 'FilterTip-' + this.props.index + '-' + this.props.filter.name

    return (
      <>
        {TypeBasedOperatorAndValue ? (
          <>
            <Col sm={{ size: 'auto' }} className="text-center">
              <span id={filterTipId}>
                <Octicon name="info" />
              </span>
              <UncontrolledTooltip target={filterTipId} placement="auto">
                {
                  find(this.props.definitions, (def) => def.name === this.props.filter.name)
                    .definition
                }
              </UncontrolledTooltip>
            </Col>
            <Col sm={7}>
              <TypeBasedOperatorAndValue
                filter={this.props.filter}
                dataDefinition={this.props.dataDefinition}
                changeOperator={(op) => this.props.changeOperator(this.props.index, op)}
                changeValue={(value) => this.props.changeValue(this.props.index, value)}
                changeValue2={(value) => this.props.changeValue2(this.props.index, value)}
                changeValues={(value) => this.props.changeValues(this.props.index, value)}
                selectRef={this.selectRef}
              />
            </Col>
          </>
        ) : null}
      </>
    )
  }
}

function forTargetValue(f) {
  return (evt) => f(evt.target.value)
}

function StringOperatorAndValue({ filter, dataDefinition, changeOperator, changeValue }) {
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

function BetweenOperatorAndValue({
  filter,
  dataDefinition,
  changeOperator,
  changeValue,
  changeValue2,
}) {
  const valueType = dataDefinition.type === 'date' ? 'date' : 'number'
  const sizes = {
    date: { op: 2, values: 5 },
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

function DropDownOperatorAndValue({
  filter,
  dataDefinition,
  changeOperator,
  changeValue,
  changeValues,
  selectRef,
}) {
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
