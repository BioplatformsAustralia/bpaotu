import React, { useRef, useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  Alert,
  Button,
  Container,
  Col,
  Input,
  Label,
  UncontrolledTooltip,
  Row,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from 'reactstrap'
import RangeSlider from 'react-bootstrap-range-slider'
import SanitizedHTML from 'react-sanitized-html'
import {
  comparisonStatusMapping,
  filterOptionsSubset,
  filterDataType,
  processContinuous,
  processDiscrete,
} from '../components/util/comparison'

import AnimateHelix from 'components/animate_helix'
import Octicon from 'components/octicon'

import {
  clearPlotData,
  closeSamplesComparisonModal,
  downloadDistanceMatrices,
  handleUmapParameters,
  resetUmapParameters,
  runComparison,
  cancelComparison,
  clearComparison,
  setSelectedMethod,
  setSelectedFilter,
  setSelectedFilterExtra,
} from '../reducers/samples_comparison_modal'

import SearchFilters from './search_filters'

import Plot from 'react-plotly.js'

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

  const inner = comparisonStatusMapping[status] || <>Loading</>

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
          {inner}
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
    </div>
  )
}

const popupStyle = {
  position: 'absolute',
  backgroundColor: 'rgb(244, 244, 244)',
  top: 0,
  left: 0,
  marginTop: '32px',
  borderRadius: '12px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
  padding: '12px 0px',
  zIndex: 10,
} as React.CSSProperties

const umapTooltipLookup = {
  n_neighbors: 'Controls how UMAP balances local versus global structure in the data',
  spread:
    'Controls the overall scale of the embedding; larger values result in more spread-out clusters',
  min_dist: 'Controls how tightly UMAP is allowed to pack points together',
}

const ParamControl = ({ param, value, tooltip, onChange, onKeyPress }) => {
  const variableLabelWidth = 8
  const variableInputWidth = 4

  const spanId = `${param}-tip`

  const labelDivStyle = {
    position: 'relative',
    marginTop: '8px',
    marginBottom: '8px',
  } as React.CSSProperties

  const labelStyle = {
    marginLeft: '8px',
    marginTop: '0.3rem',
  } as React.CSSProperties

  return (
    <>
      <Col xs={variableLabelWidth}>
        <div style={labelDivStyle}>
          <span id={spanId} style={{ cursor: 'pointer' }}>
            <Octicon name="info" />
          </span>
          <span style={labelStyle}>{param}</span>
          <UncontrolledTooltip target={spanId} placement="auto">
            {tooltip}
          </UncontrolledTooltip>
        </div>
      </Col>
      <Col xs={variableInputWidth}>
        <Input name={param} value={value} onChange={onChange} onKeyPress={onKeyPress} />
      </Col>
    </>
  )
}

