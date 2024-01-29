import React, { useState, useEffect, useContext } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  Container,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ButtonGroup,
  Button,
  UncontrolledTooltip,
} from 'reactstrap'

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

const SamplesComparisonModal = (props) => {
  const [tourStep, setTourStep] = useState(0)
  const [scrollToSelected, setScrollToSelected] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('jaccard')
  const [selectedSample, setSelectedSample] = useState<ModalSample>(initialModalSample)

  const [plotData, setPlotData] = useState([])

  console.log('props', props)
  console.log('selectedMethod', selectedMethod)

  const {
    isOpen,
    closeSamplesComparisonModal,
    fetchSampleComparisonModalSamples,
    processSampleComparisonModalSamples,
    isLoading,
    isProcessing,
    markers,
    sample_otus,
    abundance_matrix,
  } = props

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

  useEffect(() => {
    console.log('SamplesComparisonModal', 'useEffect', 'fetchSampleComparisonModalSamples')
    // fetchSampleComparisonModalSamples()
  }, [])

  // Clear the plot if data is being refetched
  useEffect(() => {
    if (isLoading) {
      setPlotData([])
    }
  }, [isLoading])

  // const handleStartProcessing = () => {
  //   const arg_data = abundance_matrix.matrix
  //   const arg_sample_ids = abundance_matrix.sample_ids

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
    const data = abundance_matrix.matrix
    const sample_ids = abundance_matrix.sample_ids
    const processedData =
      selectedMethod === 'jaccard'
        ? getJaccardDistanceMatrix(data, sample_ids)
        : getBrayCurtisDistanceMatrix(data, sample_ids)

    console.log('processedData', processedData)

    const mds = classicMDS(processedData.matrix, 2)
    console.log('mds', mds)

    const positions = numeric.transpose(mds)
    console.log('positions', positions)

    const plotData = processedData.samples.map((s, i) => {
      return { text: s, x: positions[0][i], y: positions[1][i] }
    })

    console.log('plotData', plotData)
    setPlotData(plotData)
  }

  const handlePointClick = (points) => {
    // just take the first point if there are multiple
    const point = points[0]
    const pointSampleId = point.text

    const sample = sample_otus.find((x) => x[2] === pointSampleId)
    setSelectedSample({
      id: sample[2],
      x: sample[0],
      y: sample[1],
    })
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
        <Container>
          <p>Dissimilarity method</p>
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
        </Container>
        <Container>
          <Button
            style={{ margin: 5, padding: 3 }}
            onClick={() => {
              fetchSampleComparisonModalSamples()
            }}
          >
            fetchSampleComparisonModalSamples {isLoading && 'Loading...'}
          </Button>
        </Container>
        <Container>
          <Button
            style={{ margin: 5, padding: 3 }}
            onClick={() => {
              console.log('props', props)
              console.log('markers', markers)
              console.log('sample_otus', sample_otus)
              console.log('abundance_matrix', abundance_matrix)
            }}
          >
            Debug
          </Button>
          <Button
            style={{ margin: 5, padding: 3 }}
            onClick={() => {
              // processSampleComparisonModalSamples()
              updatePlot()
            }}
          >
            Abundance to MDS
          </Button>
        </Container>
        <Container>{isProcessing && 'Processing'}</Container>
        <Container>
          <Plot
            data={[
              {
                x: plotData.map((i) => i.x),
                y: plotData.map((i) => i.y),
                text: plotData.map((i) => i.text),
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
  const { isLoading, isProcessing, isOpen, markers, sample_otus, abundance_matrix } =
    state.searchPage.samplesComparisonModal
  return {
    isLoading,
    isProcessing,
    isOpen,
    markers,
    sample_otus,
    abundance_matrix,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      closeSamplesComparisonModal,
      fetchSampleComparisonModalSamples,
      processSampleComparisonModalSamples,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SamplesComparisonModal)
