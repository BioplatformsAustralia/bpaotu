import React from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Modal, ModalBody, ModalHeader, ModalFooter, ButtonGroup, Button, UncontrolledTooltip} from 'reactstrap'
import SearchFilters from './search_filters'
import GraphDashboard from './graph_dashboard';
import GraphTabbed from './graph_tabbed';
import { closeSamplesGraphModal } from '../reducers/samples_graph_modal'
import Octicon from '../../../components/octicon'
class SamplesGraphModal extends React.Component<any> {

  public state = {
    scrollToSelected: '',
    showTabbedGraph: true
  }

  public selectToScroll(selectedElement) {
      if(selectedElement)
          this.setState({ scrollToSelected: selectedElement })
  }

  public selectGraph(showTabbed) {
        this.setState({ showTabbedGraph: showTabbed })
}

  render() {
    return (
    <Modal isOpen={this.props.isOpen} scrollable={true} fade={true} data-tut="reactour__SamplesGraph" id="reactour__SamplesGraph">
      <ModalHeader toggle={this.props.closeSamplesGraphModal} data-tut="reactour__CloseSamplesGraphModal" id="reactour__CloseSamplesGraphModal">
        <div>
          <span>{'Sample Graph Visualisation  '}</span>
          <ButtonGroup size="sm" >
            <Button onClick={(e) => {this.selectGraph(true)}} active={this.state.showTabbedGraph}>
              <span id="tabbedGraphTab">
                <Octicon name="browser" />
              </span>
              <UncontrolledTooltip target="tabbedGraphTab" placement="auto">
                  Show graph visualisation in tabbed view
              </UncontrolledTooltip>
            </Button>
            <Button onClick={(e) => {this.selectGraph(false)}} active={!this.state.showTabbedGraph}>
              <span id="listGraphTab">
                <Octicon name="server" />
              </span>
              <UncontrolledTooltip target="listGraphTab" placement="auto">
                  Show graph visulisation in list view
              </UncontrolledTooltip>
            </Button>
          </ButtonGroup>
        </div>
      </ModalHeader>
      <ModalBody>
        {
          (this.state.showTabbedGraph)
          ? 
          <GraphTabbed scrollToSelected={this.state.scrollToSelected} selectToScroll={(e) => {this.selectToScroll(e)}} />
          :
          <GraphDashboard scrollToSelected={this.state.scrollToSelected} selectToScroll={(e) => {this.selectToScroll(e)}} />
        }
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
