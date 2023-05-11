import React from 'react'
import { find, filter } from 'lodash'
import { TabContent, TabPane, Nav, NavItem, NavLink, UncontrolledTooltip } from 'reactstrap'

import Octicon from 'components/octicon'

import PieChartContextual from './charts/pie_chart_contextual'
import PieChartEnvironment from './charts/pie_chart_environment'
import PieChartAmplicon from './charts/pie_chart_amplicon'
import PieChartTraits from './charts/pie_chart_traits'
import HistogramChartContextual from './charts/histogram_chart_contextual'
import StackChartTaxonomy from './charts/stack_chart_taxonomy'
import StackChartTraits from './charts/stack_chart_traits'
import SunBurstChartTaxonomy from './charts/sunburst_chart_taxonomy'

import {
  AmpliconFilterInfo,
  TaxonomyFilterInfo,
  TraitFilterInfo,
} from './amplicon_taxonomy_filter_card'
import { EnvironmentInfo } from './environment_filter'
import { ContextualFilterInfo } from './contextual_filter_card'

import classnames from 'classnames'

class ContextualTab extends React.Component<any> {
  tablist = filter(
    Object.keys(this.props.contextualGraphdata),
    (val) => val !== 'am_environment_id'
  )
  state = {
    activeContextualTab: this.tablist.includes(this.props.scrollToSelected)
      ? 'tab_' + this.props.scrollToSelected
      : this.props.selectedEnvironment && this.props.selectedEnvironment.value === 1
      ? 'tab_sample_type_id'
      : 'tab_vegetation_type_id',
  }

  public toggleContextualTab = (tab) => {
    if (this.state.activeContextualTab !== tab) {
      this.setState({
        activeContextualTab: tab,
      })
    }
  }

  public applyEnvironmentFilter(filterName) {
    const selectedEnvironment =
      this.props.selectedEnvironment && this.props.selectedEnvironment.value
        ? '' + this.props.selectedEnvironment.value
        : ''
    const filter = find(this.props.optionscontextualFilter, (def) => def.name === filterName)
    const filterEnvironent = filter && filter.environment ? '' + filter.environment : ''
    if (selectedEnvironment === '') return true
    else return filterEnvironent === '' || filterEnvironent === selectedEnvironment
  }

  public createNavItem(filterName) {
    const filter = find(this.props.optionscontextualFilter, (def) => def.name === filterName)
    return filter ? (
      <NavItem key={filterName}>
        <NavLink
          key={filterName}
          className={classnames({ active: this.state.activeContextualTab === 'tab_' + filterName })}
          onClick={() => {
            this.toggleContextualTab('tab_' + filterName)
          }}
        >
          {filter.display_name + ' '}
          <span id={'FilterTip' + filterName}>
            <Octicon name="info" />
          </span>
          <UncontrolledTooltip target={'FilterTip' + filterName} placement="auto">
            {filter.definition}
          </UncontrolledTooltip>
        </NavLink>
      </NavItem>
    ) : (
      ''
    )
  }

  render() {
    return (
      <>
        <Nav pills>
          <>
            {this.tablist.map((tab) => this.applyEnvironmentFilter(tab) && this.createNavItem(tab))}
          </>
        </Nav>
        <TabContent activeTab={this.state.activeContextualTab}>
          <>
            {this.tablist.map((tab) => (
              <TabPane key={'tab_' + tab} tabId={'tab_' + tab}>
                {find(
                  this.props.optionscontextualFilter,
                  (dd) => dd.name === tab && dd.type === 'ontology'
                ) ? (
                  <PieChartContextual
                    width={this.props.chartWidth}
                    height={this.props.chartHeight}
                    selectTab={(e) => {
                      this.props.selectTab(e)
                    }}
                    selectToScroll={(e) => {
                      this.props.selectToScroll(e)
                    }}
                    filter={tab}
                    contextualGraphdata={this.props.contextualGraphdata}
                  />
                ) : (
                  <HistogramChartContextual
                    width={this.props.chartWidth}
                    height={this.props.chartHeight}
                    selectTab={(e) => {
                      this.props.selectTab(e)
                    }}
                    selectToScroll={(e) => {
                      this.props.selectToScroll(e)
                    }}
                    filter={tab}
                    contextualGraphdata={this.props.contextualGraphdata}
                  />
                )}
              </TabPane>
            ))}
          </>
        </TabContent>
      </>
    )
  }
}

