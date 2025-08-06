import React from 'react'
import { concat, map } from 'lodash'
import { Button, Col, Row } from 'reactstrap'
import Octicon from 'components/octicon'
import Select from 'react-select'

export const ContextualDropDown = (props) => {
  const {
    remove,
    index,
    options,
    optionsLoading,
    filter,
    select,
    children,
    // defaults (for contextual tab)
    dropDownSize = 11,
    dropDownSizeNoRemove = 11,
  } = props

  const size = remove ? dropDownSize : dropDownSizeNoRemove

  const renderOption = (option) => {
    let displayName = option.display_name
    if (option.units) {
      displayName += ` [${option.units}]`
    }

    return { value: option.name, label: displayName }
  }

  const renderOptions = () => {
    return concat(map(options, renderOption))
  }

  return (
    <Row>
      {remove && (
        <Col sm={1} className="no-padding-right">
          <Button
            outline={true}
            color="warning"
            size="sm"
            className="form-control"
            onClick={() => {
              remove(index)
            }}
          >
            <Octicon name="dash" size="small" />
          </Button>
        </Col>
      )}
      <Col sm={size} className="no-padding-right">
        <Select
          placeholder="Select filter"
          isSearchable={true}
          isLoading={optionsLoading}
          options={renderOptions()}
          value={map(options, renderOption).filter((option) => option.value === filter.name)}
          onChange={(evt) => select(index, evt.value)}
        />
      </Col>
      {children}
    </Row>
  )
}
