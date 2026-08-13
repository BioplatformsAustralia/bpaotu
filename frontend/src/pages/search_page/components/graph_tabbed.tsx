import React, { useState } from 'react'
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
import GraphTabButton from './graph_tab_button'

import './graph.css'

const ContextualTab = (props) => {
  const {
    contextualGraphdata,
    scrollToSelected,
    selectedEnvironment,
    optionscontextualFilter,
    chartWidth,
    chartHeight,
    selectTab,
    selectToScroll,
  } = props

  const tablist = filter(Object.keys(contextualGraphdata), (val) => val !== 'am_environment_id')

  const [activeContextualTab, setActiveContextualTab] = useState(() => {
    const initialTab = tablist.includes(scrollToSelected)
      ? 'tab_' + scrollToSelected
      : selectedEnvironment && selectedEnvironment.value === 1
        ? 'tab_sample_type_id'
        : 'tab_vegetation_type_id'
    return initialTab
  })

  const toggleContextualTab = (tab) => {
    if (activeContextualTab !== tab) {
      setActiveContextualTab(tab)
    }
  }

  const applyEnvironmentFilter = (selectedEnvironment, filterName) => {
    const selectedEnvironmentValue =
      selectedEnvironment && selectedEnvironment.value ? '' + selectedEnvironment.value : ''
    const filter = find(optionscontextualFilter, (def) => def.name === filterName)
    const filterEnvironment = filter && filter.environment ? '' + filter.environment : ''

    if (selectedEnvironmentValue === '') return true
    else return filterEnvironment === '' || filterEnvironment === selectedEnvironmentValue
  }

  const createNavItem = (filterName) => {
    const filter = find(optionscontextualFilter, (def) => def.name === filterName)

    return filter ? (
      <NavItem key={filterName}>
        <NavLink
          key={filterName}
          className={classnames({
            active: activeContextualTab === 'tab_' + filterName,
          })}
          onClick={() => {
            toggleContextualTab('tab_' + filterName)
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

  return (
    <>
      <Nav pills>
        <>
          {tablist.map(
            (tab) => applyEnvironmentFilter(selectedEnvironment, tab) && createNavItem(tab),
          )}
        </>
      </Nav>
      <TabContent activeTab={activeContextualTab}>
        <>
          {tablist.map((tab) => (
            <TabPane key={'tab_' + tab} tabId={'tab_' + tab}>
              {find(optionscontextualFilter, (dd) => dd.name === tab && dd.type === 'ontology') ? (
                <PieChartContextual
                  width={chartWidth}
                  height={chartHeight}
                  selectTab={(e) => {
                    selectTab(e)
                  }}
                  selectToScroll={(e) => {
                    selectToScroll(e)
                  }}
                  filter={tab}
                  contextualGraphdata={contextualGraphdata}
                />
              ) : (
                <HistogramChartContextual
                  width={chartWidth}
                  height={chartHeight}
                  selectTab={(e) => selectTab(e)}
                  selectToScroll={(e) => selectToScroll(e)}
                  filter={tab}
                  contextualGraphdata={contextualGraphdata}
                />
              )}
            </TabPane>
          ))}
        </>
      </TabContent>
    </>
  )
}

const GraphTabbed = (props) => {
  const chartWidth = window.innerWidth * 0.9
  const chartHeight = window.innerHeight * 0.7

  const {
    contextualGraphdata,
    optionscontextualFilter,
    optionsEnvironment,
    scrollToSelected,
    selectedEnvironment,
    selectedTab,
    selectTab,
    selectToScroll,
    taxonomyGraphdata,
  } = props

  return (
    <>
      <div style={{ margin: '0px -15px' }}>
        <div className="graph-tabs">
          <GraphTabButton
            id="reactour__graph_amplicon"
            dataTut="reactour__graph_amplicon"
            tabId="tab_amplicon"
            label="Amplicon"
            selectedTab={selectedTab}
            selectTab={selectTab}
            tooltip={AmpliconFilterInfo}
          />

          <GraphTabButton
            id="reactour__graph_taxonomy"
            dataTut="reactour__graph_taxonomy"
            tabId="tab_taxonomy"
            label="Taxonomy"
            selectedTab={selectedTab}
            selectTab={selectTab}
            tooltip={TaxonomyFilterInfo}
          />

          <GraphTabButton
            id="reactour__graph_traits"
            dataTut="reactour__graph_traits"
            tabId="tab_traits"
            label="Traits"
            selectedTab={selectedTab}
            selectTab={selectTab}
            tooltip={TraitFilterInfo}
          />

          <GraphTabButton
            id="reactour__graph_environment"
            dataTut="reactour__graph_environment"
            tabId="tab_am_environment_id"
            label="Environment"
            selectedTab={selectedTab}
            selectTab={selectTab}
            tooltip={EnvironmentInfo}
          />

          <GraphTabButton
            id="reactour__graph_contextual"
            dataTut="reactour__graph_contextual"
            tabId="tab_contextual"
            label="Contextual Filters"
            selectedTab={selectedTab}
            selectTab={selectTab}
            tooltip={ContextualFilterInfo}
          />

          <GraphTabButton
            id="reactour__graph_taxonomy_am_environment"
            dataTut="reactour__graph_taxonomy_am_environment"
            tabId="tab_taxonomy_am_environment_id"
            label="Taxonomy vs Environment"
            selectedTab={selectedTab}
            selectTab={selectTab}
            tooltip="Relative abundance of taxonomy for AM environment"
          />

          <GraphTabButton
            id="reactour__graph_traits_am_environment"
            dataTut="reactour__graph_traits_am_environment"
            tabId="tab_traits_am_environment_id"
            label="Traits vs Environment"
            selectedTab={selectedTab}
            selectTab={selectTab}
            tooltip="Relative abundance of traits for AM environment"
          />
        </div>
        <TabContent activeTab={selectedTab}>
          <TabPane tabId="tab_amplicon">
            <PieChartAmplicon
              width={chartWidth}
              height={chartHeight}
              selectTab={(e) => {
                selectTab(e)
              }}
              selectToScroll={(e) => {
                selectToScroll(e)
              }}
              filter="amplicon"
              taxonomyGraphdata={taxonomyGraphdata.amplicon}
            />
          </TabPane>
          <TabPane tabId="tab_taxonomy" data-tut="reactour__graph_taxonomy_page">
            <>
              <SunBurstChartTaxonomy
                width={chartWidth}
                height={chartHeight}
                selectTab={(e) => {
                  selectTab(e)
                }}
                selectToScroll={(e) => {
                  selectToScroll(e)
                }}
                filter="taxonomy"
                taxonomyGraphdata={taxonomyGraphdata}
                contextualGraphdata={contextualGraphdata}
              />
            </>
          </TabPane>
          <TabPane tabId="tab_traits">
            <>
              <PieChartTraits
                width={chartWidth}
                height={chartHeight}
                selectTab={(e) => {
                  selectTab(e)
                }}
                selectToScroll={(e) => {
                  selectToScroll(e)
                }}
                filter="traits"
                taxonomyGraphdata={taxonomyGraphdata.traits}
              />
            </>
          </TabPane>
          <TabPane tabId="tab_am_environment_id">
            <>
              <PieChartEnvironment
                width={chartWidth}
                height={chartHeight}
                selectTab={(e) => {
                  selectTab(e)
                }}
                selectToScroll={(e) => {
                  selectToScroll(e)
                }}
                filter="am_environment_id"
                contextualGraphdata={contextualGraphdata}
              />
            </>
          </TabPane>
          <TabPane tabId="tab_contextual">
            <div style={{ margin: '10px 0px' }}>
              <ContextualTab
                chartWidth={chartWidth}
                chartHeight={chartHeight}
                selectTab={(e) => {
                  selectTab(e)
                }}
                scrollToSelected={scrollToSelected}
                selectToScroll={(e) => {
                  selectToScroll(e)
                }}
                contextualGraphdata={contextualGraphdata}
                selectedEnvironment={selectedEnvironment}
                optionscontextualFilter={optionscontextualFilter}
                optionsEnvironment={optionsEnvironment}
              />
            </div>
          </TabPane>
          <TabPane tabId="tab_taxonomy_am_environment_id">
            <>
              <StackChartTaxonomy
                width={chartWidth}
                height={chartHeight}
                selectTab={(e) => {
                  selectTab(e)
                }}
                selectToScroll={(e) => {
                  selectToScroll(e)
                }}
                filter="taxonomy_am_environment_id"
                taxonomyGraphdata={taxonomyGraphdata}
                contextualGraphdata={contextualGraphdata}
              />
            </>
          </TabPane>
          <TabPane tabId="tab_traits_am_environment_id">
            <>
              <StackChartTraits
                width={chartWidth}
                height={chartHeight}
                selectTab={(e) => {
                  selectTab(e)
                }}
                selectToScroll={(e) => {
                  selectToScroll(e)
                }}
                filter="taxonomy_am_environment_id"
                taxonomyGraphdata={taxonomyGraphdata}
                contextualGraphdata={contextualGraphdata}
              />
            </>
          </TabPane>
        </TabContent>
      </div>
    </>
  )
}

export default GraphTabbed