class GraphTabbed extends React.Component<any> {
  render() {
    const chartWidth = window.innerWidth * 0.9
    const chartHeight = window.innerHeight * 0.7
    return (
      <>
        <div style={{ margin: '0px -15px' }}>
          <Nav tabs>
            <NavItem>
              <NavLink>{'      '}</NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                data-tut="reactour__graph_amplicon"
                id="reactour__graph_amplicon"
                className={classnames({ active: this.props.selectedTab === 'tab_amplicon' })}
                onClick={() => {
                  this.props.selectTab('tab_amplicon')
                }}
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
                data-tut="reactour__graph_taxonomy"
                id="reactour__graph_taxonomy"
                className={classnames({ active: this.props.selectedTab === 'tab_taxonomy' })}
                onClick={() => {
                  this.props.selectTab('tab_taxonomy')
                }}
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
                data-tut="reactour__graph_traits"
                id="reactour__graph_traits"
                className={classnames({ active: this.props.selectedTab === 'tab_traits' })}
                onClick={() => {
                  this.props.selectTab('tab_traits')
                }}
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
                data-tut="reactour__graph_environment"
                id="reactour__graph_environment"
                className={classnames({
                  active: this.props.selectedTab === 'tab_am_environment_id',
                })}
                onClick={() => {
                  this.props.selectTab('tab_am_environment_id')
                }}
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
                data-tut="reactour__graph_contextual"
                id="reactour__graph_contextual"
                className={classnames({ active: this.props.selectedTab === 'tab_contextual' })}
                onClick={() => {
                  this.props.selectTab('tab_contextual')
                }}
              >
                {'Contextual Filters '}
                <span id="contextualFiltersTipGraphTab">
                  <Octicon name="info" align="top" />
                </span>
                <UncontrolledTooltip target="contextualFiltersTipGraphTab" placement="auto">
                  {ContextualFilterInfo}
                </UncontrolledTooltip>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                data-tut="reactour__graph_taxonomy_am_environment"
                id="reactour__graph_taxonomy_am_environment"
                className={classnames({
                  active: this.props.selectedTab === 'tab_taxonomy_am_environment_id',
                })}
                onClick={() => {
                  this.props.selectTab('tab_taxonomy_am_environment_id')
                }}
              >
                {'Taxonomy vs Environment '}
                <span id="taxonomyEnvironmentTipGraphTab">
                  <Octicon name="info" align="top" />
                </span>
                <UncontrolledTooltip target="taxonomyEnvironmentTipGraphTab" placement="auto">
                  {'Relative abundance of taxonomy for AM environment '}
                </UncontrolledTooltip>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                data-tut="reactour__graph_traits_am_environment"
                id="reactour__graph_traits_am_environment"
                className={classnames({
                  active: this.props.selectedTab === 'tab_traits_am_environment_id',
                })}
                onClick={() => {
                  this.props.selectTab('tab_traits_am_environment_id')
                }}
              >
                {'Traits vs Environment '}
                <span id="traitsEnvironmentTipGraphTab">
                  <Octicon name="info" align="top" />
                </span>
                <UncontrolledTooltip target="traitsEnvironmentTipGraphTab" placement="auto">
                  {'Relative abundance of traits for AM environment '}
                </UncontrolledTooltip>
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent activeTab={this.props.selectedTab}>
            <TabPane tabId="tab_amplicon">
              <PieChartAmplicon
                width={chartWidth}
                height={chartHeight}
                selectTab={(e) => {
                  this.props.selectTab(e)
                }}
                selectToScroll={(e) => {
                  this.props.selectToScroll(e)
                }}
                filter="amplicon"
                taxonomyGraphdata={this.props.taxonomyGraphdata.amplicon}
              />
            </TabPane>
            <TabPane tabId="tab_taxonomy" data-tut="reactour__graph_taxonomy_page">
              <>
                <SunBurstChartTaxonomy
                  width={chartWidth}
                  height={chartHeight}
                  selectTab={(e) => {
                    this.props.selectTab(e)
                  }}
                  selectToScroll={(e) => {
                    this.props.selectToScroll(e)
                  }}
                  filter="taxonomy"
                  taxonomyGraphdata={this.props.taxonomyGraphdata}
                  contextualGraphdata={this.props.contextualGraphdata}
                />
              </>
            </TabPane>
            <TabPane tabId="tab_traits">
              <>
                <PieChartTraits
                  width={chartWidth}
                  height={chartHeight}
                  selectTab={(e) => {
                    this.props.selectTab(e)
                  }}
                  selectToScroll={(e) => {
                    this.props.selectToScroll(e)
                  }}
                  filter="traits"
                  taxonomyGraphdata={this.props.taxonomyGraphdata.traits}
                />
              </>
            </TabPane>
            <TabPane tabId="tab_am_environment_id">
              <>
                <PieChartEnvironment
                  width={chartWidth}
                  height={chartHeight}
                  selectTab={(e) => {
                    this.props.selectTab(e)
                  }}
                  selectToScroll={(e) => {
                    this.props.selectToScroll(e)
                  }}
                  filter="am_environment_id"
                  contextualGraphdata={this.props.contextualGraphdata}
                />
              </>
            </TabPane>
            <TabPane tabId="tab_contextual">
              <div style={{ margin: '10px 0px' }}>
                <ContextualTab
                  chartWidth={chartWidth}
                  chartHeight={chartHeight}
                  selectTab={(e) => {
                    this.props.selectTab(e)
                  }}
                  scrollToSelected={this.props.scrollToSelected}
                  selectToScroll={(e) => {
                    this.props.selectToScroll(e)
                  }}
                  contextualGraphdata={this.props.contextualGraphdata}
                  selectedEnvironment={this.props.selectedEnvironment}
                  optionscontextualFilter={this.props.optionscontextualFilter}
                  optionsEnvironment={this.props.optionsEnvironment}
                />
              </div>
            </TabPane>
            <TabPane tabId="tab_taxonomy_am_environment_id">
              <>
                <StackChartTaxonomy
                  width={chartWidth}
                  height={chartHeight}
                  selectTab={(e) => {
                    this.props.selectTab(e)
                  }}
                  selectToScroll={(e) => {
                    this.props.selectToScroll(e)
                  }}
                  filter="taxonomy_am_environment_id"
                  taxonomyGraphdata={this.props.taxonomyGraphdata}
                  contextualGraphdata={this.props.contextualGraphdata}
                />
              </>
            </TabPane>
            <TabPane tabId="tab_traits_am_environment_id">
              <>
                <StackChartTraits
                  width={chartWidth}
                  height={chartHeight}
                  selectTab={(e) => {
                    this.props.selectTab(e)
                  }}
                  selectToScroll={(e) => {
                    this.props.selectToScroll(e)
                  }}
                  filter="taxonomy_am_environment_id"
                  taxonomyGraphdata={this.props.taxonomyGraphdata}
                  contextualGraphdata={this.props.contextualGraphdata}
                />
              </>
            </TabPane>
          </TabContent>
        </div>
      </>
    )
  }
}

export default GraphTabbed
