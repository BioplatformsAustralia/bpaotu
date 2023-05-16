import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Modal, ModalBody, ModalHeader, ModalFooter } from 'reactstrap'

import SamplesMap from 'components/samples_map'

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

  return (
    <Modal isOpen={isOpen} data-tut="reactour__SamplesMap" id="reactour__SamplesMap">
      <ModalHeader
        toggle={closeSamplesMapModal}
        data-tut="reactour__CloseSamplesMapModal"
        id="reactour__CloseSamplesMapModal"
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
