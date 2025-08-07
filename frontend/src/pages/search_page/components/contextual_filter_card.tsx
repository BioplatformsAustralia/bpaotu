import React, { useEffect } from 'react'
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
import EnvironmentFilter from './environment_filter'

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

const ContextualFilterCard = (props) => {
  const {
    addContextualFilter,
    changeContextualFilterOperator,
    changeContextualFilterValue,
    changeContextualFilterValue2,
    changeContextualFilterValues,
    changeSampleIntegrityWarningFilterOperator,
    changeSampleIntegrityWarningFilterValue,
    changeSampleIntegrityWarningFilterValue2,
    changeSampleIntegrityWarningFilterValues,
    checkSampleIntegrityWarningFilter,
    clearContextualFilters,
    contextualFilterOptions,
    contextualFilters,
    contextualFiltersMode,
    dataDefinitions,
    definitions,
    definitions_url,
    fetchContextualDataDefinitions,
    optionsLoading,
    removeContextualFilter,
    sampleIntegrityWarningFilterOptions,
    sampleIntegrityWarningFilters,
    scientific_manual_url,
    selectContextualFilter,
    selectContextualFiltersMode,
    selectSampleIntegrityWarningFilter,
    uncheckSampleIntegrityWarningFilter,
  } = props

  useEffect(() => {
    fetchContextualDataDefinitions()
  }, [fetchContextualDataDefinitions])

  return (
    <Card>
      <CardHeader tag="h5">
        <Row>
          <Col>Contextual Filters</Col>
          <Col className="text-right" xs="auto">
            <ContextualFilterLinkButton
              title="Download metadata description"
              url={definitions_url}
              tooltip="Download Metadata for Contextual Data fields including units, field descriptions and controlled vocabularies"
            />
            <ContextualFilterLinkButton
              title="Download methods manual"
              url={scientific_manual_url}
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
                      sampleIntegrityWarningFilters.find(
                        (fltr) => fltr.name === 'sample_integrity_warnings_id'
                      )
                        ? false
                        : true
                    }
                    onChange={(evt) =>
                      evt.target.checked
                        ? uncheckSampleIntegrityWarningFilter()
                        : checkSampleIntegrityWarningFilter()
                    }
                  />
                  {sampleIntegrityWarningFilters.find(
                    (fltr) => fltr.name === 'sample_integrity_warnings_id'
                  )
                    ? 'Check to show all data including samples with integrity warnings'
                    : 'Uncheck to remove samples with integrity warnings'}
                </Label>
              </FormGroup>
              {sampleIntegrityWarningFilters.map((fltr, index) => (
                <ContextualFilter
                  key={`${fltr.name}-${index}`}
                  index={index}
                  filter={fltr}
                  dataDefinition={find(dataDefinitions, (dd) => dd.name === fltr.name)}
                  options={sampleIntegrityWarningFilterOptions}
                  optionsLoading={optionsLoading}
                  remove={null}
                  select={selectSampleIntegrityWarningFilter}
                  changeOperator={changeSampleIntegrityWarningFilterOperator}
                  changeValue={changeSampleIntegrityWarningFilterValue}
                  changeValue2={changeSampleIntegrityWarningFilterValue2}
                  changeValues={changeSampleIntegrityWarningFilterValues}
                  definitions={definitions}
                />
              ))}
            </Alert>
          </Col>
        </Row>

        {contextualFilters.length >= 2 && (
          <Row>
            <Col sm={12}>
              <Alert color="secondary">
                <Form inline={true}>
                  Samples must match &nbsp;
                  <Input
                    type="select"
                    bsSize="sm"
                    value={contextualFiltersMode}
                    onChange={(evt) => selectContextualFiltersMode(evt.target.value)}
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

        {contextualFilters.map((fltr, index) => (
          <ContextualFilter
            key={`${fltr.name}-${index}`}
            index={index}
            filter={fltr}
            dataDefinition={find(dataDefinitions, (dd) => dd.name === fltr.name)}
            options={contextualFilterOptions}
            optionsLoading={optionsLoading}
            remove={removeContextualFilter}
            select={selectContextualFilter}
            changeOperator={changeContextualFilterOperator}
            changeValue={changeContextualFilterValue}
            changeValue2={changeContextualFilterValue2}
            changeValues={changeContextualFilterValues}
            definitions={definitions}
          />
        ))}
      </CardBody>
      <CardFooter className="text-center">
        <Button color="success" onClick={addContextualFilter}>
          Add
        </Button>
        <Button color="warning" onClick={clearContextualFilters}>
          Clear
        </Button>
      </CardFooter>
    </Card>
  )
}

const getFilterOptions = (filters, selectedEnvironment) =>
  filter(filters, doesFilterMatchEnvironment(selectedEnvironment))

const mapStateToProps = (state) => {
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

const mapDispatchToProps = (dispatch: any) => {
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
