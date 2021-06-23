import { filter, find } from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'
import { Button, Card, CardBody, CardFooter, CardHeader, Col, Form, FormGroup, Input, Row, Label, UncontrolledTooltip, Badge } from 'reactstrap'
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

class ContextualFilterCard extends React.Component<any> {
  public componentDidMount() {
    if(this.props.fetchContextualDataDefinitions())
      this.props.addWarningContextualFilter()
  }

  public render() {
    return (
      <Card>
        <CardHeader>
        <Row>
              <Col>
                  Contextual Filters  
              </Col>
              <Col className="text-right">
                <Badge pill color="secondary" style={{cursor:'pointer'}}
                  onClick={() => {
                    window.open(this.props.definitions_url)
                  }}>
                  <Octicon name="link" />{' '}Download Metadata Description{' '}
                  <Badge color="secondary" id="downloadContextualTip">
                    <Octicon name="info" />
                  </Badge>
                </Badge>
                
                <UncontrolledTooltip target="downloadContextualTip" placement="auto">
                  {"Download Metadata for Contextual Data fields including units, field descriptions"}
                </UncontrolledTooltip>
              </Col>
            </Row>
        </CardHeader>
        <CardBody className="filters">
          <EnvironmentFilter />

          <hr />
          <h5 className="text-center">Contextual Filters</h5>

          <Row>
            <Col>
              <p className="text-center">
                Contextual filters allow data to be filtered on site specific chemical and physical data. More than one filter may be used and combined with "all/any" functions.
              </p>
            </Col>
          </Row>

          {this.props.contextualFilters.length >= 2 && (
            <Row>
              <Col sm={12}>
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
              </Col>
            </Row>
          )}

          <Row>
            <Col sm={12}>
              <FormGroup check>
                <Label sm={12} check>
                  <Input
                      type="checkbox"
                      checked={this.props.contextualFilters.find(fltr => fltr.name === "sample_integrity_warnings_id")?false:true}
                      onChange={evt => evt.target.checked? this.props.removeWarningContextualFilter():this.props.addWarningContextualFilter() }
                    />
                    {this.props.contextualFilters.find(fltr => fltr.name === "sample_integrity_warnings_id")?"Check to show all data including samples with integrity warnings.":"Showing all data including samples with integrity warnings. Uncheck to apply filter."}
                </Label>
              </FormGroup>
            </Col>
          </Row>

          <Row className="space-above" />

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
