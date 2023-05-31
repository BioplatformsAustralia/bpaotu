import React, { useContext, useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Modal, ModalBody, ModalHeader, ModalFooter } from 'reactstrap'

import SamplesMap from 'components/samples_map'
import { Tutorial, AMBLink, stepsStyle } from 'components/tutorial'
import { TourContext } from 'providers/tour_provider'

import { closeSamplesMapModal, fetchSampleMapModalSamples } from '../reducers/samples_map_modal'

import SearchFilters from './search_filters'

const SamplesMapModal = (props) => {
  const {
    isOpen,
    closeSamplesMapModal,
    fetchSampleMapModalSamples,
    isLoading,
    markers,
    sample_otus,
  } = props

  const {
    isMainTourOpen,
    setIsMainTourOpen,
    mainTourStep,
    setMainTourStep,
    isMapTourOpen,
    setIsMapTourOpen,
  } = useContext(TourContext)

  useEffect(() => {
    if (isOpen) {
      if (isMainTourOpen) {
        setIsMainTourOpen(false)
        setIsMapTourOpen(true)
      }
    } else {
      if (isMapTourOpen) {
        setIsMainTourOpen(true)
        setIsMapTourOpen(false)
        setMainTourStep(mainTourStep + 1)
      }
    }
  }, [isOpen, isMainTourOpen, isMapTourOpen, setIsMainTourOpen, setIsMapTourOpen])

  const steps = [
    {
      selector: '[data-tut="reactour__SamplesMap"]',
      style: stepsStyle,
      content: () => {
        return (
          <div>
            <h4>View map visualisation</h4>
            <p>
              The map shows the location of samples, the number of samples per location, community
              richness, and a heat map of sequence abundance.
            </p>
            <p>You can toggle the features by selecting layers button on the right.</p>
            <p>
              For more information on the map <AMBLink text="see this page" />
            </p>
          </div>
        )
      },
      position: [60, 100],
    },
    // {
    //   selector: '[data-tut="reactour__CloseSamplesMapModal"]',
    //   style: stepsStyle,
    //   content: () => {
    //     return (
    //       <div>
    //         <h4>Close map view</h4>
    //         <p>Click close button to close Map View.</p>
    //       </div>
    //     )
    //   },
    // },
  ]

  return (
    <Modal isOpen={isOpen} data-tut="reactour__SamplesMap" id="reactour__SamplesMap">
      <ModalHeader
        toggle={closeSamplesMapModal}
        data-tut="reactour__CloseSamplesMapModal"
        id="CloseSamplesMapModal"
      >
        Interactive Map Search
      </ModalHeader>
      <ModalBody>
        <SamplesMap
          fetchSamples={fetchSampleMapModalSamples}
          isLoading={isLoading}
          isOpen={isOpen}
          markers={markers}
          sample_otus={sample_otus}
        />
      </ModalBody>
      <ModalFooter>
        <SearchFilters handleSearchFilterClick={fetchSampleMapModalSamples} />
      </ModalFooter>
      <Tutorial
        steps={steps}
        isOpen={isMapTourOpen}
        showCloseButton={false}
        showNumber={false}
        onRequestClose={() => {
          setIsMapTourOpen(false)
          setIsMainTourOpen(true)
          const node = document.getElementById('CloseSamplesMapModal')
          const closeButton = node.querySelector('.close')
          if (closeButton instanceof HTMLElement) {
            closeButton.click()
          }
        }}
        lastStepNextButton={'Back to Tutorial'}
      />
    </Modal>
  )
}

const mapStateToProps = (state) => {
  const { isLoading, isOpen, markers, sample_otus } = state.searchPage.samplesMapModal
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
      closeSamplesMapModal,
      fetchSampleMapModalSamples,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SamplesMapModal)
