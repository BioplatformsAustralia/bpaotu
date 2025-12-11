import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Modal, ModalBody, ModalHeader, ModalFooter } from 'reactstrap'

import BlastSearchCard from './blast_search_card'
import SearchFilters from './search_filters'

import { closeBlastModal, fetchBlastModalSamples } from '../reducers/blastSearchModalSlice'

import './blast_search_modal.css'

const BlastModal = () => {
  const dispatch = useDispatch()

  const { isOpen, isLoading, rowsCount } = useSelector(
    (state: any) => state.searchPage.blastSearchModal
  )

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchBlastModalSamples())
    }
  }, [isOpen, dispatch])

  const codeStyle: React.CSSProperties = {
    fontFamily: 'monospace',
  }

  return (
    <Modal
      isOpen={isOpen}
      data-tut="reactour__BlastModal"
      id="reactour__BlastModal"
      contentClassName="modalContentStyle"
    >
      <ModalHeader
        toggle={() => dispatch(closeBlastModal())}
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
        <SearchFilters handleSearchFilterClick={() => dispatch(fetchBlastModalSamples())} />
      </ModalFooter>
    </Modal>
  )
}

export default BlastModal
