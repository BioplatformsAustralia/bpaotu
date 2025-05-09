import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  Alert,
  Button,
  Container,
  Col,
  Row,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from 'reactstrap'
import RangeSlider from 'react-bootstrap-range-slider'
import SanitizedHTML from 'react-sanitized-html'
import {
  filterOptionsSubset,
  filterDataType,
  processContinuous,
  processDiscrete,
} from '../components/util/comparison'

import AnimateHelix from 'components/animate_helix'

import {
  clearPlotData,
  closeSamplesComparisonModal,
  runComparison,
  cancelComparison,
  setSelectedMethod,
  setSelectedFilter,
  setSelectedFilterExtra,
} from '../reducers/samples_comparison_modal'

import SearchFilters from './search_filters'

import Plot from 'react-plotly.js'

const comparisonStatusMapping = {
  init: 'Initialising',
  fetch: 'Fetching samples',
  fetched_to_df: 'Loading samples into dataframe',
  sort: 'Sorting samples',
  pivot: 'Pivoting data',
  calc_distances_bc: 'Calculating distance matrices (Bray-Curtis)',
  calc_distances_j: 'Calculating distance matrices (Jaccard)',
  calc_mds_bc: 'Calculating MDS points (Bray-Curtis)',
  calc_mds_j: 'Calculating MDS points (Jaccard)',
  contextual_start: 'Collating contextual data',
  complete: 'Complete',
}

const LoadingSpinnerOverlay = ({ status }) => {
  const loadingstyle = {
    display: 'flex',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    top: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 99999,
  } as React.CSSProperties

  return (
    <div style={loadingstyle}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <AnimateHelix />
        <div
          style={{
            display: 'inline-block',
            textAlign: 'center',
            margin: 12,
            padding: 6,
            background: 'white',
            width: '100%',
          }}
        >
          <>{comparisonStatusMapping[status] || 'Loading'}</>
        </div>
      </div>
    </div>
  )
}

const ErrorOverlay = ({ errors }) => {
  const loadingstyle = {
    display: 'flex',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    top: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 99999,
  } as React.CSSProperties

  return (
    <div style={loadingstyle}>
      <Alert color="danger">
        <h4 className="alert-heading">Error</h4>
        <ul>
          {errors.map((err, idx) => (
            <li key={idx}>
              <SanitizedHTML allowedTags={['b', 'br', 'em']} html={err} />
            </li>
          ))}
        </ul>
      </Alert>
      {/*</div>*/}
    </div>
  )
}

