import React, { useState, useEffect, useContext } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
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
} from '../reducers/samples_comparison_modal'

import SearchFilters from './search_filters'
import ComparisonDashboard from './comparison_dashboard'

const TabIcon = ({ viewType, octicon, text, tooltip }) => {
  const id = viewType + 'ComparisonTab'

  return (
    <>
      <span id={id} style={{ paddingLeft: 3, paddingRight: 3 }}>
        <span style={{ paddingRight: 6 }}>
          <Octicon name={octicon} />
        </span>
        {text}
      </span>
      <UncontrolledTooltip target={id} placement="auto">
        {tooltip}
      </UncontrolledTooltip>
    </>
  )
}

const SamplesComparisonModal = (props) => {
  const [tourStep, setTourStep] = useState(0)
  const [scrollToSelected, setScrollToSelected] = useState('')
  const [selectedTab, setSelectedTab] = useState('tab_amplicon')
  const [showTabbedComparison, setShowTabbedComparison] = useState(true)

  console.log('props', props)

  const {
    isOpen,
    closeSamplesComparisonModal,
    fetchSampleComparisonModalSamples,
    isLoading,
    markers,
    sample_otus,
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
    setScrollToSelected('None')
    // setSelectedTab('tab_amplicon')
  }, [])

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
        isLoading={isLoading}
        isOpen={isOpen}
        markers={markers}
        sample_otus={sample_otus}
        fetchSamples={fetchSampleComparisonModalSamples}
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
  const { isLoading, isOpen, markers, sample_otus } = state.searchPage.samplesComparisonModal
  return {
    isLoading,
    isOpen,
    markers,
    sample_otus,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      closeSamplesComparisonModal,
      fetchSampleComparisonModalSamples,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SamplesComparisonModal)
