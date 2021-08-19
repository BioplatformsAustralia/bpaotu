import React from 'react';
import { find } from 'lodash';
import { TabContent, TabPane, Nav, NavItem, NavLink, UncontrolledTooltip} from 'reactstrap'
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
import {EnvironmentInfo} from './environment_filter'
import classnames from 'classnames'


class ContextualTab extends React.Component<any>  {

    tablist = ["vegetation_type_id","sample_type_id","env_broad_scale_id","env_local_scale_id","ph","organic_carbon","ammonium_nitrogen_wt","nitrate_nitrogen","phosphorus_colwell","temp","chlorophyll_ctd","nitrate_nitrite","nitrite","salinity","silicate"]
    
    state = {
        activeTab: this.tablist.includes(this.props.scrollToSelected)?"tab_"+this.props.scrollToSelected:(this.props.selectedEnvironmentOption === 'Marine'?'tab_sample_type_id':'tab_vegetation_type_id')
    };
    
    toggle = tab => {
        if (this.state.activeTab !== tab) {
            this.setState({
                activeTab: tab,
            })
        }
    }

    render() {
      return (
        <>
            <Nav tabs>
                {this.props.selectedEnvironmentOption !== 'Marine' &&
                <>
                <NavItem>
                    <NavLink>
                        {'            '}
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_vegetation_type_id' })}
                        onClick={() => { this.toggle('tab_vegetation_type_id'); }}
                    >
                        Vegetation Type
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_env_broad_scale_id' })}
                        onClick={() => { this.toggle('tab_env_broad_scale_id'); }}
                    >
                        Broad Land Use
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_env_local_scale_id' })}
                        onClick={() => { this.toggle('tab_env_local_scale_id'); }}
                    >
                        Local Land Use
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_ph' })}
                        onClick={() => { this.toggle('tab_ph'); }}
                    >
                        pH
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_organic_carbon' })}
                        onClick={() => { this.toggle('tab_organic_carbon'); }}
                    >
                        Carbon
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_ammonium_nitrogen_wt' })}
                        onClick={() => { this.toggle('tab_ammonium_nitrogen_wt'); }}
                    >
                        Ammonium Nitrogen
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_nitrate_nitrogen' })}
                        onClick={() => { this.toggle('tab_nitrate_nitrogen'); }}
                    >
                        Nitrate Nitrogen
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_phosphorus_colwell' })}
                        onClick={() => { this.toggle('tab_phosphorus_colwell'); }}
                    >
                        Phosphorus
                    </NavLink>
                </NavItem>
                </>
                }
                {this.props.selectedEnvironmentOption !== 'Soil' &&
                <>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_sample_type_id' })}
                        onClick={() => { this.toggle('tab_sample_type_id'); }}
                    >
                        Sample Type
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_temp' })}
                        onClick={() => { this.toggle('tab_temp'); }}
                    >
                        Temperature
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_nitrate_nitrite' })}
                        onClick={() => { this.toggle('tab_nitrate_nitrite'); }}
                    >
                        Nitrate Nitrite
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_nitrite' })}
                        onClick={() => { this.toggle('tab_nitrite'); }}
                    >
                        Nitritie
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_chlorophyll_ctd' })}
                        onClick={() => { this.toggle('tab_chlorophyll_ctd'); }}
                    >
                        Chlorophyll
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_salinity' })}
                        onClick={() => { this.toggle('tab_salinity'); }}
                    >
                        Salinity
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: this.state.activeTab === 'tab_silicate' })}
                        onClick={() => { this.toggle('tab_silicate'); }}
                    >
                        Silicate
                    </NavLink>
                </NavItem>
                </>
                }
            </Nav>
            <TabContent activeTab={this.state.activeTab}>
                {this.props.selectedEnvironmentOption !== 'Marine' &&
                <>
                <TabPane tabId="tab_vegetation_type_id">
                    <PieChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="vegetation_type_id" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_env_broad_scale_id">
                    <PieChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="env_broad_scale_id" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_env_local_scale_id">
                    <PieChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="env_local_scale_id" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_ph">
                    <HistogramChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="ph" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_organic_carbon">
                    <HistogramChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="organic_carbon" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_ammonium_nitrogen_wt">
                    <HistogramChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="ammonium_nitrogen_wt" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_nitrate_nitrogen">
                    <HistogramChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="nitrate_nitrogen" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_phosphorus_colwell">
                    <HistogramChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="phosphorus_colwell" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                </>
                }
                {this.props.selectedEnvironmentOption !== 'Soil' && 
                <>
                <TabPane tabId="tab_sample_type_id">
                    <PieChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="sample_type_id" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_temp">
                    <HistogramChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="temp" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_nitrate_nitrite">
                    <HistogramChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="nitrate_nitrite" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_nitrite">
                    <HistogramChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="nitrite" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_chlorophyll_ctd">
                    <HistogramChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="chlorophyll_ctd" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_salinity">
                    <HistogramChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="salinity" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_silicate">
                    <HistogramChart width={this.props.chartWidth} height={this.props.chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="silicate" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                </>
                }
            </TabContent> 
        </>
      )
    }
  }