const SamplesComparisonModal = (props) => {
  const [markerSize, setMarkerSize] = useState(12)

  const chartWidth = window.innerWidth * 0.7
  const chartHeight = window.innerHeight * 0.7

  // console.log('SamplesComparisonModal', 'props', props)

  const {
    isOpen,
    isLoading,
    runComparison,
    cancelComparison,
    closeSamplesComparisonModal,

    selectedMethod,
    selectedFilter,
    selectedFilterExtra,
    setSelectedMethod,
    setSelectedFilter,
    setSelectedFilterExtra,

    clearPlotData,
    contextual,
    plotData,
    contextualFilters,
    comparisonStatus,
    // mem_usage,
    // timestamps,
    errors,
  } = props

  // console.log('SamplesComparisonModal', 'comparisonStatus', comparisonStatus)
  // console.log('SamplesComparisonModal', 'contextual', contextual)
  // console.log('SamplesComparisonModal', 'plotData', plotData)
  // console.log('SamplesComparisonModal', 'mem_usage', mem_usage)
  // console.log('SamplesComparisonModal', 'timestamps', timestamps)

  const selectedFilterObject = contextualFilters.find((x) => x.name === selectedFilter)

  // console.log('SamplesComparisonModal', 'selectedMethod', selectedMethod)
  // console.log('SamplesComparisonModal', 'selectedFilter', selectedFilter)
  // console.log('SamplesComparisonModal', 'selectedFilterObject', selectedFilterObject)
  // console.log('SamplesComparisonModal', 'selectedFilterExtra', selectedFilterExtra)

  const isError = errors && errors.length > 0
  const { isContinuous, isDate, isDiscrete } = filterDataType({
    selectedFilter,
    selectedFilterObject,
  })

  // Only show filter options that don't have null values for all samples
  const filterOptions = filterOptionsSubset(contextual, contextualFilters)

  // data is either continuous or not (i.e. discrete)
  // if discrete, then different possibilities (ontology, string, date) are handled separately within
  var plotDataTransformed
  if (isContinuous) {
    plotDataTransformed = processContinuous(plotData[selectedMethod], selectedFilter)
  } else {
    plotDataTransformed = processDiscrete(
      plotData[selectedMethod],
      contextualFilters,
      selectedFilter,
      selectedFilterObject,
      selectedFilterExtra,
      markerSize
    )
  }

  // console.log('SamplesComparisonModal', 'plotDataTransformed', plotDataTransformed)

  // Fetch data if the modal is opened
  useEffect(() => {
    if (isOpen) {
      // runComparison()
    }
  }, [isOpen])

  // Clear the plot if data is being refetched
  // Update the plot if fetching has finished
  useEffect(() => {
    if (isOpen) {
      if (isLoading) {
        clearPlotData()
      }
    }
  }, [isOpen, isLoading, clearPlotData])

  const plotHasData = plotData[selectedMethod] && plotData[selectedMethod].length > 0
  const showExtraControls = plotHasData

  // use jittered x, y values for plotting and original values for tooltip (using customdata)
  const plotDataTransformedTooltip = plotDataTransformed.map((z) => {
    return {
      ...z,
      x: z.xj,
      y: z.yj,
      showlegend: isDiscrete || isDate,
      customdata: z.x.map((xi, i) => {
        const point = {
          x: xi.toPrecision(7),
          y: z.y[i].toPrecision(7),
          xj: z.xj[i],
          yj: z.yj[i],
          text: z.text[i],
        }

        if (selectedFilter !== '') {
          // if a value key is provided (i.e. transformed date part), then use that
          // otherwise default to ordered value (for continuous) or name (for discrete)
          if (z.value) {
            // e.g. date
            point['value'] = z.value[i]
          } else if (z.name) {
            // e.g. other discrete
            point['value'] = z.name
          } else {
            // e.g. continuous
            point['value'] = z[selectedFilter][i]
          }
        }

        return point
      }),
      hovertemplate:
        // if no filter selected, there will be no value
        // so prevent referencing an undefined customdata.value in that case
        selectedFilter === ''
          ? '(%{customdata.x}, %{customdata.y})<br />Sample ID: %{customdata.text}<extra></extra>'
          : '(%{customdata.x}, %{customdata.y})<br />Sample ID: %{customdata.text}<br />Value: %{customdata.value}<extra></extra>',
    }
  })

  // console.log('SamplesComparisonModal', 'plotDataTransformedTooltip', plotDataTransformedTooltip)

  return (
    <Modal isOpen={isOpen} data-tut="reactour__SamplesComparison" id="reactour__SamplesComparison">
      <ModalHeader
        toggle={closeSamplesComparisonModal}
        data-tut="reactour__CloseSamplesComparisonModal"
        id="CloseSamplesComparisonModal"
      >
        Interactive Sample Comparison Search
        <div style={{ marginLeft: 30, display: 'inline-block' }}>
          {isLoading ? (
            <Button onClick={cancelComparison}>Cancel</Button>
          ) : (
            <Button onClick={runComparison} color="primary">
              Run Comparison
            </Button>
          )}
        </div>
      </ModalHeader>
      <ModalBody>
        {isError && <ErrorOverlay errors={errors} />}
        {isLoading && <LoadingSpinnerOverlay status={comparisonStatus} />}
        {/* controls layout is 2 rows, each in their own container, divided into 12 parts (set by xs prop) */}
        <Container>
          <Row>
            <Col xs="2">Dissimilarity method:</Col>
            <Col xs="4" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <select
                placeholder={'Select a method'}
                value={selectedMethod}
                onChange={(e) => {
                  setSelectedMethod(e.target.value)
                }}
              >
                <option value="braycurtis">Bray-Curtis</option>
                <option value="jaccard">Jaccard</option>
              </select>
            </Col>
            <Col xs="3">&nbsp;</Col>
            {showExtraControls && (
              <>
                <Col xs="2" style={{ textAlign: 'right' }}>
                  Samples:
                </Col>
                <Col xs="1" style={{ paddingLeft: '0px', textAlign: 'left' }}>
                  {plotData[selectedMethod].length}
                </Col>
              </>
            )}
          </Row>
        </Container>
        <Container style={{ paddingTop: 3 }}>
          <Row>
            <Col xs="2"></Col>
            <Col xs="4" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <select
                placeholder={'(Select a contextual filter)'}
                value={selectedFilter}
                onChange={(e) => {
                  setSelectedFilter(e.target.value)
                }}
              >
                <option value="">(Select a contextual filter)</option>
                {filterOptions.map((filterOption) => {
                  return (
                    <option
                      key={filterOption.value}
                      value={filterOption.value}
                      disabled={filterOption.disabled}
                    >
                      {filterOption.text}
                    </option>
                  )
                })}
              </select>
            </Col>
            {isDate ? (
              <>
                <Col xs="2" style={{ textAlign: 'right' }}>
                  Date grouping:
                </Col>
                <Col xs="1" style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <select
                    value={selectedFilterExtra}
                    onChange={(e) => setSelectedFilterExtra(e.target.value)}
                  >
                    {['year', 'season', 'month'].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Col>
              </>
            ) : (
              <>
                <Col xs="3">&nbsp;</Col>
              </>
            )}
            {showExtraControls && !isContinuous && (
              <>
                <Col xs="2" style={{ textAlign: 'right' }}>
                  Marker size:
                </Col>
                <Col xs="1" style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <RangeSlider
                    value={markerSize}
                    onChange={(changeEvent) => setMarkerSize(parseInt(changeEvent.target.value))}
                    min={5}
                    max={20}
                  />
                </Col>
              </>
            )}
          </Row>
        </Container>
        <Container style={{ width: '100%', maxWidth: chartWidth }}>
          <Plot
            data={plotDataTransformedTooltip}
            layout={{
              // width: chartWidth,
              height: chartHeight,
              title: 'MDS Plot',
              legend: { orientation: 'h' },
              xaxis: {
                tickmode: 'linear',
                tick0: 0,
                dtick: 0.2,
                range: plotHasData ? undefined : [-1, 1],
              },
              yaxis: {
                scaleanchor: 'x',
                tickmode: 'linear',
                tick0: 0,
                dtick: 0.2,
                range: plotHasData ? undefined : [-1, 1],
              },
            }}
            config={{ displayLogo: false, scrollZoom: false }}
            useResizeHandler
            style={{ width: '100%', height: '100%', marginTop: '0px' }}
          />
        </Container>
      </ModalBody>
      <ModalFooter>
        <SearchFilters static={true} handleSearchFilterClick={console.log} />
      </ModalFooter>
      {/*<Tutorial
        steps={steps}
        isOpen={isComparisonSubtourOpen}
        showCloseButton={false}
        showNumber={false}
        onRequestClose={() => {
          setIsComparisonSubtourOpen(false)
          setIsMainTourOpen(true)
          const node = document.getElementById('CloseSamplesComparisonModal')
          const closeButton = node.querySelector('.close')
          if (closeButton instanceof HTMLElement) {
            closeButton.click()
          }
        }}
        lastStepNextButton={'Back to Tutorial'}
      />*/}
    </Modal>
  )
}

const mapStateToProps = (state) => {
  const {
    isOpen,
    isLoading,
    isFinished,

    selectedMethod,
    setSelectedMethod,
    selectedFilter,
    setSelectedFilter,
    selectedFilterExtra,
    setSelectedFilterExtra,

    status,
    alerts,
    errors,
    submissions,
    results,
    plotData,
    // mem_usage,
    // timestamps,
  } = state.searchPage.samplesComparisonModal

  const { abundanceMatrix, contextual } = results

  return {
    isOpen,
    isLoading,
    isFinished,

    selectedMethod,
    setSelectedMethod,
    selectedFilter,
    setSelectedFilter,
    selectedFilterExtra,
    setSelectedFilterExtra,

    results,
    plotData,
    abundanceMatrix,
    contextual,

    contextualFilters: state.contextualDataDefinitions.filters,

    comparisonStatus: status,
    alerts,
    errors,
    submissions,
    // mem_usage,
    // timestamps,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      clearPlotData,
      closeSamplesComparisonModal,
      runComparison,
      cancelComparison,
      setSelectedMethod,
      setSelectedFilter,
      setSelectedFilterExtra,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SamplesComparisonModal)
