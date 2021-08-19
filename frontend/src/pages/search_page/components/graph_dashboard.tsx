import React from 'react';
import { find } from 'lodash';
import { Container, Card, CardHeader, CardBody, Row, Col, UncontrolledTooltip} from 'reactstrap'
import Octicon from '../../../components/octicon'
import AnimateHelix from '../../../components/animate_helix'
import PieChart from './charts/pie_chart'
import PieChartEnvironment from './charts/pie_chart_environment'
import PieChartAmplicon from './charts/pie_chart_amplicon'
import PieChartTraits from './charts/pie_chart_traits'
import HistogramChart from './charts/histogram_chart'
import StackChart from './charts/stack_chart'
import SunBurstChart from './charts/sunburst_chart';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fetchContextualDataForGraph } from '../../../reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from '../../../reducers/taxonomy_data_graph'
import {AmpliconFilterInfo, TaxonomyFilterInfo, TaxonomyNoAmpliconInfo, TraitFilterInfo} from './amplicon_taxonomy_filter_card'

class GraphDashboard extends React.Component<any> {

    scrollTo(elName){
        const el = document.getElementById(elName)
        if (el) {
            setTimeout(() => {  el.scrollIntoView({block: 'end', behavior: 'smooth'}) }, 1000);
        }
    }

