import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  Button,
  Container,
  Col,
  Row,
  Input,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from 'reactstrap'
import { groupBy, isEmpty } from 'lodash'

import AnimateHelix from 'components/animate_helix'

import {
  closeSamplesComparisonModal,
  fetchSampleComparisonModalSamples,
  processSampleComparisonModalSamples,
  setSelectedMethod,
  clearPlotData,
} from '../reducers/samples_comparison_modal'

import {
  // clearBlastAlert,
  runComparison,
} from '../reducers/samples_comparison_search'

import SearchFilters from './search_filters'

import Plot from 'react-plotly.js'

interface ModalSample {
  id: number
  x: number
  y: number
}

interface PlotData {
  jaccard: object
  braycurtis: object
}

const SamplesComparisonModal = (props) => {
  const [selectedFilter, setSelectedFilter] = useState('')
  const [markerSize, setMarkerSize] = useState(12)

  const chartWidth = window.innerWidth * 0.7
  const chartHeight = window.innerHeight * 0.7

  const {
    isOpen,
    isLoading,
    isProcessing,
    closeSamplesComparisonModal,
    fetchSampleComparisonModalSamples,
    processSampleComparisonModalSamples,
    selectedMethod,
    setSelectedMethod,
    clearPlotData,
    // markers,
    // sampleOtus,
    abundanceMatrix,
    contextual,
    plotData,
    contextualFilters,
    comparisonStatus,
    comparisonResults,
    mem_usage,
    timestamps,
    error,
  } = props

  // console.log('SamplesComparisonModal', 'comparisonStatus', comparisonStatus)
  // console.log('SamplesComparisonModal', 'comparisonResults', comparisonResults)
  // console.log('SamplesComparisonModal', 'abundanceMatrix', abundanceMatrix)
  // console.log('SamplesComparisonModal', 'contextual', contextual)
  // console.log('SamplesComparisonModal', 'plotData', plotData)
  // console.log('SamplesComparisonModal', 'mem_usage', mem_usage)
  // console.log('SamplesComparisonModal', 'timestamps', timestamps)

  if (error) {
    console.log('SamplesComparisonModal', 'error', error)
  }

  const tooManyRowsError = !!abundanceMatrix.error
  const discreteFields = ['imos_site_code']
  const isContinuous =
    selectedFilter !== '' &&
    !selectedFilter.endsWith('_id') &&
    !discreteFields.includes(selectedFilter)

  const filterOptionKeys =
    Object.keys(contextual).length > 0 ? Object.keys(Object.values(contextual)[0]) : []

  // Filter keys that have null values for all samples
  const keysWithAllNullValues = filterOptionKeys.filter((key) => {
    // Check if all samples have null value for the current key
    return Object.values(contextual).every((sample) => sample[key] === null)
  })

  const filterOptionsSubset = filterOptionKeys.sort().map((x) => {
    const filter = contextualFilters.find((y) => y.name === x)

    if (filter) {
      const disabled = keysWithAllNullValues.includes(filter.name)
      if (filter.type !== 'sample_id') {
        return { value: filter.name, text: filter.display_name, disabled: disabled }
      } else {
        return null
      }
    } else {
      return null
    }
  })

  const filterOptions = filterOptionsSubset.filter((x) => x != null)

  // data will be an array of length 1
  // but the size for each of the points will be different
  const processContinuous = (data) => {
    const propsToKeep = ['x', 'y', 'text']
    const transformedObject = {}

    var dataToLoop
    var propsToLoop

    if (selectedFilter === '') {
      dataToLoop = data
      propsToLoop = propsToKeep
    } else {
      dataToLoop = data.filter((x) => x[selectedFilter] != null)
      propsToLoop = [...propsToKeep, selectedFilter]
    }

    dataToLoop.forEach((obj) => {
      propsToLoop.forEach((key) => {
        var val = obj[key]

        if (!transformedObject[key]) {
          transformedObject[key] = []
        }
        transformedObject[key].push(val)
      })
    })

    let plotDataContinuous

    // if data still needs to process then don't try to calculate everything
    if (isEmpty(transformedObject)) {
      plotDataContinuous = []
    } else {
      plotDataContinuous = [
        {
          ...transformedObject,
          type: 'scatter',
          mode: 'markers',
        },
      ]

      const desiredMinimumMarkerSize = 20
      const desiredMaximumMarkerSize = 100
      const size = transformedObject[selectedFilter]
      const maxDataValue = Math.max(...size)
      const minDataValue = Math.min(...size)
      const scaledSizes = size.map((value) => {
        const scaledValue = (value - minDataValue) / (maxDataValue - minDataValue)
        return (
          scaledValue * (desiredMaximumMarkerSize - desiredMinimumMarkerSize) +
          desiredMinimumMarkerSize
        )
      })

      plotDataContinuous[0]['marker'] = {
        size: scaledSizes,
        sizemode: 'area',
        sizeref: 0.5,
      }
    }

    return plotDataContinuous
  }

  // data will be an array with an element for each group that is displayed
  // also processes no filter selected
  const processDiscrete = (data, contextualFilters, selectedFilter) => {
    const plotDataGrouped = groupBy(data, selectedFilter)
    const groupValues = Object.keys(plotDataGrouped).filter((x) => x !== 'null')

    const transformedData = groupValues.map((key) => {
      const keyData = plotDataGrouped[key]
      const transformedKeyData = {}

      // extract all properties dynamically
      const propsToKeep = ['x', 'y', 'text']
      keyData.forEach((item) => {
        Object.keys(item).forEach((prop) => {
          if (propsToKeep.includes(prop)) {
            if (!transformedKeyData[prop]) {
              transformedKeyData[prop] = []
            }
            transformedKeyData[prop].push(item[prop])
          }
        })
      })

      const findFilter = contextualFilters.find((x) => x.name === selectedFilter)

      const isString = findFilter && findFilter.type === 'string'
      const isOntology = findFilter && findFilter.type === 'ontology'

      let name
      if (isString) {
        name = key
      } else if (isOntology) {
        if (findFilter) {
          const entry = findFilter.values.find((x) => parseInt(x[0]) === parseInt(key))
          name = entry[1]
          if (name === '') {
            name = 'N/A'
          }
        } else {
          name = key
        }
      }

      return {
        ...transformedKeyData,
        name: name,
        type: 'scatter',
        mode: 'markers',
        marker: { size: markerSize },
      }
    })

    return transformedData
  }

  var plotDataTransformed
  if (isContinuous) {
    plotDataTransformed = processContinuous(plotData[selectedMethod])
  } else {
    plotDataTransformed = processDiscrete(
      plotData[selectedMethod],
      contextualFilters,
      selectedFilter
    )
  }

  // desired format
  //
  // data={[
  //   {
  //     x: plotData[selectedMethod].slice(0, 23).map((i) => i.x),
  //     y: plotData[selectedMethod].slice(0, 23).map((i) => i.y),
  //     text: plotData[selectedMethod].slice(0, 23).map((i) => i.text),
  //     type: 'scatter',
  //     mode: 'markers',
  //     // color: 'env',
  //     // marker: { color: 'env' },
  //   },
  //   {
  //     x: plotData[selectedMethod].slice(23, 46).map((i) => i.x),
  //     y: plotData[selectedMethod].slice(23, 46).map((i) => i.y),
  //     text: plotData[selectedMethod].slice(23, 46).map((i) => i.text),
  //     type: 'scatter',
  //     mode: 'markers',
  //     // color: 'env',
  //     // marker: { color: 'env' },
  //   },
  // ]}

  // // Fetch data if the modal is opened
  // useEffect(() => {
  //   if (isOpen) {
  //     fetchSampleComparisonModalSamples()
  //   }
  // }, [isOpen])

  // Clear the plot if data is being refetched
  // Update the plot if fetching has finished
  useEffect(() => {
    if (isOpen) {
      if (isLoading) {
        clearPlotData()
      }
    }
  }, [isOpen, isLoading])

  useEffect(() => {
    if (isOpen) {
      updatePlotSafe()
    }
  }, [isOpen, abundanceMatrix])

  useEffect(() => {
    if (isOpen) {
      if (selectedMethod) {
        updatePlotSafe()
      }
    }
  }, [isOpen, selectedMethod])

  const updatePlotSafe = () => {
    if (!isEmpty(abundanceMatrix)) {
      processSampleComparisonModalSamples()
    }
  }

  const LoadingSpinnerOverlay = () => {
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
            {isLoading && <>Fetching Sample Information</>}
            {isProcessing && <>Calculating MDS Plot</>}
          </div>
        </div>
      </div>
    )
  }

  const ErrorOverlay = () => {
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
            Too many rows in search space, please change the search parameters
          </div>
        </div>
      </div>
    )
  }

  const showExtraControls = plotData[selectedMethod] && plotData[selectedMethod].length > 0

  // apply a jitter so that points aren't put on the same place (makes graph misleading)
  // need to put the original value in the tooltip though
  const jitterAmount = 0.005
  const plotDataTransformedJitter = plotDataTransformed.map((z) => {
    const xj = z.x.map((value) => value + (Math.random() * 2 - 1) * jitterAmount)
    const yj = z.y.map((value) => value + (Math.random() * 2 - 1) * jitterAmount)

    return {
      ...z,
      // Use jittered x, y values for plotting
      x: xj,
      y: yj,
      // Attach original x and y to custom data
      customdata: z.x.map((xi, i) => {
        const point = {
          x: xi.toPrecision(7),
          y: z.y[i].toPrecision(7),
          xj: xj[i],
          yj: yj[i],
          text: z.text[i],
        }

        if (selectedFilter !== '') {
          if (z.name) {
            point['value'] = z.name
          } else {
            // continuous
            point['value'] = z[selectedFilter][i]
          }
        }

        return point
      }),
      hovertemplate:
        // if no filter selected, there will be no value, so prevent referencing an undefined customdata.value in that case
        selectedFilter === ''
          ? '(%{customdata.x}, %{customdata.y})<br />Sample ID: %{customdata.text}<extra></extra>'
          : '(%{customdata.x}, %{customdata.y})<br />Sample ID: %{customdata.text}<br />Value: %{customdata.value}<extra></extra>',
    }
  })

  return (
    <Modal isOpen={isOpen} data-tut="reactour__SamplesComparison" id="reactour__SamplesComparison">
      <ModalHeader
        toggle={closeSamplesComparisonModal}
        data-tut="reactour__CloseSamplesComparisonModal"
        id="CloseSamplesComparisonModal"
      >
        Interactive Sample Comparison Search
      </ModalHeader>
      <ModalBody>
        {tooManyRowsError && <ErrorOverlay />}
        {isLoading && <LoadingSpinnerOverlay />}
        {isProcessing && <LoadingSpinnerOverlay />}
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
                <option value="jaccard">Jaccard</option>
                <option value="braycurtis">Bray-Curtis</option>
              </select>
            </Col>
            {showExtraControls && (
              <>
                <Col xs="2" style={{ textAlign: 'right' }}>
                  Samples:
                </Col>
                {plotData[selectedMethod].length}
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
            {showExtraControls && !isContinuous && (
              <>
                <Col xs="2" style={{ textAlign: 'right' }}>
                  Marker size:
                </Col>
                <select
                  value={markerSize}
                  onChange={(e) => setMarkerSize(parseInt(e.target.value))}
                >
                  {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((v) => {
                    return (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    )
                  })}
                </select>
              </>
            )}
          </Row>
        </Container>
        <Container>
          <Plot
            data={plotDataTransformedJitter}
            layout={{
              width: chartWidth,
              height: chartHeight,
              title: 'MDS Plot',
              legend: { orientation: 'h' },
              xaxis: {
                tickmode: 'linear',
                tick0: 0,
                dtick: 0.2,
                range: [-1, 1],
              },
              yaxis: {
                scaleanchor: 'x',
                tickmode: 'linear',
                tick0: 0,
                dtick: 0.2,
                range: [-1, 1],
              },
            }}
            config={{ displayLogo: false, scrollZoom: false }}
          />
        </Container>
        <Container
          style={{
            position: 'absolute',
            left: '10px',
            top: '20px',
            width: '300px',
            backgroundColor: '#eee',
          }}
        >
          <h6>Timestamps</h6>
          {timestamps && (
            <ul style={{ paddingLeft: 20 }}>
              {timestamps.map((obj, index) => {
                const [key, value] = Object.entries(obj)[0]
                const timestamp = Number(value) // Ensure value is a number
                const date = new Date(timestamp * 1000) // Convert to milliseconds
                const timeString =
                  date.toLocaleTimeString('en-GB', { hour12: false }) +
                  '.' +
                  String(date.getMilliseconds()).padStart(3, '0')
                return <li key={index}>{`${timeString} : ${key}`}</li>
              })}
            </ul>
          )}
          {error && (
            <div>
              <p style={{ color: 'red' }}>Error</p>
              <p style={{ color: 'red' }}>{error}</p>
            </div>
          )}
        </Container>
        <Container style={{ marginTop: -10 }}>
          <Row>
            <Col xs="3">
              <Button style={{ marginLeft: 20 }} onClick={props.runComparison}>
                GO (state: <b>{comparisonStatus})</b>
              </Button>
            </Col>
            <Col>
              {mem_usage && (
                <p>
                  {mem_usage.mem}
                  <br />
                  {mem_usage.swap}
                  <br />
                  {mem_usage.cpu}
                </p>
              )}
            </Col>
          </Row>
        </Container>
      </ModalBody>
      <ModalFooter>
        <SearchFilters handleSearchFilterClick={fetchSampleComparisonModalSamples} />
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
  const { isLoading, isProcessing, isOpen, markers, sampleOtus, selectedMethod, plotData } =
    state.searchPage.samplesComparisonModal

  const { abundanceMatrix, contextual } = state.searchPage.samplesComparisonSearch.results

  return {
    isLoading,
    isProcessing,
    isOpen,
    markers,
    sampleOtus,
    abundanceMatrix,
    contextual,
    selectedMethod,
    plotData: state.searchPage.samplesComparisonSearch.plotData,
    contextualFilters: state.contextualDataDefinitions.filters,
    comparisonStatus: state.searchPage.samplesComparisonSearch.status,
    comparisonResults: state.searchPage.samplesComparisonSearch.results,
    mem_usage: state.searchPage.samplesComparisonSearch.mem_usage,
    timestamps: state.searchPage.samplesComparisonSearch.timestamps,
    error: state.searchPage.samplesComparisonSearch.error,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      closeSamplesComparisonModal,
      fetchSampleComparisonModalSamples,
      processSampleComparisonModalSamples,
      setSelectedMethod,
      clearPlotData,
      runComparison,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SamplesComparisonModal)
