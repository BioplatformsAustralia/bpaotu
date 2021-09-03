import React from 'react';
import { find } from 'lodash';
import { TabContent, TabPane, Nav, NavItem, NavLink, UncontrolledTooltip} from 'reactstrap'
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
import classnames from 'classnames'


class ContextualTab extends React.Component<any>  {

    tablist = ["vegetation_type_id","sample_type_id","env_broad_scale_id","env_local_scale_id","ph","organic_carbon","ammonium_nitrogen_wt","nitrate_nitrogen","phosphorus_colwell","temp","chlorophyll_ctd","nitrate_nitrite","nitrite","salinity","silicate"]
    
    state = {
        activeContextualTab: this.tablist.includes(this.props.scrollToSelected)?"tab_"+this.props.scrollToSelected:(this.props.selectedEnvironmentOption === 'Marine'?'tab_sample_type_id':'tab_vegetation_type_id')
    };

    public toggleContextualTab = tab => {
        if (this.state.activeContextualTab !== tab) {
            this.setState({
                activeContextualTab: tab,
            })
        }
    }

    public createNavItem(filterName) {
        const filter = find(this.props.optionscontextualFilter, def => def.name === filterName)
        return filter?(

            <NavItem>
                <NavLink
                    className={classnames({ active: this.state.activeContextualTab === 'tab_'+filterName })}
                    onClick={() => { this.toggleContextualTab('tab_'+filterName); }}
                >
                    {filter.display_name+' '}
                    <span id={"FilterTip"+filterName}>
                        <Octicon name="info" />
                    </span>
                    <UncontrolledTooltip target={"FilterTip"+filterName} placement="auto">
                        {filter.definition}
                    </UncontrolledTooltip>
                </NavLink>
            </NavItem>
        ):("")
    }
    render() {
    // console.log("this.state.activeContextualTab", this.state.activeContextualTab)
      return (
        <>
            <Nav pills>
                {this.props.selectedEnvironmentOption !== 'Marine' &&
                <>
                    {this.createNavItem('vegetation_type_id')}
                    {this.createNavItem('env_broad_scale_id')}
                    {this.createNavItem('env_local_scale_id')}
                    {this.createNavItem('ph')}
                    {this.createNavItem('organic_carbon')}
                    {this.createNavItem('ammonium_nitrogen_wt')}
                    {this.createNavItem('nitrate_nitrogen')}
                    {this.createNavItem('phosphorus_colwell')}
                </>
                }
                {this.props.selectedEnvironmentOption !== 'Soil' &&
                <>
                    {this.createNavItem('sample_type_id')}
                    {this.createNavItem('temp')}
                    {this.createNavItem('nitrate_nitrite')}
                    {this.createNavItem('chlorophyll_ctd')}
                    {this.createNavItem('salinity')}
                    {this.createNavItem('silicate')}
                
                </>
                }
            </Nav>
            <TabContent activeTab={this.state.activeContextualTab}>
                {this.props.selectedEnvironmentOption !== 'Marine' &&
                <>
                <TabPane tabId="tab_vegetation_type_id">
                    <PieChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="vegetation_type_id" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_env_broad_scale_id">
                    <PieChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="env_broad_scale_id" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_env_local_scale_id">
                    <PieChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="env_local_scale_id" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_ph">
                    <HistogramChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="ph" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_organic_carbon">
                    <HistogramChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="organic_carbon" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_ammonium_nitrogen_wt">
                    <HistogramChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="ammonium_nitrogen_wt" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_nitrate_nitrogen">
                    <HistogramChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="nitrate_nitrogen" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_phosphorus_colwell">
                    <HistogramChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="phosphorus_colwell" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                </>
                }
                {this.props.selectedEnvironmentOption !== 'Soil' && 
                <>
                <TabPane tabId="tab_sample_type_id">
                    <PieChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="sample_type_id" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_temp">
                    <HistogramChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="temp" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_nitrate_nitrite">
                    <HistogramChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="nitrate_nitrite" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_nitrite">
                    <HistogramChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="nitrite" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_chlorophyll_ctd">
                    <HistogramChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="chlorophyll_ctd" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_salinity">
                    <HistogramChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="salinity" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                <TabPane tabId="tab_silicate">
                    <HistogramChartContextual width={this.props.chartWidth} height={this.props.chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="silicate" contextualGraphdata={this.props.contextualGraphdata} />
                </TabPane>
                </>
                }
            </TabContent> 
        </>
      )
    }
  }

class GraphTabbed extends React.Component<any> {

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
                                    className={classnames({ active: this.props.tabSelected === 'tab_amplicon' })}
                                    onClick={() => { this.props.selectTab('tab_amplicon') }}
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
                                    className={classnames({ active: this.props.tabSelected === 'tab_taxonomy' })}
                                    onClick={() => { this.props.selectTab('tab_taxonomy') }}
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
                                    className={classnames({ active: this.props.tabSelected === 'tab_traits' })}
                                    onClick={() => { this.props.selectTab('tab_traits') }}
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
                                    className={classnames({ active: this.props.tabSelected === 'tab_am_environment_id' })}
                                    onClick={() => { this.props.selectTab('tab_am_environment_id') }}
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
                                    className={classnames({ active: this.props.tabSelected === 'tab_contextual' })}
                                    onClick={() => { this.props.selectTab('tab_contextual') }}
                                >
                                    Contextual Filters
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: this.props.tabSelected === 'tab_taxonomy_am_environment_id' })}
                                    onClick={() => { this.props.selectTab('tab_taxonomy_am_environment_id') }}
                                >{'Taxonomy vs Environment'}
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: this.props.tabSelected === 'tab_traits_am_environment_id' })}
                                    onClick={() => { this.props.selectTab('tab_traits_am_environment_id') }}
                                >{'Traits vs Environment'}
                                </NavLink>
                            </NavItem>
                        </Nav>
                        <TabContent activeTab={this.props.tabSelected}>
                            <TabPane tabId="tab_amplicon">
                                <PieChartAmplicon width={chartWidth} height={chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="amplicon" taxonomyGraphdata={this.props.taxonomyGraphdata.amplicon} />
                            </TabPane>
                            <TabPane tabId="tab_taxonomy">
                                {(!this.props.selectedAmplicon || this.props.selectedAmplicon.value === '') &&
                                    <p className="lead">{TaxonomyNoAmpliconInfo}</p>
                                }
                                {(!this.props.taxonomyIsLoading) && (!this.props.contextualIsLoading) && (!this.props.taxonomy.kingdom.isDisabled) &&
                                    <>
                                        <SunBurstChartTaxonomy width={chartWidth} height={chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="taxonomy" taxonomyIsLoading={this.props.taxonomyIsLoading} contextualIsLoading={this.props.contextualIsLoading} taxonomyGraphdata={this.props.taxonomyGraphdata} contextualGraphdata={this.props.contextualGraphdata} />
                                    </>
                                } 
                            </TabPane>
                            <TabPane tabId="tab_traits">
                                {(this.props.taxonomyIsLoading)
                                    ? 
                                    <div style={loadingstyle}>
                                        <AnimateHelix />
                                    </div>
                                    :
                                    <>
                                        <PieChartTraits width={chartWidth} height={chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="traits" taxonomyGraphdata={this.props.taxonomyGraphdata.traits} />
                                    </>
                                } 
                            </TabPane>
                            <TabPane tabId="tab_am_environment_id">
                                {(!this.props.taxonomyIsLoading) && (!this.props.contextualIsLoading) && (!this.props.taxonomy.kingdom.isDisabled) &&
                                    <>
                                        <PieChartEnvironment width={chartWidth} height={chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="am_environment_id" contextualGraphdata={this.props.contextualGraphdata} />
                                    </>
                                } 
                            </TabPane>
                            <TabPane tabId="tab_contextual">
                                <div style={{margin: '10px 0px'}}>
                                {(!this.props.contextualIsLoading)
                                    ?
                                    <ContextualTab chartWidth={chartWidth} chartHeight={chartHeight} selectTab={(e) => {this.props.selectTab(e)}} scrollToSelected={this.props.scrollToSelected} selectToScroll={(e) => {this.props.selectToScroll(e)}} contextualGraphdata={this.props.contextualGraphdata} selectedEnvironmentOption={selectedEnvironmentOption} optionscontextualFilter={this.props.optionscontextualFilter} />
                                    :
                                    <div style={loadingstyle}>
                                        <AnimateHelix />
                                    </div>
                                } 
                                </div>
                            </TabPane>
                            <TabPane tabId="tab_taxonomy_am_environment_id">
                                {((!this.props.taxonomyIsLoading) && (!this.props.contextualIsLoading) && (!this.props.taxonomy.kingdom.isDisabled))
                                    ?
                                    <>
                                        <StackChartTaxonomy width={chartWidth} height={chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="taxonomy_am_environment_id" taxonomyGraphdata={this.props.taxonomyGraphdata} contextualGraphdata={this.props.contextualGraphdata} />
                                    </>
                                    :
                                    <div style={loadingstyle}>
                                        <AnimateHelix />
                                    </div>
                                } 
                            </TabPane>
                            <TabPane tabId="tab_traits_am_environment_id">
                                {((!this.props.taxonomyIsLoading) && (!this.props.contextualIsLoading) && (!this.props.taxonomy.kingdom.isDisabled))
                                    ?
                                    <>
                                        <StackChartTraits width={chartWidth} height={chartHeight} selectTab={(e) => {this.props.selectTab(e)}} selectToScroll={(e) => {this.props.selectToScroll(e)}} filter="taxonomy_am_environment_id" taxonomyGraphdata={this.props.taxonomyGraphdata} contextualGraphdata={this.props.contextualGraphdata} />
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

export default GraphTabbed
