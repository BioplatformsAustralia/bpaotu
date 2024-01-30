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
import { isEmpty } from 'lodash'

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

const initialPlotData: PlotData = {
  jaccard: [],
  braycurtis: [],
}

const SamplesComparisonModal = (props) => {
  const [tourStep, setTourStep] = useState(0)
  const [scrollToSelected, setScrollToSelected] = useState('')
  const [selectedSample, setSelectedSample] = useState<ModalSample>(initialModalSample)
  // const [plotData, setPlotData] = useState<PlotData>(initialPlotData)

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
    plotData,
  } = props

  console.log('SamplesComparisonModal', 'props', props)

  const handleSearchFilterClick = (selectedElement) => {
    fetchContextualDataForGraph()
    fetchTaxonomyDataForGraph()
    setScrollToSelected(selectedElement)
  }

  // const {
  //   isMainTourOpen,
  //   setIsMainTourOpen,
  //   mainTourStep,
  //   setMainTourStep,
  //   setIsComparisonTourOpen,
  //   isComparisonSubtourOpen,
  //   setIsComparisonSubtourOpen,
  // } = useContext(TourContext)
  //
  // useEffect(() => {
  //   if (isOpen) {
  //     if (isMainTourOpen) {
  //       setIsMainTourOpen(false)
  //       setIsComparisonSubtourOpen(true)
  //     }
  //   } else {
  //     if (isComparisonSubtourOpen) {
  //       setIsMainTourOpen(true)
  //       setIsComparisonSubtourOpen(false)
  //       setIsComparisonTourOpen(false)
  //       setMainTourStep(mainTourStep + 1)
  //     }
  //   }
  // }, [
  //   isOpen,
  //   isMainTourOpen,
  //   isComparisonSubtourOpen,
  //   setIsMainTourOpen,
  //   setIsComparisonTourOpen,
  //   setIsComparisonSubtourOpen,
  //   mainTourStep,
  //   setMainTourStep,
  // ])

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

  // const handleStartProcessing = () => {
  //   const arg_data = abundanceMatrix.matrix
  //   const arg_sample_ids = abundanceMatrix.sample_ids

  //   // Create a new Web Worker
  //   const calculationWorker = new Worker('./calculation.worker.js')

  //   // Set up event listeners to handle messages from the worker
  //   calculationWorker.addEventListener('message', (event) => {
  //     const { type, progress: workerProgress, result: workerResult, arg_data, arg_sample_ids } = event.data;

  //     if (type === 'progress') {
  //       // Update the progress in your React state
  //       setProgress(workerProgress * 100)
  //     } else if (type === 'result') {
  //       // Handle the final result
  //       setResult(workerResult)

  //       // Optionally, terminate the worker once the calculation is complete
  //       calculationWorker.terminate()
  //     }
  //   })

  //   // Start the calculation in the worker
  //   calculationWorker.postMessage({ totalSteps: totalSteps })
  // }

  const updatePlot = () => {
    console.log('updatePlot', 'selectedMethod', selectedMethod)
    if (plotData[selectedMethod].length) {
      // it should just update
      console.log(`Using cached ${selectedMethod} data`)
    } else {
      const data = abundanceMatrix.matrix
      const sample_ids = abundanceMatrix.sample_ids
      const processedData =
        selectedMethod === 'jaccard'
          ? getJaccardDistanceMatrix(data, sample_ids)
          : getBrayCurtisDistanceMatrix(data, sample_ids)

      // console.log('processedData', processedData)

      const mds = classicMDS(processedData.matrix, 2)
      const positions = numeric.transpose(mds)

      const newPlotData = processedData.samples.map((s, i) => {
        return { text: s, x: positions[0][i], y: positions[1][i] }
      })

      console.log('newPlotData', newPlotData)
      // setPlotData((prevState) => ({
      //   ...prevState,
      //   [selectedMethod]: newPlotData,
      // }))
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
        {isLoading && <LoadingSpinnerOverlay />}
        {isProcessing && <LoadingSpinnerOverlay />}
        <Container>
          <Row>
            <Col xs="auto">Dissimilarity method:</Col>
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
        <Container>
          <Plot
            data={[
              {
                x: plotData[selectedMethod].map((i) => i.x),
                y: plotData[selectedMethod].map((i) => i.y),
                text: plotData[selectedMethod].map((i) => i.text),
                type: 'scatter',
                mode: 'markers',
                marker: { color: 'red' },
              },
            ]}
            onClick={(e) => {
              const { points } = e
              handlePointClick(points)
            }}
            layout={{ width: 640, height: 480, title: 'MDS Plot' }}
            config={{ displayLogo: false, scrollZoom: false }}
          />
        </Container>
        <Container>
          {selectedSample.id && (
            <>
              <p>Sample Id: {selectedSample.id}</p>
              <p>x: {selectedSample.x}</p>
              <p>y: {selectedSample.y}</p>
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
    selectedMethod,
    plotData,
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
