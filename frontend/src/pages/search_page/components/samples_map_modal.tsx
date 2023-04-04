import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { Modal, ModalBody, ModalHeader, ModalFooter } from 'reactstrap'
import SearchFilters from './search_filters'
import SamplesMap from '../../../components/samples_map'
import { closeSamplesMapModal, fetchSampleMapModalSamples } from '../reducers/samples_map_modal'

class SamplesMapModal extends React.Component<any> {
  render() {
    return (
      <Modal isOpen={this.props.isOpen} data-tut="reactour__SamplesMap" id="reactour__SamplesMap">
        <ModalHeader
          toggle={this.props.closeSamplesMapModal}
          data-tut="reactour__CloseSamplesMapModal"
          id="reactour__CloseSamplesMapModal"
        >
          Interactive Map Search
        </ModalHeader>
        <ModalBody>
          <SamplesMap
            fetchSamples={this.props.fetchSampleMapModalSamples}
            isLoading={this.props.isLoading}
            isOpen={this.props.isOpen}
            markers={this.props.markers}
            sample_otus={this.props.sample_otus}
          />
        </ModalBody>
        <ModalFooter>
          <SearchFilters handleSearchFilterClick={this.props.fetchSampleMapModalSamples} />
        </ModalFooter>
      </Modal>
    )
  }
}

function mapStateToProps(state) {
  const { isLoading, isOpen, markers, sample_otus } = state.searchPage.samplesMapModal
  return {
    isLoading,
    isOpen,
    markers,
    sample_otus,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      closeSamplesMapModal,
      fetchSampleMapModalSamples,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SamplesMapModal)
