import React from 'react';
import { find, filter } from 'lodash';
import { Container, Card, CardHeader, CardBody, Row, Col, UncontrolledTooltip} from 'reactstrap'
import Octicon from '../../../components/octicon'
import AnimateHelix from '../../../components/animate_helix'
import PieChartContextual from './charts/pie_chart_contextual'
import PieChartEnvironment from './charts/pie_chart_environment'
import PieChartAmplicon from './charts/pie_chart_amplicon'
import PieChartTraits from './charts/pie_chart_traits'
import HistogramChartContextual from './charts/histogram_chart_contextual'
import StackChartTaxonomy from './charts/stack_chart_taxonomy'
import StackChartTraits from './charts/stack_chart_traits'
import SunBurstChartTaxonomy from './charts/sunburst_chart_taxonomy';
import {AmpliconFilterInfo, TaxonomyFilterInfo, TaxonomyNoAmpliconInfo, TraitFilterInfo} from './amplicon_taxonomy_filter_card'
import {EnvironmentInfo} from './environment_filter'
import {ContextualFilterInfo} from './contextual_filter_card'


class GraphListed extends React.Component<any> {

    graphlist = filter(Object.keys(this.props.contextualGraphdata), val => val !== "am_environment_id") 
    public applyEnvironmentFilter(filterName) {
        const selectedEnvironment = this.props.selectedEnvironment && this.props.selectedEnvironment.value?""+this.props.selectedEnvironment.value:""
        const filter = find(this.props.optionscontextualFilter, def => def.name === filterName)
        const filterEnvironent = filter && filter.environment?""+filter.environment:""
        if (selectedEnvironment === "")
            return true
        else 
            return filterEnvironent === "" || filterEnvironent === selectedEnvironment
    }

    componentDidMount() {
        const el = document.getElementById(this.props.scrollToSelected)
        if (el) {
            setTimeout(() => {  el.scrollIntoView({block: 'end', behavior: 'smooth'}) }, 1000);
        }
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
                                        <PieChartAmplicon selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="amplicon" taxonomyGraphdata={this.props.taxonomyGraphdata.amplicon} />
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
                                                <SunBurstChartTaxonomy selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="taxonomy" taxonomyIsLoading={this.props.taxonomyIsLoading} contextualIsLoading={this.props.contextualIsLoading} taxonomyGraphdata={this.props.taxonomyGraphdata} contextualGraphdata={this.props.contextualGraphdata} />
                                                <StackChartTaxonomy selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="taxonomy_am_environment_id" taxonomyGraphdata={this.props.taxonomyGraphdata} contextualGraphdata={this.props.contextualGraphdata} />
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
                                                <PieChartTraits selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="traits" taxonomyGraphdata={this.props.taxonomyGraphdata.traits} />
                                                <StackChartTraits selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="taxonomy_am_environment_id" taxonomyGraphdata={this.props.taxonomyGraphdata} contextualGraphdata={this.props.contextualGraphdata} />
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
                                        Environment
                                        <span id="environmentTipGraphTab">
                                            <Octicon name="info" />
                                        </span>
                                        <UncontrolledTooltip target="environmentTipGraphTab" placement="auto">
                                            {EnvironmentInfo}
                                        </UncontrolledTooltip>
                                    </CardHeader>
                                    <CardBody>
                                    {(!this.props.taxonomyIsLoading) && (!this.props.contextualIsLoading) && (!this.props.taxonomy.kingdom.isDisabled) &&
                                        <>
                                            <PieChartEnvironment selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="am_environment_id" contextualGraphdata={this.props.contextualGraphdata} />
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
                                        Contextual Filters
                                        <span id="contextualFiltersTipGraphTab">
                                            <Octicon name="info" />
                                        </span>
                                        <UncontrolledTooltip target="contextualFiltersTipGraphTab" placement="auto">
                                            {ContextualFilterInfo}
                                        </UncontrolledTooltip>
                                    </CardHeader>
                                    <CardBody>
                                        {
                                            this.graphlist.map(graphName =>  
                                                this.applyEnvironmentFilter(graphName)
                                                ?
                                                    find(this.props.optionscontextualFilter, dd => dd.name === graphName && dd.type === "ontology")
                                                    ?
                                                    <PieChartContextual key={"pie"+graphName} width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter={graphName} contextualGraphdata={this.props.contextualGraphdata} />
                                                    :
                                                    <HistogramChartContextual key={"hist"+graphName} width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter={graphName} contextualGraphdata={this.props.contextualGraphdata} />
                                                :
                                                ""
                                            )
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

export default GraphListed