class GraphTabbed extends React.Component<any> {

    state = {
        activeTab: 'tabAmplicon'
    };

    toggle = tab => {
        if (this.state.activeTab !== tab) {
            this.setState({
                activeTab: tab,
            })
        }
    }

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
        if (nextState.activeTab && this.state.activeTab !== nextState.activeTab) {
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
        const chartWidth = window.innerWidth*.90
        const chartHeight = window.innerHeight*.70
        
        let selectedEnvironmentOption = find(this.props.optionsEnvironment, (option) => String(option.id) === String(this.props.selectedEnvironment.value))
        selectedEnvironmentOption = selectedEnvironmentOption?selectedEnvironmentOption.name:""

        return (
            <>
                {this.props.contextualIsLoading || this.props.taxonomyIsLoading
                    ? 
                    <div style={loadingstyle}>
                        <AnimateHelix />
                    </div>
                    :
                    <div style={{margin: '0px -15px'}}>
                        <Nav tabs>
                            <NavItem>
                                <NavLink>
                                    {'      '}
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: this.state.activeTab === 'tabAmplicon' })}
                                    onClick={() => { this.toggle('tabAmplicon'); }}
                                >
                                    {'Amplicon '}
                                    <span id="ampliconTipGraphTab">
                                            <Octicon name="info" align="top" />
                                    </span>
                                    <UncontrolledTooltip target="ampliconTipGraphTab" placement="auto">
                                        {AmpliconFilterInfo}
                                    </UncontrolledTooltip>
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: this.state.activeTab === 'tabTaxonomy' })}
                                    onClick={() => { this.toggle('tabTaxonomy'); }}
                                >
                                    {'Taxonomy '}
                                    <span id="taxonomyTipGraphTab">
                                            <Octicon name="info" align="top" />
                                    </span>
                                    <UncontrolledTooltip target="taxonomyTipGraphTab" placement="auto">
                                        {TaxonomyFilterInfo}
                                    </UncontrolledTooltip>
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: this.state.activeTab === 'tabTraits' })}
                                    onClick={() => { this.toggle('tabTraits'); }}
                                >
                                    {'Traits '}
                                    <span id="traitsTipGraphTab">
                                            <Octicon name="info" align="top" />
                                    </span>
                                    <UncontrolledTooltip target="traitsTipGraphTab" placement="auto">
                                        {TraitFilterInfo}
                                    </UncontrolledTooltip>
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: this.state.activeTab === 'tabEnvironment' })}
                                    onClick={() => { this.toggle('tabEnvironment'); }}
                                >
                                    {'Environment '}
                                    <span id="environmentTipGraphTab">
                                            <Octicon name="info" align="top" />
                                    </span>
                                    <UncontrolledTooltip target="environmentTipGraphTab" placement="auto">
                                        {EnvironmentInfo}
                                    </UncontrolledTooltip>
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: this.state.activeTab === 'tabContextual' })}
                                    onClick={() => { this.toggle('tabContextual'); }}
                                >
                                    Contextual Filters
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: this.state.activeTab === 'tabTaxonomyEnvironment' })}
                                    onClick={() => { this.toggle('tabTaxonomyEnvironment'); }}
                                >{'Taxonomy vs Environment'}
                                </NavLink>
                            </NavItem>
                        </Nav>
                        <TabContent activeTab={this.state.activeTab}>
                            <TabPane tabId="tabAmplicon">
                                <PieChartAmplicon width={chartWidth} height={chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="amplicon" taxonomyGraphdata={this.props.taxonomyGraphdata.amplicon} />
                            </TabPane>
                            <TabPane tabId="tabTaxonomy">
                                {(!this.props.selectedAmplicon || this.props.selectedAmplicon.value === '') &&
                                    <p className="lead">{TaxonomyNoAmpliconInfo}</p>
                                }
                                {(!this.props.taxonomyIsLoading) && (!this.props.contextualIsLoading) && (!this.props.taxonomy.kingdom.isDisabled) &&
                                    <>
                                        <SunBurstChart width={chartWidth} height={chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="taxonomy_id" taxonomyIsLoading={this.props.taxonomyIsLoading} contextualIsLoading={this.props.contextualIsLoading} taxonomyGraphdata={this.props.taxonomyGraphdata} contextualGraphdata={this.props.contextualGraphdata} />
                                    </>
                                } 
                            </TabPane>
                            <TabPane tabId="tabTraits">
                                {(this.props.taxonomyIsLoading)
                                    ? 
                                    <div style={loadingstyle}>
                                        <AnimateHelix />
                                    </div>
                                    :
                                    <>
                                        <PieChartTraits width={chartWidth} height={chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="traits" taxonomyGraphdata={this.props.taxonomyGraphdata.traits} />
                                    </>
                                } 
                            </TabPane>
                            <TabPane tabId="tabEnvironment">
                                {(!this.props.taxonomyIsLoading) && (!this.props.contextualIsLoading) && (!this.props.taxonomy.kingdom.isDisabled) &&
                                    <>
                                        <PieChartEnvironment width={chartWidth} height={chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="am_environment_id" contextualGraphdata={this.props.contextualGraphdata} />
                                    </>
                                } 
                            </TabPane>
                            <TabPane tabId="tabContextual">
                                <div style={{margin: '10px 0px'}}>
                                {(!this.props.contextualIsLoading)
                                    ?
                                    <ContextualTab chartWidth={chartWidth} chartHeight={chartHeight} scrollToSelected={this.props.scrollToSelected} selectToScroll={(e) => {this.props.selectToScroll(e)}} contextualGraphdata={this.props.contextualGraphdata} selectedEnvironmentOption={selectedEnvironmentOption} />
                                    :
                                    <div style={loadingstyle}>
                                        <AnimateHelix />
                                    </div>
                                } 
                                </div>
                            </TabPane>
                            <TabPane tabId="tabTaxonomyEnvironment">
                                {((!this.props.taxonomyIsLoading) && (!this.props.contextualIsLoading) && (!this.props.taxonomy.kingdom.isDisabled))
                                    ?
                                    <>
                                        <StackChart width={chartWidth} height={chartHeight} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="taxonomy_am_environment_id" taxonomyGraphdata={this.props.taxonomyGraphdata} contextualGraphdata={this.props.contextualGraphdata} />
                                    </>
                                    :
                                    <div style={loadingstyle}>
                                        <AnimateHelix />
                                    </div>
                                } 
                            </TabPane>
                        </TabContent>
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
)(GraphTabbed)