    componentDidMount() {
        this.props.fetchContextualDataForGraph()
        this.props.fetchTaxonomyDataForGraph()
        this.props.selectToScroll('None')
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.props.contextualGraphdata !== nextProps.contextualGraphdata) {
            return true;
        }
        if (this.props.taxonomyGraphdata !== nextProps.taxonomyGraphdata) {
            return true;
        }
        return false;
    }
  
    componentDidUpdate() {
        this.scrollTo(this.props.scrollToSelected)
    }

    render() {
        const loadingstyle= {
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center'
        };
        
        let selectedEnvironmentOption = find(this.props.optionsEnvironment, (option) => String(option.id) === String(this.props.selectedEnvironment.value))
        selectedEnvironmentOption = selectedEnvironmentOption?selectedEnvironmentOption.name:selectedEnvironmentOption
        
        return (
            <>
                {this.props.contextualIsLoading || this.props.taxonomyIsLoading
                    ? 
                    <div style={loadingstyle}>
                        <AnimateHelix />
                    </div>
                    :
                    <Container fluid={true}>
                        <Row style={{marginBottom: '10px'}}>
                            <Col>
                                <Card>
                                    <CardHeader tag="h3">
                                        Amplicon
                                        <span id="ampliconTipGraph">
                                            <Octicon name="info" />
                                        </span>
                                        <UncontrolledTooltip target="ampliconTipGraph" placement="auto">
                                            {AmpliconFilterInfo}
                                        </UncontrolledTooltip>
                                        </CardHeader>
                                    <CardBody>
                                        <PieChartAmplicon selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="amplicon" taxonomyGraphdata={this.props.taxonomyGraphdata.amplicon} />
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                        <Row style={{marginBottom: '10px'}}>
                            <Col>
                                <Card>
                                    <CardHeader tag="h3">
                                        Taxonomy
                                        <span id="taxonomyTipGraph">
                                            <Octicon name="info" />
                                        </span>
                                        <UncontrolledTooltip target="taxonomyTipGraph" placement="auto">
                                            {TaxonomyFilterInfo}
                                        </UncontrolledTooltip>
                                    </CardHeader>
                                    <CardBody>
                                        {(!this.props.selectedAmplicon || this.props.selectedAmplicon.value === '') &&
                                            <p className="lead">{TaxonomyNoAmpliconInfo}</p>
                                        }
                                        {(!this.props.taxonomyIsLoading) && (!this.props.contextualIsLoading) && (!this.props.taxonomy.kingdom.isDisabled) &&
                                            <>
                                                <SunBurstChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="taxonomy_id" taxonomyIsLoading={this.props.taxonomyIsLoading} contextualIsLoading={this.props.contextualIsLoading} taxonomyGraphdata={this.props.taxonomyGraphdata} contextualGraphdata={this.props.contextualGraphdata} />
                                                <StackChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="amplicon_id" taxonomyGraphdata={this.props.taxonomyGraphdata} contextualGraphdata={this.props.contextualGraphdata} />
                                            </>
                                        } 
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                        <Row style={{marginBottom: '10px'}}>
                            <Col>
                                <Card>
                                    <CardHeader tag="h3">
                                        Traits
                                        <span id="traitsTipGraphTab">
                                            <Octicon name="info" />
                                        </span>
                                        <UncontrolledTooltip target="traitsTipGraphTab" placement="auto">
                                            {TraitFilterInfo}
                                        </UncontrolledTooltip>
                                    </CardHeader>
                                    <CardBody>
                                        {(!this.props.taxonomyIsLoading) && (!this.props.contextualIsLoading) && (!this.props.taxonomy.kingdom.isDisabled) &&
                                            <>
                                                <PieChartTraits selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="traits" taxonomyGraphdata={this.props.taxonomyGraphdata.traits} />
                                            </>
                                        } 
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                        <Row style={{marginBottom: '10px'}}>
                            <Col>
                                <Card>
                                    <CardHeader tag="h3">Contextual Filters</CardHeader>
                                    <CardBody>
                                        <PieChartEnvironment selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="am_environment_id" contextualGraphdata={this.props.contextualGraphdata} />
                                        {(this.props.selectedEnvironment.value === '' || selectedEnvironmentOption === 'Soil') && 
                                            <PieChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="vegetation_type_id" contextualGraphdata={this.props.contextualGraphdata} />
                                        }
                                        {(this.props.selectedEnvironment.value === '' || selectedEnvironmentOption === 'Marine') && 
                                            <PieChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="sample_type_id" contextualGraphdata={this.props.contextualGraphdata} />
                                        }
                                        {(this.props.selectedEnvironment.value === '' || selectedEnvironmentOption === 'Soil') && 
                                            <>
                                                <PieChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="env_broad_scale_id" contextualGraphdata={this.props.contextualGraphdata} />
                                                <PieChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="env_local_scale_id" contextualGraphdata={this.props.contextualGraphdata} />
                                                <HistogramChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="ph" contextualGraphdata={this.props.contextualGraphdata} />
                                                <HistogramChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="organic_carbon" contextualGraphdata={this.props.contextualGraphdata} />
                                                <HistogramChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="ammonium_nitrogen_wt" contextualGraphdata={this.props.contextualGraphdata} />
                                                <HistogramChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="nitrate_nitrogen" contextualGraphdata={this.props.contextualGraphdata} />
                                                <HistogramChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="phosphorus_colwell" contextualGraphdata={this.props.contextualGraphdata} />
                                                {(this.props.selectedEnvironment.value === '') && 
                                                        <PieChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="sample_type_id" contextualGraphdata={this.props.contextualGraphdata} />
                                                }
                                            </>
                                        }
                                        {
                                        (this.props.selectedEnvironment.value === '' || selectedEnvironmentOption === 'Marine') && 
                                            <>
                                                <HistogramChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="temp" contextualGraphdata={this.props.contextualGraphdata} />
                                                <HistogramChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="chlorophyll_ctd" contextualGraphdata={this.props.contextualGraphdata} />
                                                <HistogramChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="nitrate_nitrite" contextualGraphdata={this.props.contextualGraphdata} />
                                                <HistogramChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="nitrite" contextualGraphdata={this.props.contextualGraphdata} />
                                                <HistogramChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="salinity" contextualGraphdata={this.props.contextualGraphdata} />
                                                <HistogramChart selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="silicate" contextualGraphdata={this.props.contextualGraphdata} />
                                            </>
                                        }
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
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
