import React from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Modal, ModalBody, ModalHeader, ModalFooter} from 'reactstrap'
import SearchFilters from './search_filters'
import GraphDashboard from './graph_dashboard';
import { closeSamplesGraphModal } from '../reducers/samples_graph_modal'

class SamplesGraphModal extends React.Component<any> {

  public state = {
    scrollToSelected: ''
  }

  public selectToScroll(selectedElement) {
      if(selectedElement)
          this.setState({ scrollToSelected: selectedElement })
  }

  render() {
    return (
    <Modal isOpen={this.props.isOpen} scrollable={true} fade={true} data-tut="reactour__SamplesGraph" id="reactour__SamplesGraph">
      <ModalHeader toggle={this.props.closeSamplesGraphModal} data-tut="reactour__CloseSamplesGraphModal" id="reactour__CloseSamplesGraphModal">Sample Graph Visualisation</ModalHeader>
      <ModalBody>
        <GraphDashboard scrollToSelected={this.state.scrollToSelected} selectToScroll={(e) => {this.selectToScroll(e)}} />
      </ModalBody>
      <ModalFooter>
        <SearchFilters selectToScroll={(e) => {this.selectToScroll(e)}} />
      </ModalFooter>
    </Modal>
    );
  }
}

function mapStateToProps(state) {
  const { isLoading, isOpen, markers, sample_otus } = state.searchPage.samplesGraphModal
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
      closeSamplesGraphModal,
    },
    dispatch
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SamplesGraphModal)
