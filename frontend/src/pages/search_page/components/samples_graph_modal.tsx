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
import GraphTutorial from 'components/tutorials/graph_tutorial'
import { TourContext } from 'providers/tour_provider'
import { fetchContextualDataForGraph } from 'reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from 'reducers/taxonomy_data_graph'

import { closeSamplesGraphModal } from '../reducers/samples_graph_modal'

import SearchFilters from './search_filters'
import GraphDashboard from './graph_dashboard'

const TabIcon = ({ viewType, octicon, text, tooltip }) => {
  const id = viewType + 'GraphTab'

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

const SamplesGraphModal = (props) => {
  const [tourStep, setTourStep] = useState(0)
  const [scrollToSelected, setScrollToSelected] = useState('')
  const [selectedTab, setSelectedTab] = useState('tab_amplicon')
  const [showTabbedGraph, setShowTabbedGraph] = useState(true)

  const { isOpen, closeSamplesGraphModal, fetchContextualDataForGraph, fetchTaxonomyDataForGraph } =
    props

  const handleSearchFilterClick = (selectedElement) => {
    fetchContextualDataForGraph()
    fetchTaxonomyDataForGraph()
    setScrollToSelected(selectedElement)
  }

  const {
    isMainTourOpen,
    setIsMainTourOpen,
    mainTourStep,
    setMainTourStep,
    setIsGraphTourOpen,
    isShortGraphTourOpen,
    setIsShortGraphTourOpen,
  } = useContext(TourContext)

  useEffect(() => {
    if (isOpen) {
      if (isMainTourOpen) {
        setIsMainTourOpen(false)
        setIsShortGraphTourOpen(true)
      }
    } else {
      if (isShortGraphTourOpen) {
        setIsMainTourOpen(true)
        setIsShortGraphTourOpen(false)
        setIsGraphTourOpen(false)
        setMainTourStep(mainTourStep + 1)
      }
    }
  }, [
    isOpen,
    isMainTourOpen,
    isShortGraphTourOpen,
    setIsMainTourOpen,
    setIsGraphTourOpen,
    setIsShortGraphTourOpen,
    mainTourStep,
    setMainTourStep,
  ])

  useEffect(() => {
    setScrollToSelected('None')
    setSelectedTab('tab_amplicon')
  }, [])

  const steps = [
    {
      selector: '[data-tut="reactour__SamplesGraph"]',
      content: () => {
        return (
          <div>
            <h4>Show interactive graphical search</h4>
            <p>
              Other contextual data associated with the samples can be explored here. For example,
              look at the pH range of soils selected.
            </p>
            <p>
              Click the "Tutorial" link on the top of the interactive graph visualisation page at
              any time for more information. You do this now and resume the main tutorial when you
              are done, or come back to it at any time.
            </p>
          </div>
        )
      },
      style: stepsStyle,
      position: [60, 100],
    },
  ]

  return (
    <Modal
      id="reactour__SamplesGraph"
      isOpen={isOpen}
      scrollable={true}
      fade={true}
      data-tut="reactour__SamplesGraph"
    >
      <ModalHeader
        id="CloseSamplesGraphModal"
        toggle={closeSamplesGraphModal}
        data-tut="reactour__CloseSamplesGraphModal"
      >
        <span>Interactive Graphical Search</span>
        <ButtonGroup size="sm" style={{ marginLeft: 16 }} data-tut="reactour__graph_menu">
          <Button
            id="reactour__graph_menu_tabbed"
            size="sm"
            onClick={(e) => setShowTabbedGraph(true)}
            active={showTabbedGraph}
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
            onClick={(e) => setShowTabbedGraph(false)}
            active={!showTabbedGraph}
          >
            <TabIcon
              viewType="list"
              octicon="server"
              text="List View"
              tooltip="Show graph visulisation in list view"
            />
          </Button>
        </ButtonGroup>
        <ButtonGroup size="sm">
          <GraphTutorial
            tourStep={tourStep}
            setTourStep={(val) => {
              setTourStep(val)
            }}
          />
        </ButtonGroup>
      </ModalHeader>
      <ModalBody data-tut="reactour__graph_view" id="reactour__graph_view">
        {isOpen && (
          <GraphDashboard
            showTabbedGraph={showTabbedGraph}
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
      <Tutorial
        steps={steps}
        isOpen={isShortGraphTourOpen}
        showCloseButton={false}
        showNumber={false}
        onRequestClose={() => {
          setIsShortGraphTourOpen(false)
          setIsMainTourOpen(true)
          const node = document.getElementById('CloseSamplesGraphModal')
          const closeButton = node.querySelector('.close')
          if (closeButton instanceof HTMLElement) {
            closeButton.click()
          }
        }}
        lastStepNextButton="Back to Tutorial"
      />
    </Modal>
  )
}

const mapStateToProps = (state) => {
  const { isOpen } = state.searchPage.samplesGraphModal
  return { isOpen }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      closeSamplesGraphModal,
      fetchContextualDataForGraph,
      fetchTaxonomyDataForGraph,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SamplesGraphModal)
