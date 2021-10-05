import React from 'react';
import AnimateHelix from '../../../components/animate_helix'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fetchContextualDataForGraph } from '../../../reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from '../../../reducers/taxonomy_data_graph'
import GraphListed from './graph_listed';
import GraphTabbed from './graph_tabbed';

class GraphDashboard extends React.Component<any> {

    componentDidMount() {
        this.props.fetchContextualDataForGraph()
        this.props.fetchTaxonomyDataForGraph()
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.props.contextualGraphdata !== nextProps.contextualGraphdata) {
            return true;
        }
        if (this.props.taxonomyGraphdata !== nextProps.taxonomyGraphdata) {
            return true;
        }
        if (this.props.showTabbedGraph !== nextProps.showTabbedGraph) {
            return true;
        }
        if (nextProps.tabSelected && this.props.tabSelected !== nextProps.tabSelected) {
            return true;
        }
        if (nextProps.scrollToSelected && this.props.scrollToSelected !== nextProps.scrollToSelected) {
            return true;
        }
        return false;
    }
  
    render() {
        const loadingstyle= {
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center'
        };
        
        return (
            <>
                {this.props.contextualIsLoading || this.props.taxonomyIsLoading
                    ? 
                    <div style={loadingstyle}>
                        <AnimateHelix />
                    </div>
                    :
                    <div data-tut="reactour__graph_view" id="reactour__graph_view">
                        {
                            (this.props.showTabbedGraph)
                            ?
                            <GraphTabbed 
                                selectedEnvironment={this.props.selectedEnvironment}
                                selectedAmplicon={this.props.selectedAmplicon}
                                selectedTrait={this.props.selectedTrait}
                                taxonomy={this.props.taxonomy}
                                optionsEnvironment={this.props.optionsEnvironment}
                                optionscontextualFilter={this.props.optionscontextualFilter}
                                contextualIsLoading={this.props.contextualIsLoading}
                                contextualGraphdata={this.props.contextualGraphdata}
                                taxonomyIsLoading={this.props.taxonomyIsLoading}
                                taxonomyGraphdata={this.props.taxonomyGraphdata}
                                fetchContextualDataForGraph={fetchContextualDataForGraph}
                                fetchTaxonomyDataForGraph={fetchTaxonomyDataForGraph}
                                tabSelected={this.props.tabSelected} 
                                selectTab={(e) => {this.props.selectTab(e)}}
                                scrollToSelected={this.props.scrollToSelected} 
                                selectToScroll={(e) => {this.props.selectToScroll(e)}} 
                                
                            />
                            :
                            <GraphListed 
                                selectedEnvironment={this.props.selectedEnvironment}
                                selectedAmplicon={this.props.selectedAmplicon}
                                selectedTrait={this.props.selectedTrait}
                                taxonomy={this.props.taxonomy}
                                optionsEnvironment={this.props.optionsEnvironment}
                                optionscontextualFilter={this.props.optionscontextualFilter}
                                contextualIsLoading={this.props.contextualIsLoading}
                                contextualGraphdata={this.props.contextualGraphdata}
                                taxonomyIsLoading={this.props.taxonomyIsLoading}
                                taxonomyGraphdata={this.props.taxonomyGraphdata}
                                fetchContextualDataForGraph={fetchContextualDataForGraph}
                                fetchTaxonomyDataForGraph={fetchTaxonomyDataForGraph}
                                scrollToSelected={this.props.scrollToSelected} 
                                selectToScroll={(e) => {this.props.selectToScroll(e)}}
                                tabSelected={this.props.tabSelected} 
                                selectTab={(e) => {this.props.selectTab(e)}}
                                data-tut="reactour__graph_listed"
                            />
                        }
                    </div>
                }
            </>          
        )
    }
}

function mapStateToProps(state) {
    return {
        selectedEnvironment: state.searchPage.filters.contextual.selectedEnvironment,
        selectedAmplicon:  state.searchPage.filters.selectedAmplicon,
        selectedTrait:  state.searchPage.filters.selectedTrait,
        taxonomy: state.searchPage.filters.taxonomy,
        optionsEnvironment: state.contextualDataDefinitions.environment,
        optionscontextualFilter: state.contextualDataDefinitions.filters,
        contextualIsLoading: state.contextualDataForGraph.isLoading,
        contextualGraphdata: state.contextualDataForGraph.graphdata,
        taxonomyIsLoading: state.taxonomyDataForGraph.isLoading,
        taxonomyGraphdata: state.taxonomyDataForGraph.graphdata,
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(
        {
            fetchContextualDataForGraph,
            fetchTaxonomyDataForGraph
        },
        dispatch
    )
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(GraphDashboard)
