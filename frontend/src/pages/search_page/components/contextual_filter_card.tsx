import React, { useEffect } from 'react'
import { filter, find } from 'lodash'
import { useAppDispatch, useAppSelector } from 'hooks/redux'
import type { RootState } from 'app/store'
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
        style={{
          cursor: 'pointer',
          margin: '0px 2px',
          paddingTop: '3px',
          paddingBottom: '0px'
        }}
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

const ContextualFilterCard = () => {
  const dispatch = useAppDispatch()
  const contextualFilters = useAppSelector(
    (state: RootState) => state.searchPage.filters.contextual.filters
  )
  const contextualFiltersMode = useAppSelector(
    (state: RootState) => state.searchPage.filters.contextual.filtersMode
  )
  const sampleIntegrityWarningFilters = useAppSelector(
    (state: RootState) => state.searchPage.filters.sampleIntegrityWarning.filters
  )
  const dataDefinitions = useAppSelector((state: RootState) => state.contextualDataDefinitions.filters)
  const optionsLoading = useAppSelector((state: RootState) => state.contextualDataDefinitions.isLoading)
  const definitions_url = useAppSelector(
    (state: RootState) => state.contextualDataDefinitions.definitions_url
  )
  const scientific_manual_url = useAppSelector(
    (state: RootState) => state.contextualDataDefinitions.scientific_manual_url
  )
  const contextualFilterOptions = useAppSelector((state: RootState) =>
    getFilterOptions(
      state.contextualDataDefinitions.filters.filter((x) => x.name !== 'sample_integrity_warnings_id'),
      state.searchPage.filters.contextual.selectedEnvironment
    )
  )
  const sampleIntegrityWarningFilterOptions = useAppSelector((state: RootState) =>
    getFilterOptions(
      state.contextualDataDefinitions.filters.filter(
        (x) => x.name === 'sample_integrity_warnings_id'
      ),
      state.searchPage.filters.contextual.selectedEnvironment
    )
  )

  const selectContextualFilterAction = (index: number, filterName: string) =>
    dispatch(selectContextualFilter(index, filterName))
  const removeContextualFilterAction = (index: number) => dispatch(removeContextualFilter(index))
  const changeContextualFilterOperatorAction = (index: number, operator: string) =>
    dispatch(changeContextualFilterOperator(index, operator))
  const changeContextualFilterValueAction = (index: number, value: any) =>
    dispatch(changeContextualFilterValue(index, value))
  const changeContextualFilterValue2Action = (index: number, value2: any) =>
    dispatch(changeContextualFilterValue2(index, value2))
  const changeContextualFilterValuesAction = (index: number, values: any[]) =>
    dispatch(changeContextualFilterValues(index, values))
  const changeSampleIntegrityWarningFilterOperatorAction = (index: number, operator: string) =>
    dispatch(changeSampleIntegrityWarningFilterOperator(index, operator))
  const changeSampleIntegrityWarningFilterValueAction = (index: number, value: any) =>
    dispatch(changeSampleIntegrityWarningFilterValue(index, value))
  const changeSampleIntegrityWarningFilterValue2Action = (index: number, value2: any) =>
    dispatch(changeSampleIntegrityWarningFilterValue2(index, value2))
  const changeSampleIntegrityWarningFilterValuesAction = (index: number, values: any[]) =>
    dispatch(changeSampleIntegrityWarningFilterValues(index, values))
  const checkSampleIntegrityWarningFilterAction = () => dispatch(checkSampleIntegrityWarningFilter())
  const uncheckSampleIntegrityWarningFilterAction = () => dispatch(uncheckSampleIntegrityWarningFilter())
  const clearContextualFiltersAction = () => dispatch(clearContextualFilters())
  const clearSampleIntegrityWarningFiltersAction = () => dispatch(clearSampleIntegrityWarningFilters())
  const selectContextualFiltersModeAction = (mode: string) =>
    dispatch(selectContextualFiltersMode(mode))
  const selectSampleIntegrityWarningFilterAction = (index: number, filterName: string) =>
    dispatch(selectSampleIntegrityWarningFilter(index, filterName))
  const addContextualFilterAction = () => dispatch(addContextualFilter())

  useEffect(() => {
    dispatch(fetchContextualDataDefinitions())
  }, [dispatch])

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
            <Alert color="secondary" fade={false}>
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
                        ? uncheckSampleIntegrityWarningFilterAction()
                        : checkSampleIntegrityWarningFilterAction()
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
                  dataDefinitions={dataDefinitions}
                  dataDefinition={find(dataDefinitions, (dd) => dd.name === fltr.name)}
                  options={sampleIntegrityWarningFilterOptions}
                  optionsLoading={optionsLoading}
                  remove={null}
                  select={selectSampleIntegrityWarningFilterAction}
                  changeOperator={changeSampleIntegrityWarningFilterOperatorAction}
                  changeValue={changeSampleIntegrityWarningFilterValueAction}
                  changeValue2={changeSampleIntegrityWarningFilterValue2Action}
                  changeValues={changeSampleIntegrityWarningFilterValuesAction}
                />
              ))}
            </Alert>
          </Col>
        </Row>

        {contextualFilters.length >= 2 && (
          <Row>
            <Col sm={12}>
              <Alert color="secondary" fade={false}>
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

        {contextualFilters.map((fltr, index) => {
          return (
            <ContextualFilter
              key={`${fltr.name}-${index}`}
              index={index}
              filter={fltr}
              dataDefinitions={dataDefinitions}
              dataDefinition={find(dataDefinitions, (dd) => dd.name === fltr.name)}
              options={contextualFilterOptions}
              optionsLoading={optionsLoading}
              remove={removeContextualFilterAction}
              select={selectContextualFilterAction}
              changeOperator={changeContextualFilterOperatorAction}
              changeValue={changeContextualFilterValueAction}
              changeValue2={changeContextualFilterValue2Action}
              changeValues={changeContextualFilterValuesAction}
            />
          )
        })}
      </CardBody>
      <CardFooter className="text-center">
        <Button color="success" onClick={addContextualFilterAction}>
          Add
        </Button>
        <Button color="warning" onClick={clearContextualFiltersAction}>
          Clear
        </Button>
      </CardFooter>
    </Card>
  )
}

const getFilterOptions = (filters, selectedEnvironment) =>
  filter(filters, doesFilterMatchEnvironment(selectedEnvironment))

export default ContextualFilterCard