const SamplesComparisonModal = (props) => {
  const umapParamsRef = useRef(null)
  const downloadOptionsRef = useRef(null)

  const [markerSize, setMarkerSize] = useState(12)
  const [showUmapParameters, setShowUmapParameters] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)

  const chartWidth = window.innerWidth * 0.7
  const chartHeight = window.innerHeight * 0.7

  const {
    isOpen,
    isLoading,
    isCancelled,
    runComparison,
    cancelComparison,
    clearComparison,
    closeSamplesComparisonModal,
    downloadDistanceMatrices,

    selectedMethod,
    selectedFilter,
    selectedFilterExtra,
    setSelectedMethod,
    setSelectedFilter,
    setSelectedFilterExtra,

    umapParams,
    handleUmapParameters,
    resetUmapParameters,

    contextualData,
    contextualFilters,
    plotData,
    clearPlotData,

    comparisonStatus,
    // mem_usage,
    // timestamps,
    errors,
    submissions,
  } = props

  const lastSubmission = submissions.slice(-1)[0]

  let submissionId
  if (lastSubmission) {
    submissionId = lastSubmission.submissionId
  }

  const selectedFilterObject = contextualFilters.find((x) => x.name === selectedFilter)

  const isError = errors && errors.length > 0
  const { isContinuous, isDate, isDiscrete } = filterDataType({
    selectedFilter,
    selectedFilterObject,
  })

  // Only show filter options that don't have null values for all samples
  const filterOptions = filterOptionsSubset(contextualData, contextualFilters)

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

  const handleClick = (e) => {
    // if umapParamsRef.current exists and the clicked target is NOT inside it
    if (umapParamsRef.current && !umapParamsRef.current.contains(e.target)) {
      setShowUmapParameters(false)
    }

    // if umapParamsRef.current exists and the clicked target is NOT inside it
    if (downloadOptionsRef.current && !downloadOptionsRef.current.contains(e.target)) {
      setShowDownloadOptions(false)
    }
  }

  const plotHasData = plotData[selectedMethod] && plotData[selectedMethod].length > 0
  const showDownloadControls = plotHasData
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
            // point might not have value
            if (z[selectedFilter][i]) {
              point['value'] = z[selectedFilter][i]
            } else {
              point['value'] = '(none)'
            }
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

  const renderControlButtons = () => {
    const showRunNewComparison = plotHasData
    const showRunComparison = !showRunNewComparison

    if (isLoading) {
      // if a different button is required
      if (showRunNewComparison) {
        return <Button onClick={cancelComparison}>Cancel</Button>
      } else {
        return <Button onClick={cancelComparison}>Cancel</Button>
      }
    }

    return (
      <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
        {showRunComparison && (
          <Button onClick={() => runComparison(umapParams)} color="primary">
            Run Comparison
          </Button>
        )}
        {showRunNewComparison && (
          <>
            <Button onClick={() => runComparison(umapParams, submissionId)} color="primary">
              Run New Comparison
            </Button>
            <Button onClick={clearComparison} color="link">
              Clear
            </Button>
          </>
        )}
      </div>
    )
  }

  const renderUmapControls = (umapParamsRef) => {
    const closeAndRun = () => {
      setShowUmapParameters(false)
      runComparison(umapParams, submissionId)
    }

    return (
      <div ref={umapParamsRef} style={{ ...popupStyle, ...{ width: '300px' } }}>
        <Container>
          {Object.keys(umapTooltipLookup).map((param) => (
            <Row key={param}>
              <ParamControl
                param={param}
                value={umapParams[param]}
                tooltip={umapTooltipLookup[param]}
                onChange={(e) => handleUmapParameters({ param, value: e.target.value })}
                onKeyPress={(e) => {
                  // Run if pressing enter
                  if (e.charCode === 13) {
                    closeAndRun()
                  }
                }}
              />
            </Row>
          ))}
          <Row>
            <Col style={{ marginTop: 10, textAlign: 'right' }}>
              <Button onClick={resetUmapParameters} size="sm" color="link">
                Reset to defaults
              </Button>
            </Col>
          </Row>
          <Row>
            <Col style={{ marginTop: 10, textAlign: 'right' }}>
              <Button onClick={closeAndRun} size="sm" color="primary">
                Run
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }

  const renderDownloadOptions = (downloadOptionsRef) => {
    const closeAndRun = () => {
      setShowUmapParameters(false)
      runComparison(umapParams, submissionId)
    }

    return (
      <div ref={downloadOptionsRef} style={{ ...popupStyle, ...{ width: '200px' } }}>
        <Container>
          <Row>
            <Col>
              <Button onClick={downloadDistanceMatrices} size="sm" color="link">
                Distance Matrices
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClick={handleClick}
      data-tut="reactour__SamplesComparison"
      id="reactour__SamplesComparison"
    >
      <ModalHeader
        toggle={closeSamplesComparisonModal}
        data-tut="reactour__CloseSamplesComparisonModal"
        id="CloseSamplesComparisonModal"
      >
        Interactive Sample Comparison Search
        <div style={{ marginLeft: 30, display: 'inline-block' }}>{renderControlButtons()}</div>
      </ModalHeader>
      <ModalBody>
        {isError && !isCancelled && <ErrorOverlay errors={errors} />}
        {isLoading && <LoadingSpinnerOverlay status={comparisonStatus} />}
        {/* controls layout is 2 rows, each in their own container, divided into 12 parts (set by xs prop) */}
        <Container>
          {/* 1st row of controls */}
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
                {/*<option value="jaccard">Jaccard</option>*/}
              </select>
            </Col>
            <Col xs="3"></Col>
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
        {/* 2nd row of controls */}
        <Container style={{ paddingTop: 3 }}>
          <Row>
            <Col xs="2"></Col>
            <Col xs="4" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <select
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
            ) : showExtraControls && !isContinuous ? (
              <>
                <Col xs="3">&nbsp;</Col>
                <Col xs="2" style={{ marginTop: 4, textAlign: 'right' }}>
                  Marker size:
                </Col>
                <Col xs="1" style={{ marginTop: 4, paddingLeft: 0, paddingRight: 0 }}>
                  <RangeSlider
                    value={markerSize}
                    tooltipPlacement="top"
                    onChange={(changeEvent) => setMarkerSize(parseInt(changeEvent.target.value))}
                    min={5}
                    max={20}
                  />
                </Col>
              </>
            ) : (
              <Col xs="6" style={{ marginTop: 18 }}>
                &nbsp;
              </Col>
            )}
          </Row>
        </Container>
        {/* 3rd row of controls */}
        <Container>
          <Row>
            <Col xs="2">UMAP parameters:</Col>
            <Col xs="4" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Button
                  onClick={() => setShowUmapParameters((prev) => !prev)}
                  color="secondary"
                  size="sm"
                >
                  View
                </Button>
                {showUmapParameters && renderUmapControls(umapParamsRef)}
              </div>
            </Col>
            <Col xs="3">&nbsp;</Col>
            {showDownloadControls ? (
              <>
                <Col xs="2" style={{ marginTop: 4, textAlign: 'right' }}>
                  &nbsp;
                </Col>
                <Col xs="1" style={{ marginTop: 4, paddingLeft: 0, paddingRight: 0 }}>
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Button
                      onClick={() => setShowDownloadOptions((prev) => !prev)}
                      color="secondary"
                      size="sm"
                    >
                      Download
                    </Button>
                    {showDownloadOptions && renderDownloadOptions(downloadOptionsRef)}
                  </div>
                </Col>
              </>
            ) : (
              <Col xs="3">&nbsp;</Col>
            )}
          </Row>
        </Container>

        <Container style={{ width: '100%', maxWidth: chartWidth, marginTop: '10px' }}>
          <Plot
            // clear plot when loading
            // (but don't reset the data, so if run is cancelled then previous data is returned)
            data={isLoading ? [] : plotDataTransformedTooltip}
            layout={{
              // width: chartWidth,
              height: chartHeight,
              margin: { l: 0, r: 0, b: 0, t: 0 },
              legend: { orientation: 'h' },
              paper_bgcolor: 'white',
              plot_bgcolor: 'white',
              xaxis: {
                showticklabels: false,
                showgrid: false,
                zeroline: false,
                tickmode: 'linear',
                tick0: 0,
                dtick: 0.2,
                range: plotHasData ? undefined : [-1, 1],
              },
              yaxis: {
                showticklabels: false,
                showgrid: false,
                zeroline: false,
                scaleanchor: 'x',
                tickmode: 'linear',
                tick0: 0,
                dtick: 0.2,
                range: plotHasData ? undefined : [-1, 1],
              },
              shapes: [
                {
                  type: 'rect',
                  xref: 'paper',
                  yref: 'paper',
                  x0: 0,
                  y0: 0,
                  x1: 1,
                  y1: 1,
                  line: {
                    color: 'black',
                    width: 2,
                  },
                  fillcolor: 'rgba(0,0,0,0)',
                  layer: 'above',
                },
              ],
            }}
            config={{ displayLogo: false, scrollZoom: false, displayModeBar: true }}
            useResizeHandler
            style={{
              width: '100%',
              height: '100%',
              marginTop: '0px',
            }}
          />
        </Container>
      </ModalBody>
      <ModalFooter>
        <SearchFilters static={true} handleSearchFilterClick={console.log} />
      </ModalFooter>
    </Modal>
  )
}

const mapStateToProps = (state) => {
  const {
    isOpen,
    isLoading,
    isFinished,
    isCancelled,

    selectedMethod,
    setSelectedMethod,
    selectedFilter,
    setSelectedFilter,
    selectedFilterExtra,
    setSelectedFilterExtra,

    umapParams,

    status,
    alerts,
    errors,
    submissions,
    contextualData,
    plotData,
    // mem_usage,
    // timestamps,
  } = state.searchPage.samplesComparisonModal

  return {
    isOpen,
    isLoading,
    isFinished,
    isCancelled,

    selectedMethod,
    setSelectedMethod,
    selectedFilter,
    setSelectedFilter,
    selectedFilterExtra,
    setSelectedFilterExtra,

    umapParams,

    contextualData,
    contextualFilters: state.contextualDataDefinitions.filters,
    plotData,

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
      downloadDistanceMatrices,
      handleUmapParameters,
      resetUmapParameters,
      runComparison,
      cancelComparison,
      clearComparison,
      setSelectedMethod,
      setSelectedFilter,
      setSelectedFilterExtra,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SamplesComparisonModal)
