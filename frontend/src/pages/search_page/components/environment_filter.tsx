import * as React from 'react'
import { concat, map } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Col, FormGroup, Input, Label, UncontrolledTooltip } from 'reactstrap'
import Select from 'react-select'

import Octicon from 'components/octicon'

import { selectEnvironment, selectEnvironmentOperator } from '../reducers/contextual'

export const EnvironmentInfo =
  'Data may be filtered on environment to restrict samples to either soil or marine environment sources. Marine environment includes pelagic, coastal, sediment and host associated samples which can be further selected by applying "Sample Type" filter under Contextual Filters.'

class EnvironmentFilter extends React.Component<any> {
  public render() {
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
            value={this.props.selected.operator}
            onChange={(evt) => this.props.selectEnvironmentOperator(evt.target.value)}
          >
            <option value="is">is</option>
            <option value="isnot">isn't</option>
          </Input>
        </Col>
        <Col sm={6}>
          <Select
            placeholder="---"
            isSearchable={true}
            options={this.renderOptions()}
            defaultValue={{ value: '', label: '---' }}
            value={map(this.props.options, this.renderOption).filter(
              (option) => option.value === this.props.selected.value
            )}
            onChange={(evt) => this.props.selectEnvironment(evt.value)}
          />
        </Col>
      </FormGroup>
    )
  }

  public renderOptions() {
    return concat([{ value: '', label: '---' }], map(this.props.options, this.renderOption))
  }

  public renderOption(option) {
    return { value: option.id, label: option.name }
  }
}

function mapStateToProps(state) {
  return {
    selected: state.searchPage.filters.contextual.selectedEnvironment,
    optionsLoading: state.contextualDataDefinitions.isLoading,
    options: state.contextualDataDefinitions.environment,
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      selectEnvironment,
      selectEnvironmentOperator,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(EnvironmentFilter)
