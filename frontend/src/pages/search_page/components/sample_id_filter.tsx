import * as React from 'react'
import { concat, map, filter as _filter } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Col, FormGroup, Input, Label, UncontrolledTooltip } from 'reactstrap'
import Select from 'react-select'

import Octicon from 'components/octicon'

import { changeSampleIdsFilterOperator, changeSampleIdsFilterValues } from '../reducers/sample_ids'

export const SampleIdsInfo =
  'Data may be filtered for a given Sample ID. Note that any other filter conditions (e.g. amplicaton, taxonoimy, traits, contextual) will still be applied.'

class SampleIdFilter extends React.Component<any> {
  public render() {
    const onChangeOperator = (evt) => {
      this.props.changeSampleIdsFilterOperator(evt.target.value)
    }

    const onChangeValues = (evt) => {
      const values = _filter(evt.target.options, (o) => o.selected).map((o: any) => o.value)
      this.props.changeSampleIdsFilterValues(values)
    }

    const showSampleIdSelect = this.props.idOperator === 'is'

    return (
      <FormGroup row={true}>
        <Label sm={3}>
          Sample ID{' '}
          <span id="sampleIdsTip">
            <Octicon name="info" />
          </span>
          <UncontrolledTooltip target="sampleIdsTip" placement="auto">
            {SampleIdsInfo}
          </UncontrolledTooltip>
        </Label>
        <Col sm={3}>
          <Input
            type="select"
            name="operator"
            value={this.props.idOperator}
            onChange={onChangeOperator}
          >
            <option value="all">(all)</option>
            <option value="is">is</option>
          </Input>
        </Col>
        {showSampleIdSelect && (
          <Col sm={6}>
            <Input
              type="select"
              multiple={true}
              disabled={this.props.optionsLoading}
              onChange={onChangeValues}
              value={this.props.idValues}
            >
              {this.renderOptions().map((x, i) => {
                return (
                  <option value={x.value} key={i}>
                    {x.label}
                  </option>
                )
              })}
            </Input>
          </Col>
        )}
      </FormGroup>
    )
  }

  public renderOptions() {
    if (this.props.optionsLoading) {
      return []
    } else {
      return concat(map(this.props.options, this.renderOption))
    }
  }

  public renderOption(option) {
    return { value: option, label: option }
  }
}

function mapStateToProps(state) {
  const optionsLoading = state.contextualDataDefinitions.isLoading
  const allOptions = state.contextualDataDefinitions.sample_ids

  let options
  const selectedEnvironmentValue = state.searchPage.filters.contextual.selectedEnvironment.value

  if (optionsLoading) {
    options = undefined
  } else {
    if (selectedEnvironmentValue) {
      options = state.contextualDataDefinitions.sample_ids_env[selectedEnvironmentValue]
    } else {
      options = allOptions
    }
  }

  return {
    idOperator: state.searchPage.filters.sampleIds.idOperator,
    idValues: state.searchPage.filters.sampleIds.idValues,
    optionsLoading: optionsLoading,
    options: options,
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      changeSampleIdsFilterOperator,
      changeSampleIdsFilterValues,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SampleIdFilter)
