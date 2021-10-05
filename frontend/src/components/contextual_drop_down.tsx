import { concat, map } from 'lodash'
import * as React from 'react'
import { Button, Col, Row } from 'reactstrap'
import Octicon from './octicon'
import Select from 'react-select';
export class ContextualDropDown extends React.Component<any> {
  protected dropDownSize = 11

  public render() {
    return (
      <Row>
        <Col sm={1} className="no-padding-right">
          <Button
            outline={true}
            color="warning"
            size="sm"
            className="form-control"
            onClick={() => this.props.remove(this.props.index)}
          >
            <Octicon name="dash" size="small" />
          </Button>
        </Col>
        <Col sm={this.dropDownSize} className="no-padding-right">
          <Select
            placeholder="Select filter"
            isSearchable={true}
            isLoading={this.props.optionsLoading}
            options={this.renderOptions()}
            value={map(this.props.options, this.renderOption).filter(option => option.value === this.props.filter.name)}
            onChange={evt => this.props.select(this.props.index, evt.value)}
          />
        </Col>
        {this.renderOperatorAndValue()}
      </Row>
    )
  }

  public renderOptions() {
    return concat(
      map(this.props.options, this.renderOption)
    )
  }

  public renderOption(option) {
    let displayName = option.display_name
    if (option.units) {
      displayName += ` [${option.units}]`
    }
    return (
      { value: option.name, label: displayName }
    )
  }

  protected renderOperatorAndValue() {
    return <span />
  }
}
