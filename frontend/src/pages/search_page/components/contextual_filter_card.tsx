import { filter, find } from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'
import { Button, Card, CardBody, CardFooter, CardHeader, Col, Form, FormGroup, Input, Row, Label, UncontrolledTooltip, Badge, Alert } from 'reactstrap'
import Octicon from '../../../components/octicon'

import { bindActionCreators } from 'redux'
import {
  addWarningContextualFilter,
  removeWarningContextualFilter,
  addContextualFilter,
  changeContextualFilterOperator,
  changeContextualFilterValue,
  changeContextualFilterValue2,
  changeContextualFilterValues,
  clearContextualFilters,
  doesFilterMatchEnvironment,
  removeContextualFilter,
  selectContextualFilter,
  selectContextualFiltersMode
} from '../reducers/contextual'
import { fetchContextualDataDefinitions } from '../../../reducers/contextual_data_definitions'

import ContextualFilter from '../../../components/contextual_filter'
import EnvironmentFilter from './environment_filter'

export const ContextualFilterInfo =
  'Contextual filters allow data to be filtered on site specific chemical and physical data. '


class ContextualFilterCard extends React.Component<any> {
  public componentDidMount() {
    if(this.props.fetchContextualDataDefinitions())
      this.props.addWarningContextualFilter()
  }

  public render() {
    return (
      <Card>
        <CardHeader tag="h5">
          <Row>
            <Col>
                Contextual Filters
            </Col>
            <Col className="text-right" xs="auto">
                <Button size="sm" color="secondary" style={{cursor:'pointer', margin: '-15px 0px', padding: '3px 10px'}} onClick={() => {
                    window.open(this.props.definitions_url)
                  }}>
                  <Octicon name="link" />
                  <span>{' '}Download metadata description{' '}</span>
                  <Badge color="secondary" id="downloadContextualTip"><Octicon name="info" /></Badge>
                </Button>
                <Button size="sm" color="secondary" style={{cursor:'pointer', margin: '-15px 0px', padding: '3px 10px'}} onClick={() => {
                    window.open(this.props.scientific_manual_url)
                  }}>
                  <Octicon name="link" />
                  <span>{' '}Download methods manual{' '}</span>
                  <Badge color="secondary" id="downloadMethodlTip"><Octicon name="info" /></Badge>
                </Button>
              <UncontrolledTooltip target="downloadContextualTip" placement="auto">
                {"Download Metadata for Contextual Data fields including units, field descriptions and controlled vocabularies"}
              </UncontrolledTooltip>
              <UncontrolledTooltip target="downloadMethodlTip" placement="auto">
                {"Download the manual containing scientific methods used in sample collection and processing"}
              </UncontrolledTooltip>
            </Col>
          </Row>
        </CardHeader>
        <CardBody className="filters">
          <EnvironmentFilter />

          <hr />
          <h5 className="text-center">Contextual Filters{' '}
          <span id="contextualFilterTip">
            <Octicon name="info" />
          </span>
          <UncontrolledTooltip target="contextualFilterTip" placement="auto">
            {ContextualFilterInfo}
          </UncontrolledTooltip>
          </h5>
          <Row>
            <Col>
              <p className="text-center">
                More than one filter may be used and combined with "all/any" functions.
              </p>
            </Col>
          </Row>

          <Row>
            <Col sm={12}>
              <Alert color="secondary">
                <FormGroup check>
                  <Label sm={12} check color="primary">
                    <Input
                        type="checkbox"
                        checked={this.props.contextualFilters.find(fltr => fltr.name === "sample_integrity_warnings_id")?false:true}
                        onChange={evt => evt.target.checked? this.props.removeWarningContextualFilter():this.props.addWarningContextualFilter() }
                      />
                      
                        {this.props.contextualFilters.find(fltr => fltr.name === "sample_integrity_warnings_id")?"Check to show all data including samples with integrity warnings.":"Uncheck to remove samples with integrity warnings."}
                  </Label>
                </FormGroup>
                </Alert>
            </Col>
          </Row>

          {this.props.contextualFilters.length >= 2 && (
            <Row>
              <Col sm={12}>
                <Alert color="secondary">
                  <Form inline={true}>
                    Samples must match &nbsp;
                    <Input
                      type="select"
                      bsSize="sm"
                      value={this.props.contextualFiltersMode}
                      onChange={evt => this.props.selectContextualFiltersMode(evt.target.value)}
                    >
                      <option value="and">all</option>
                      <option value="or">any</option>
                    </Input>
                    &nbsp; of the following contextual filters.
                  </Form>
                </Alert>
              </Col>
            </Row>
          )}

          {this.props.contextualFilters.map((fltr, index) => (
            <ContextualFilter
              key={`${fltr.name}-${index}`}
              index={index}
              filter={fltr}
              dataDefinition={find(this.props.dataDefinitions, dd => dd.name === fltr.name)}
              options={this.props.contextualFilterOptions}
              optionsLoading={this.props.optionsLoading}
              remove={this.props.removeContextualFilter}
              select={this.props.selectContextualFilter}
              changeOperator={this.props.changeContextualFilterOperator}
              changeValue={this.props.changeContextualFilterValue}
              changeValue2={this.props.changeContextualFilterValue2}
              changeValues={this.props.changeContextualFilterValues}
              definitions={this.props.definitions}
            />
          ))}
        </CardBody>
        <CardFooter className="text-center">
          <Button color="success" onClick={this.props.addContextualFilter}>
            Add
          </Button>
          <Button color="warning" onClick={this.props.clearContextualFilters}>
            Clear
          </Button>
        </CardFooter>
      </Card>
    )
  }
}

const getFilterOptions = (filters, selectedEnvironment) =>
  filter(filters, doesFilterMatchEnvironment(selectedEnvironment))

function mapStateToProps(state) {
  return {
    contextualFilters: state.searchPage.filters.contextual.filters,
    contextualFiltersMode: state.searchPage.filters.contextual.filtersMode,
    dataDefinitions: state.contextualDataDefinitions.filters,
    contextualFilterOptions: getFilterOptions(
      state.contextualDataDefinitions.filters,
      state.searchPage.filters.contextual.selectedEnvironment
    ),
    optionsLoading: state.contextualDataDefinitions.isLoading,
    definitions_url: state.contextualDataDefinitions.definitions_url,
    scientific_manual_url: state.contextualDataDefinitions.scientific_manual_url,
    definitions: state.contextualDataDefinitions.values
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      fetchContextualDataDefinitions,
      selectContextualFiltersMode,
      addWarningContextualFilter,
      removeWarningContextualFilter,
      addContextualFilter,
      removeContextualFilter,
      selectContextualFilter,
      changeContextualFilterOperator,
      changeContextualFilterValue,
      changeContextualFilterValue2,
      changeContextualFilterValues,
      clearContextualFilters
    },
    dispatch
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContextualFilterCard)
