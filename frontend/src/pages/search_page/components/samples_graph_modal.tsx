import React from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Modal, ModalBody, ModalHeader, ModalFooter, ButtonGroup, Button, UncontrolledTooltip} from 'reactstrap'
import SearchFilters from './search_filters'
import { fetchContextualDataForGraph } from '../../../reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from '../../../reducers/taxonomy_data_graph'
import GraphDashboard from './graph_dashboard';
import { closeSamplesGraphModal } from '../reducers/samples_graph_modal'
import Octicon from '../../../components/octicon'
import BPAOTUGraphTour from '../../../components/bpaotu_graph_tour'

class SamplesGraphModal extends React.Component<any> {

  public state = {
    tourStep: 0,
    scrollToSelected: '',
    tabSelected: 'tab_amplicon',
    showTabbedGraph: true
  }

  constructor(props) {
    super(props)
    this.handleSearchFilterClick = this.handleSearchFilterClick.bind(this)
  }

  public setTourStep(step) {
    if (step)
      this.setState({ tourStep: step })
  }

  public selectToScroll(selectedElement) {
      if(selectedElement)
          this.setState({ scrollToSelected: selectedElement })
  }

  public selectTab(selectedElement) {
    if(selectedElement)
        this.setState({ tabSelected: selectedElement })
  }

  public selectGraph(showTabbed) {
    this.setState({ showTabbedGraph: showTabbed })
  }

  public handleSearchFilterClick(selectedElement) {
    this.props.fetchContextualDataForGraph()
    this.props.fetchTaxonomyDataForGraph()
    this.selectToScroll(selectedElement)
  }

  componentDidMount() {
    this.selectToScroll('None')
    this.selectTab('tab_amplicon')
  }

  render() {
    return (
    <Modal isOpen={this.props.isOpen} scrollable={true} fade={true} data-tut="reactour__SamplesGraph" id="reactour__SamplesGraph">
      <ModalHeader toggle={this.props.closeSamplesGraphModal} data-tut="reactour__CloseSamplesGraphModal" id="reactour__CloseSamplesGraphModal">
        <div>
          <span>{'Interactive Graphical Search '}</span>
          <ButtonGroup size="sm" data-tut="reactour__graph_menu">
            <Button size="sm" id="reactour__graph_menu_tabbed" onClick={(e) => {this.selectGraph(true)}} active={this.state.showTabbedGraph}>
              <span id="tabbedGraphTab">
                <Octicon name="browser" /> Tabbed View
              </span>
              <UncontrolledTooltip target="tabbedGraphTab" placement="auto">
                  Show graph visualisation in tabbed view
              </UncontrolledTooltip>
            </Button>
            <Button size="sm" id="reactour__graph_menu_listed" onClick={(e) => {this.selectGraph(false)}} active={!this.state.showTabbedGraph}>
              <span id="listGraphTab">
                <Octicon name="server" /> List View
              </span>
              <UncontrolledTooltip target="listGraphTab" placement="auto">
                  Show graph visulisation in list view
              </UncontrolledTooltip>
            </Button>
            </ButtonGroup>
            <ButtonGroup size="sm" >
              <BPAOTUGraphTour tourStep={this.state.tourStep} setTourStep={(val) => { this.setTourStep(val) }}  />
          </ButtonGroup>
        </div>
      </ModalHeader>
      <ModalBody data-tut="reactour__graph_view" id="reactour__graph_view">
        <GraphDashboard
          showTabbedGraph={this.state.showTabbedGraph}
          scrollToSelected={this.state.scrollToSelected}
          selectToScroll={(e) => {this.selectToScroll(e)}}
          tabSelected={this.state.tabSelected}
          selectTab={(e) => {this.selectTab(e)}}
        />
      </ModalBody>
      <ModalFooter data-tut="reactour__graph_filter" id="reactour__graph_filter">
        <SearchFilters handleSearchFilterClick={this.handleSearchFilterClick} />
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
      fetchContextualDataForGraph,
      fetchTaxonomyDataForGraph
    },
    dispatch
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SamplesGraphModal)
