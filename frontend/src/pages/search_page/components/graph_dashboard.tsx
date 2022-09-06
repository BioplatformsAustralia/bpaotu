import React from 'react';
import { isEmpty } from 'lodash'
import AnimateHelix from '../../../components/animate_helix'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fetchContextualDataForGraph } from '../../../reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from '../../../reducers/taxonomy_data_graph'
import GraphListed from './graph_listed';
import GraphTabbed from './graph_tabbed';
import { Alert } from 'reactstrap';

function chartEnabled(state) {
    return (
        (!isEmpty(state.taxonomyDataForGraph.graphdata)) &&
        (!state.taxonomyDataForGraph.isLoading) &&
        (!state.contextualDataForGraph.isLoading) &&
        (!state.searchPage.filters.taxonomyLoading))
}

class GraphDashboard extends React.Component<any> {

    componentDidMount() {
        this.props.fetchContextualDataForGraph()
        this.props.fetchTaxonomyDataForGraph()
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
                {this.props.chartEnabled
                    ?
                    <div>
                        {
                            (isEmpty(this.props.contextualGraphdata)) ?
                                <Alert color="warning">No matching samples</Alert>
                                :
                                (this.props.showTabbedGraph) ?
                                    <GraphTabbed
                                        selectedEnvironment={this.props.selectedEnvironment}
                                        optionsEnvironment={this.props.optionsEnvironment}
                                        optionscontextualFilter={this.props.optionscontextualFilter}
                                        contextualGraphdata={this.props.contextualGraphdata}
                                        taxonomyGraphdata={this.props.taxonomyGraphdata}
                                        tabSelected={this.props.tabSelected}
                                        selectTab={(e) => { this.props.selectTab(e) }}
                                        scrollToSelected={this.props.scrollToSelected}
                                        selectToScroll={(e) => { this.props.selectToScroll(e) }}

                                    />
                                    :
                                    <GraphListed
                                        selectedEnvironment={this.props.selectedEnvironment}
                                        optionscontextualFilter={this.props.optionscontextualFilter}
                                        contextualGraphdata={this.props.contextualGraphdata}
                                        taxonomyGraphdata={this.props.taxonomyGraphdata}
                                        scrollToSelected={this.props.scrollToSelected}
                                        selectToScroll={(e) => { this.props.selectToScroll(e) }}
                                        selectTab={(e) => { this.props.selectTab(e) }}
                                        data-tut="reactour__graph_listed"
                                    />
                        }
                    </div>
                    :
                    <div style={loadingstyle}>
                        <AnimateHelix />
                    </div>
                }
            </>
        )
    }
}

function mapStateToProps(state) {
    return {
        selectedEnvironment: state.searchPage.filters.contextual.selectedEnvironment,
        chartEnabled: chartEnabled(state),
        optionsEnvironment: state.contextualDataDefinitions.environment,
        optionscontextualFilter: state.contextualDataDefinitions.filters,
        contextualGraphdata: state.contextualDataForGraph.graphdata,
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
