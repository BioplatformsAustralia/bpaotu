import * as React from 'react'
import { filter, find } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Col,
  Form,
  FormGroup,
  Input,
  Row,
  Label,
  UncontrolledTooltip,
  Badge,
  Alert,
} from 'reactstrap'
import { v4 as uuid } from 'uuid'

import Octicon from 'components/octicon'
import ContextualFilter from 'components/contextual_filter'
import { fetchContextualDataDefinitions } from 'reducers/contextual_data_definitions'

import {
  addContextualFilter,
  changeContextualFilterOperator,
  changeContextualFilterValue,
  changeContextualFilterValue2,
  changeContextualFilterValues,
  clearContextualFilters,
  doesFilterMatchEnvironment,
  removeContextualFilter,
  selectContextualFilter,
  selectContextualFiltersMode,
} from '../reducers/contextual'
import {
  checkSampleIntegrityWarningFilter,
  uncheckSampleIntegrityWarningFilter,
  addSampleIntegrityWarningFilter,
  removeSampleIntegrityWarningFilter,
  changeSampleIntegrityWarningFilterOperator,
  changeSampleIntegrityWarningFilterValue,
  changeSampleIntegrityWarningFilterValue2,
  changeSampleIntegrityWarningFilterValues,
  clearSampleIntegrityWarningFilters,
  selectSampleIntegrityWarningFilter,
  selectSampleIntegrityWarningFiltersMode,
} from '../reducers/sample_integrity_warning'

import EnvironmentFilter from './environment_filter'

export const ContextualFilterInfo =
  'Contextual filters allow data to be filtered on site specific chemical and physical data. '

const ContextualFilterLinkButton = ({ title, url, tooltip }) => {
  const id = `id-${uuid()}`

  return (
    <>
      <Button
        size="sm"
        color="secondary"
        style={{ cursor: 'pointer', margin: '-15px 2px', padding: '3px 10px' }}
        href={url}
        target="_blank"
      >
        <Octicon name="link" />
        <span style={{ paddingLeft: 4, paddingRight: 4 }}>{title}</span>
        <Badge color="secondary" id={id}>
          <Octicon name="info" />
        </Badge>
        <UncontrolledTooltip target={id} placement="auto">
          {tooltip}
        </UncontrolledTooltip>
      </Button>
    </>
  )
}

class ContextualFilterCard extends React.Component<any> {
  public componentDidMount() {
    if (this.props.fetchContextualDataDefinitions()) {
      // this.props.addWarningContextualFilter()
    }
  }

  public render() {
    return (
      <Card>
        <CardHeader tag="h5">
          <Row>
            <Col>Contextual Filters</Col>
            <Col className="text-right" xs="auto">
              <ContextualFilterLinkButton
                title="Download metadata description"
                url={this.props.definitions_url}
                tooltip="Download Metadata for Contextual Data fields including units, field descriptions and controlled vocabularies"
              />
              <ContextualFilterLinkButton
                title="Download methods manual"
                url={this.props.scientific_manual_url}
                tooltip="Download the manual containing scientific methods used in sample collection and processing"
              />
            </Col>
          </Row>
        </CardHeader>
        <CardBody className="filters">
          <EnvironmentFilter />
          <hr />
          <h5 className="text-center">
            Contextual Filters
            <span id="contextualFilterTip" style={{ marginLeft: 8 }}>
              <Octicon name="info" />
            </span>
          </h5>
          <UncontrolledTooltip target="contextualFilterTip" placement="auto">
            {ContextualFilterInfo}
          </UncontrolledTooltip>
          <Row>
            <Col>
              <p className="text-center">
                More than one filter may be used and combined with "all/any" functions.
                <br />
                The sample integrity warnings filter will be applied in addition to other contextual
                filters.
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
                      checked={
                        this.props.sampleIntegrityWarningFilters.find(
                          (fltr) => fltr.name === 'sample_integrity_warnings_id'
                        )
                          ? false
                          : true
                      }
                      onChange={(evt) =>
                        evt.target.checked
                          ? this.props.uncheckSampleIntegrityWarningFilter()
                          : this.props.checkSampleIntegrityWarningFilter()
                      }
                    />
                    {this.props.sampleIntegrityWarningFilters.find(
                      (fltr) => fltr.name === 'sample_integrity_warnings_id'
                    )
                      ? 'Check to show all data including samples with integrity warnings'
                      : 'Uncheck to remove samples with integrity warnings'}
                  </Label>
                </FormGroup>
                {this.props.sampleIntegrityWarningFilters.map((fltr, index) => (
                  <ContextualFilter
                    key={`${fltr.name}-${index}`}
                    index={index}
                    filter={fltr}
                    dataDefinition={find(this.props.dataDefinitions, (dd) => dd.name === fltr.name)}
                    options={this.props.sampleIntegrityWarningFilterOptions}
                    optionsLoading={this.props.optionsLoading}
                    remove={null}
                    select={this.props.selectSampleIntegrityWarningFilter}
                    changeOperator={this.props.changeSampleIntegrityWarningFilterOperator}
                    changeValue={this.props.changeSampleIntegrityWarningFilterValue}
                    changeValue2={this.props.changeSampleIntegrityWarningFilterValue2}
                    changeValues={this.props.changeSampleIntegrityWarningFilterValues}
                    definitions={this.props.definitions}
                  />
                ))}
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
                      onChange={(evt) => this.props.selectContextualFiltersMode(evt.target.value)}
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
              dataDefinition={find(this.props.dataDefinitions, (dd) => dd.name === fltr.name)}
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
    sampleIntegrityWarningFilters: state.searchPage.filters.sampleIntegrityWarning.filters,
    sampleIntegrityWarningFiltersMode: state.searchPage.filters.sampleIntegrityWarning.filtersMode,
    dataDefinitions: state.contextualDataDefinitions.filters,
    contextualFilterOptions: getFilterOptions(
      state.contextualDataDefinitions.filters.filter(
        (x) => x.name !== 'sample_integrity_warnings_id'
      ),
      state.searchPage.filters.contextual.selectedEnvironment
    ),
    sampleIntegrityWarningFilterOptions: getFilterOptions(
      state.contextualDataDefinitions.filters.filter(
        (x) => x.name === 'sample_integrity_warnings_id'
      ),
      state.searchPage.filters.contextual.selectedEnvironment
    ),
    optionsLoading: state.contextualDataDefinitions.isLoading,
    definitions_url: state.contextualDataDefinitions.definitions_url,
    scientific_manual_url: state.contextualDataDefinitions.scientific_manual_url,
    definitions: state.contextualDataDefinitions.values,
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      fetchContextualDataDefinitions,

      selectContextualFiltersMode,
      addContextualFilter,
      removeContextualFilter,
      selectContextualFilter,
      changeContextualFilterOperator,
      changeContextualFilterValue,
      changeContextualFilterValue2,
      changeContextualFilterValues,
      clearContextualFilters,

      selectSampleIntegrityWarningFiltersMode,
      checkSampleIntegrityWarningFilter,
      uncheckSampleIntegrityWarningFilter,
      addSampleIntegrityWarningFilter,
      removeSampleIntegrityWarningFilter,
      selectSampleIntegrityWarningFilter,
      changeSampleIntegrityWarningFilterOperator,
      changeSampleIntegrityWarningFilterValue,
      changeSampleIntegrityWarningFilterValue2,
      changeSampleIntegrityWarningFilterValues,
      clearSampleIntegrityWarningFilters,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ContextualFilterCard)
