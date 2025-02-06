import React, { useEffect } from 'react'
import { find, filter } from 'lodash'
import { Container, Card, CardHeader, CardBody, Row, Col, UncontrolledTooltip } from 'reactstrap'

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

const GraphListed = (props) => {
  const {
    chartHeight,
    chartWidth,
    contextualGraphdata,
    optionscontextualFilter,
    scrollToSelected,
    selectedEnvironment,
    selectTab,
    selectToScroll,
    taxonomyGraphdata,
  } = props

  const graphlist = filter(Object.keys(contextualGraphdata), (val) => val !== 'am_environment_id')

  const applyEnvironmentFilter = (selectedEnvironment, filterName) => {
    const _selectedEnvironment =
      selectedEnvironment && selectedEnvironment.value ? '' + selectedEnvironment.value : ''
    const filter = find(optionscontextualFilter, (def) => def.name === filterName)
    const filterEnvironent = filter && filter.environment ? '' + filter.environment : ''

    if (_selectedEnvironment === '') {
      return true
    } else {
      return filterEnvironent === '' || filterEnvironent === _selectedEnvironment
    }
  }

  useEffect(() => {
    const el = document.getElementById(scrollToSelected)

    if (el) {
      const scrollTimeout = setTimeout(() => {
        el.scrollIntoView({ block: 'end', behavior: 'smooth' })
      }, 1000)

      return () => {
        // Cleanup function to clear the timeout when the component unmounts or the dependency changes
        clearTimeout(scrollTimeout)
      }
    }
  }, [scrollToSelected])

  return (
    <>
      <Container fluid={true}>
        <Row style={{ marginBottom: '10px' }}>
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
                <PieChartAmplicon
                  selectTab={(e) => {
                    selectTab(e)
                  }}
                  selectToScroll={(e) => {
                    selectToScroll(e)
                  }}
                  filter="amplicon"
                  taxonomyGraphdata={taxonomyGraphdata.amplicon}
                />
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Row style={{ marginBottom: '10px' }}>
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
                <>
                  <SunBurstChartTaxonomy
                    selectTab={(e) => {
                      selectTab(e)
                    }}
                    selectToScroll={(e) => {
                      selectToScroll(e)
                    }}
                    filter="taxonomy"
                    taxonomyGraphdata={taxonomyGraphdata}
                  />
                  <StackChartTaxonomy
                    selectTab={(e) => {
                      selectTab(e)
                    }}
                    selectToScroll={(e) => {
                      selectToScroll(e)
                    }}
                    filter="taxonomy_am_environment_id"
                    taxonomyGraphdata={taxonomyGraphdata}
                  />
                </>
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Row style={{ marginBottom: '10px' }}>
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
                <>
                  <PieChartTraits
                    selectTab={(e) => {
                      selectTab(e)
                    }}
                    selectToScroll={(e) => {
                      selectToScroll(e)
                    }}
                    filter="traits"
                    taxonomyGraphdata={taxonomyGraphdata.traits}
                  />
                  <StackChartTraits
                    selectTab={(e) => {
                      selectTab(e)
                    }}
                    selectToScroll={(e) => {
                      selectToScroll(e)
                    }}
                    filter="taxonomy_am_environment_id"
                    taxonomyGraphdata={taxonomyGraphdata}
                  />
                </>
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Row style={{ marginBottom: '10px' }}>
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
                <>
                  <PieChartEnvironment
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
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Row style={{ marginBottom: '10px' }}>
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
                {graphlist.map((graphName) =>
                  applyEnvironmentFilter(selectedEnvironment, graphName) ? (
                    find(
                      optionscontextualFilter,
                      (dd) => dd.name === graphName && dd.type === 'ontology'
                    ) ? (
                      <PieChartContextual
                        key={'pie' + graphName}
                        width={chartWidth}
                        height={chartHeight}
                        selectTab={(e) => {
                          selectTab(e)
                        }}
                        selectToScroll={(e) => {
                          selectToScroll(e)
                        }}
                        filter={graphName}
                        contextualGraphdata={contextualGraphdata}
                      />
                    ) : (
                      <HistogramChartContextual
                        key={'hist' + graphName}
                        width={chartWidth}
                        height={chartHeight}
                        selectTab={(e) => {
                          selectTab(e)
                        }}
                        selectToScroll={(e) => {
                          selectToScroll(e)
                        }}
                        filter={graphName}
                        contextualGraphdata={contextualGraphdata}
                      />
                    )
                  ) : (
                    ''
                  )
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default GraphListed
