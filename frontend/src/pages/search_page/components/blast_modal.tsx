import React, { useContext, useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Modal, ModalBody, ModalHeader, ModalFooter } from 'reactstrap'

// import { Tutorial, AMBLink, stepsStyle } from 'components/tutorial'
import { TourContext } from 'providers/tour_provider'
import BlastSearchCard from './blast_search_card'

import { closeBlastModal } from '../reducers/blast_modal'

import SearchFilters from './search_filters'

const BlastModal = (props) => {
  const { isOpen, closeBlastModal, fetchBlastModalSamples } = props

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

  // const steps = [
  //   {
  //     selector: '[data-tut="reactour__BlastModal"]',
  //     style: stepsStyle,
  //     content: () => {
  //       return (
  //         <div>
  //           <h4>BLAST search</h4>
  //           <p>TODO.</p>
  //           <p>TODO.</p>
  //           <p>
  //             For more information on the map <AMBLink text="see this page" />
  //           </p>
  //         </div>
  //       )
  //     },
  //     position: [60, 100],
  //   },
  // ]

  return (
    <Modal isOpen={isOpen} data-tut="reactour__BlastModal" id="reactour__BlastModal">
      <ModalHeader
        toggle={closeBlastModal}
        data-tut="reactour__CloseBlastModal"
        id="CloseBlastModal"
      >
        BLAST Search
      </ModalHeader>
      <ModalBody>
        <p>Explain blast search in general??</p>
        <BlastSearchCard />
      </ModalBody>
      <ModalFooter>
        <SearchFilters handleSearchFilterClick={fetchBlastModalSamples} />
      </ModalFooter>
    </Modal>
  )
}

const mapStateToProps = (state) => {
  const { isOpen } = state.searchPage.blastModal
  return {
    isOpen,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      closeBlastModal,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(BlastModal)
