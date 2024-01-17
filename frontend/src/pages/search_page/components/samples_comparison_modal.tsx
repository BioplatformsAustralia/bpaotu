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

import { closeSamplesComparisonModal } from '../reducers/samples_comparison_modal'

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
    fetchContextualDataForGraph,
    fetchTaxonomyDataForGraph,
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
    <Modal
      id="reactour__SamplesComparison"
      isOpen={isOpen}
      scrollable={true}
      fade={true}
      data-tut="reactour__SamplesComparison"
    >
      <ModalHeader
        id="CloseSamplesComparisonModal"
        toggle={closeSamplesComparisonModal}
        data-tut="reactour__CloseSamplesComparisonModal"
      >
        <span>Interactive Sample Comparison Search</span>
        <ButtonGroup
          size="sm"
          style={{ marginLeft: 16, marginRight: 16 }}
          data-tut="reactour__graph_menu"
        >
          <Button
            id="reactour__graph_menu_tabbed"
            size="sm"
            onClick={(e) => setShowTabbedComparison(true)}
            active={showTabbedComparison}
          >
            <TabIcon
              viewType="tabbed"
              octicon="browser"
              text="Tabbed View"
              tooltip="Show graph visualisation in tabbed view"
            />
          </Button>
          <Button
            id="reactour__graph_menu_listed"
            size="sm"
            onClick={(e) => setShowTabbedComparison(false)}
            active={!showTabbedComparison}
          >
            <TabIcon
              viewType="list"
              octicon="server"
              text="List View"
              tooltip="Show graph visulisation in list view"
            />
          </Button>
        </ButtonGroup>
        <ButtonGroup size="sm" style={{ marginTop: 8 }}>
          <ComparisonTutorial
            tourStep={tourStep}
            setTourStep={(val) => {
              setTourStep(val)
            }}
          />
        </ButtonGroup>
      </ModalHeader>
      <ModalBody data-tut="reactour__graph_view" id="reactour__graph_view">
        {isOpen && (
          <ComparisonDashboard
            showTabbedComparison={showTabbedComparison}
            scrollToSelected={scrollToSelected}
            selectedTab={selectedTab}
            selectToScroll={(e) => setScrollToSelected(e)}
            selectTab={(e) => setSelectedTab(e)}
          />
        )}
      </ModalBody>
      <ModalFooter id="reactour__graph_filter" data-tut="reactour__graph_filter">
        <SearchFilters handleSearchFilterClick={handleSearchFilterClick} />
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
        lastStepNextButton="Back to Tutorial"
      />*/}
    </Modal>
  )
}

const mapStateToProps = (state) => {
  const { isOpen } = state.searchPage.samplesComparisonModal
  return { isOpen }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      closeSamplesComparisonModal,
      fetchContextualDataForGraph,
      fetchTaxonomyDataForGraph,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SamplesComparisonModal)
