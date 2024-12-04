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
import ComparisonDashboard from './comparison_dashboard'

import {
  sparseToJaccardMatrix,
  sparseToDense,
  getJaccardDistanceMatrix,
  getBrayCurtisDistanceMatrix,
  classicMDS,
} from './util/ordination'
import numeric from 'numeric'

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
  // const [filterOptions, setFilterOptions] = useState([])

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

  const isContinuous = selectedFilter != '' && !selectedFilter.endsWith('_id')

  console.log('SamplesComparisonModal', 'props', props)
  console.log('SamplesComparisonModal', 'plotData', plotData)
  console.log('SamplesComparisonModal', 'plotData[selectedMethod]', plotData[selectedMethod])

  const transformPlotData = (data, contextualFilters) => {
    // exclude null values (or maybe make size tiny?)
    const groupValues = Object.keys(data).filter((x) => x !== 'null')

    // is the selectedFilter discrete or continuous?
    const size = groupValues.map((key) => {
      return parseFloat(key)
    })

    const transformedData = groupValues.map((key) => {
      const keyData = data[key]
      const transformedKeyData = {}

      // Extract all properties dynamically
      const propsToKeep = ['x', 'y', 'text']
      keyData.forEach((item) => {
        Object.keys(item).forEach((prop) => {
          // add important props only
          if (propsToKeep.includes(prop)) {
            if (!transformedKeyData[prop]) {
              transformedKeyData[prop] = []
            }
            transformedKeyData[prop].push(item[prop])
          }
        })
      })

      const desired_maximum_marker_size = 40

      var marker = {}
      if (isContinuous) {
        marker = {
          color: '#abcdef', // make all same colour
          size: size,
          sizemode: 'area',
          sizeref: (2.0 * Math.max(...size)) / desired_maximum_marker_size ** 2,
        }
      }

      const findFilter = contextualFilters.find((x) => x.name === selectedFilter)
      let name
      if (findFilter) {
        const entry = findFilter.values.find((x) => parseInt(x[0]) === parseInt(key))
        name = entry[1]
        if (name === '') {
          name = 'N/A'
        }
      } else {
        name = key
      }

      return {
        ...transformedKeyData,
        name: name,
        type: 'scatter',
        mode: 'markers',
        marker: marker,
      }
    })

    return transformedData
  }

  const arrayifyData = (data) => {
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

        // add the value to text if a filter is selected
        // TODO make this look better
        if (key === 'text' && selectedFilter != '') {
          val = `${obj[selectedFilter]} (Sample ID: ${val})`
        }

        if (!transformedObject[key]) {
          transformedObject[key] = []
        }
        transformedObject[key].push(val)
      })
    })

    return transformedObject
  }

  const tooManyRowsError = !!abundanceMatrix.error

  var plotDataTransformed
  if (isContinuous) {
    const plotDataRestructured = arrayifyData(plotData[selectedMethod])

    plotDataTransformed = [
      {
        ...plotDataRestructured,
        // name: key,
        type: 'scatter',
        mode: 'markers',
      },
    ]

    // if data still needs to process then don't try to calculate everything
    if (isEmpty(plotDataRestructured)) {
      plotDataTransformed = []
    } else {
      const desiredMinimumMarkerSize = 20
      const desiredMaximumMarkerSize = 100
      const size = plotDataRestructured[selectedFilter]
      const maxDataValue = Math.max(...size)
      const minDataValue = Math.min(...size)
      const scaledSizes = size.map((value) => {
        const scaledValue = (value - minDataValue) / (maxDataValue - minDataValue)
        return (
          scaledValue * (desiredMaximumMarkerSize - desiredMinimumMarkerSize) +
          desiredMinimumMarkerSize
        )
      })

      plotDataTransformed[0]['marker'] = {
        size: scaledSizes,
        sizemode: 'area',
        sizeref: 0.5, // (2.0 * Math.max(...size)) / desiredMaximumMarkerSize ** 2,
      }
    }
  } else {
    const plotDataGrouped = groupBy(plotData[selectedMethod], selectedFilter)

    // // TODO use better way that includes groups with no entries for categories
    // const plotGroups = Object.keys(plotDataGrouped)
    // console.log('SamplesComparisonModal', 'plotGroups', plotGroups)

    // TODO sub in values from contextualFilters lookups

    plotDataTransformed = transformPlotData(plotDataGrouped, contextualFilters)
  }

  console.log('SamplesComparisonModal', 'plotDataTransformed', plotDataTransformed)
  console.log('SamplesComparisonModal', 'contextual', contextual)

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

  console.log('filterOptions', filterOptions)

  // contextualFilters

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
            data={plotDataTransformed}
            onClick={(e) => {
              const { points } = e
              // handlePointClick(points)
            }}
            layout={{
              width: chartWidth,
              height: chartHeight,
              title: 'MDS Plot',
              legend: { orientation: 'h' },
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
