import React, { useContext, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Modal, ModalBody, ModalHeader, ModalFooter } from 'reactstrap'

import type { RootState } from 'app/store'
import SamplesMap from 'components/samples_map'
import { Tutorial, AMBLink, stepsStyle } from 'components/tutorial'
import { TourContext } from 'providers/tour_provider'

import { closeSamplesMapModal, fetchSampleMapModalSamples } from '../reducers/samples_map_modal'

import SearchFilters from './search_filters'

const SamplesMapModal = () => {
  const dispatch = useDispatch()
  const { isOpen, isLoading, markers, sample_otus } = useSelector((state: RootState) => {
    const { isLoading, isOpen, markers, sample_otus } = state.searchPage.samplesMapModal
    return {
      isLoading,
      isOpen,
      markers,
      sample_otus,
    }
  })

  const {
    isMainTourOpen,
    setIsMainTourOpen,
    mainTourStep,
    setMainTourStep,
    isMapSubtourOpen,
    setIsMapSubtourOpen,
  } = useContext(TourContext)

  useEffect(() => {
    if (isOpen) {
      if (isMainTourOpen) {
        setIsMainTourOpen(false)
        setIsMapSubtourOpen(true)
      }
    } else {
      if (isMapSubtourOpen) {
        setIsMainTourOpen(true)
        setIsMapSubtourOpen(false)
        setMainTourStep(mainTourStep + 1)
      }
    }
  }, [
    isOpen,
    isMainTourOpen,
    isMapSubtourOpen,
    setIsMainTourOpen,
    setIsMapSubtourOpen,
    mainTourStep,
    setMainTourStep,
  ])

  const handleCloseModal = () => dispatch(closeSamplesMapModal())
  const handleFetchSamples = () => dispatch(fetchSampleMapModalSamples())

  const steps = [
    {
      selector: '[data-tut="reactour__SamplesMap"]',
      style: stepsStyle,
      content: () => {
        return (
          <div>
            <h4>Interactive map search</h4>
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
  ]

  return (
    <Modal isOpen={isOpen} data-tut="reactour__SamplesMap" id="reactour__SamplesMap">
      <ModalHeader
        toggle={handleCloseModal}
        data-tut="reactour__CloseSamplesMapModal"
        id="CloseSamplesMapModal"
      >
        Interactive Map Search
      </ModalHeader>
      <ModalBody>
        <SamplesMap
          fetchSamples={handleFetchSamples}
          isLoading={isLoading}
          isOpen={isOpen}
          markers={markers}
          sample_otus={sample_otus}
        />
      </ModalBody>
      <ModalFooter>
        <SearchFilters handleSearchFilterClick={handleFetchSamples} />
      </ModalFooter>
      <Tutorial
        steps={steps}
        isOpen={isMapSubtourOpen}
        showCloseButton={false}
        showNumber={false}
        onRequestClose={() => {
          setIsMapSubtourOpen(false)
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

export default SamplesMapModal
