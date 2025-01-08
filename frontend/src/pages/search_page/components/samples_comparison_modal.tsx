import React, { useState, useEffect, useContext } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  Container,
  Col,
  Row,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ButtonGroup,
  Button,
  UncontrolledTooltip,
} from 'reactstrap'
import { groupBy, sortBy, isEmpty } from 'lodash'

import AnimateHelix from 'components/animate_helix'
import Octicon from 'components/octicon'
import { Tutorial, stepsStyle } from 'components/tutorial'
import ComparisonTutorial from 'components/tutorials/comparison_tutorial'
import { TourContext } from 'providers/tour_provider'
import { fetchContextualDataForGraph } from 'reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from 'reducers/taxonomy_data_graph'

import {
  closeSamplesComparisonModal,
  fetchSampleComparisonModalSamples,
  processSampleComparisonModalSamples,
  setSelectedMethod,
  clearPlotData,
} from '../reducers/samples_comparison_modal'

import SearchFilters from './search_filters'

import Plot from 'react-plotly.js'

interface ModalSample {
  id: number
  x: number
  y: number
}

const initialModalSample: ModalSample = {
  id: null,
  x: null,
  y: null,
}

interface PlotData {
  jaccard: object
  braycurtis: object
}

const SamplesComparisonModal = (props) => {
  const [tourStep, setTourStep] = useState(0)
  const [scrollToSelected, setScrollToSelected] = useState('')
  const [selectedSample, setSelectedSample] = useState<ModalSample>(initialModalSample)

  const [selectedFilter, setSelectedFilter] = useState('')

  const chartWidth = window.innerWidth * 0.7
  const chartHeight = window.innerHeight * 0.7

  const {
    isOpen,
    closeSamplesComparisonModal,
    fetchSampleComparisonModalSamples,
    processSampleComparisonModalSamples,
    selectedMethod,
    setSelectedMethod,
    clearPlotData,
    isLoading,
    isProcessing,
    markers,
    sampleOtus,
    abundanceMatrix,
    contextual,
    plotData,
    contextualFilters,
  } = props

  const tooManyRowsError = !!abundanceMatrix.error
  const discreteFields = ['imos_site_code']
  const isContinuous =
    selectedFilter != '' &&
    !selectedFilter.endsWith('_id') &&
    !discreteFields.includes(selectedFilter)

  const findContextualFilter = contextualFilters.find((x) => x.name === selectedFilter)

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

    if (selectedFilter == '') {
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

      const desired_maximum_marker_size = 40
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
        marker: { size: 12 },
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

  const handleSearchFilterClick = (selectedElement) => {
    fetchContextualDataForGraph()
    fetchTaxonomyDataForGraph()
    setScrollToSelected(selectedElement)
  }

  // Fetch data if the modal is opened
  useEffect(() => {
    if (isOpen) {
      fetchSampleComparisonModalSamples()
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

  const handlePointClick = (points) => {
    // just take the first point if there are multiple
    const point = points[0]
    const pointSampleId = point.text

    const sample = sampleOtus.find((x) => x[2] === pointSampleId)
    setSelectedSample({
      id: sample[2],
      x: sample[0],
      y: sample[1],
    })
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
          text: z.text[i], // Sample ID:
        }

        // if (z.name) {
        //   point['name'] = z.name
        // }
        if (selectedFilter != '') {
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
        '(%{customdata.x}, %{customdata.y})<br />Sample ID: %{customdata.text}<br />Value: %{customdata.value}<extra></extra>',
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
            <Col xs="auto" style={{ paddingLeft: 0, paddingRight: 0 }}>
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
          </Row>
        </Container>
        <Container style={{ paddingTop: 3 }}>
          <Row>
            <Col xs="2"></Col>
            <Col xs="auto" style={{ paddingLeft: 0, paddingRight: 0 }}>
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
        <Container>
          {selectedSample.id && (
            <>
              <p>Sample Id: {selectedSample.id}</p>
              <p>x: {selectedSample.x}</p>
              <p>y: {selectedSample.y}</p>
              <p>Env: {contextual[selectedSample.id]['Am Environment']}</p>
            </>
          )}
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
  const {
    isLoading,
    isProcessing,
    isOpen,
    markers,
    sampleOtus,
    abundanceMatrix,
    contextual,
    selectedMethod,
    plotData,
  } = state.searchPage.samplesComparisonModal

  return {
    isLoading,
    isProcessing,
    isOpen,
    markers,
    sampleOtus,
    abundanceMatrix,
    contextual,
    selectedMethod,
    plotData,
    contextualFilters: state.contextualDataDefinitions.filters,
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
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SamplesComparisonModal)
