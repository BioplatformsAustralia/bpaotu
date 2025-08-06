import * as React from 'react'
import { map } from 'lodash'
import { Col, FormGroup } from 'reactstrap'
import Select from 'react-select'

import { FilterHeader } from 'components/filter_header'

export default class DropDownSelector extends React.Component<any> {
  constructor(props) {
    super(props)
    this.onValueChange = this.onValueChange.bind(this)
    props.selectOperator('is')
  }

  componentDidUpdate() {
    if (this.props.selected.value === '' && this.props.options.length) {
      this.props.selectValue(this.getDefaultOption())
      this.props.onChange()
    }
  }

  public getDefaultOption() {
    return this.props.options[0].id
  }

  public onValueChange(evt) {
    const id = evt.value
    this.props.selectValue(id)
    this.props.onChange()
  }

  public renderOptions() {
    if (this.props.optionsLoadingError) {
      return { value: '', label: "Couldn't load values!" }
    }
    return map(this.props.options, this.renderOption)
  }

  public renderOption(option) {
    return { value: option.id, label: option.value }
  }

  public render() {
    return (
      <FormGroup row={true}>
        <FilterHeader label={this.props.label} info={this.props.info} />
        <Col sm={9}>
          <Select
            isSearchable={true}
            isLoading={this.props.optionsLoading}
            isDisabled={this.props.isDisabled || this.props.optionsLoadingError}
            value={map(this.props.options, this.renderOption).filter(
              (option) => option.value === this.props.selected.value
            )}
            options={this.renderOptions()}
            onChange={this.onValueChange}
            placeholder={this.props.placeholder}
          />
        </Col>
      </FormGroup>
    )
  }
}
