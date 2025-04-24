import React, { useContext, useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Modal, ModalBody, ModalHeader, ModalFooter } from 'reactstrap'

// import { Tutorial, AMBLink, stepsStyle } from 'components/tutorial'
import { TourContext } from 'providers/tour_provider'
import BlastSearchCard from './blast_search_card'

import { closeBlastModal, fetchBlastModalSamples } from '../reducers/blast_modal'
import './blast_modal.css'

import SearchFilters from './search_filters'

const BlastModal = (props) => {
  const { isOpen, isLoading, rowsCount, closeBlastModal, fetchBlastModalSamples } = props

  const codeStyle = {
    fontFamily: 'monospace',
  } as React.CSSProperties

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

  useEffect(() => {
    if (isOpen) {
      fetchBlastModalSamples()
    }
  }, [isOpen])

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
    <Modal
      isOpen={isOpen}
      data-tut="reactour__BlastModal"
      id="reactour__BlastModal"
      contentClassName="modalContentStyle"
    >
      <ModalHeader
        toggle={closeBlastModal}
        data-tut="reactour__CloseBlastModal"
        id="CloseBlastModal"
      >
        BLAST Search
      </ModalHeader>
      <ModalBody>
        <p>
          The BLAST search tool implements a blastn search over sequences returned by the taxonomy
          search and contextual filters implemented. For best results, submit a query that spans
          only the amplicon region, or set <span style={codeStyle}>qcov_hsp_perc</span> to sensible
          value given your query sequence. We've set the default value to{' '}
          <span style={codeStyle}>60</span>, which will (for query length ~= amplicon length) omit
          usually unwanted short local alignments.
        </p>
        <p>
          The download provides: 1) the blast search details, 2) the blast table results, 3) a table
          with hit sequences, their match details, their locations and sample attributes, and 4) a
          map showing hit locations and sequence similarities.
        </p>
        <p>
          Note that the figure is sorted to plot the highest scoring points last, so any symbols
          occurring at the same location will only be visible as the highest scoring alignment
          value.
        </p>
        <BlastSearchCard isLoading={isLoading} rowsCount={rowsCount} />
      </ModalBody>
      <ModalFooter>
        <SearchFilters handleSearchFilterClick={fetchBlastModalSamples} />
      </ModalFooter>
    </Modal>
  )
}

const mapStateToProps = (state) => {
  const { isOpen, isLoading, rowsCount } = state.searchPage.blastModal
  return {
    isOpen,
    isLoading,
    rowsCount,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      closeBlastModal,
      fetchBlastModalSamples,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(BlastModal)
