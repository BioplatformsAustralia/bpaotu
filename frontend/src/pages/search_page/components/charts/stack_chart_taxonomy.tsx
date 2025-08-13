import React, { useCallback } from 'react'
import Plot from 'react-plotly.js'
import { plotly_chart_config } from './plotly_chart'
import { find, filter as lodashFilter } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { selectEnvironment } from '../../reducers/contextual'

const StackChartTaxonomy = (props) => {
  const { taxonomy, contextualFilters, environment, taxonomyGraphdata, width, height, filter } =
    props

  const getSelectedTaxonomy = useCallback((taxonomy: any) => {
    for (const [name, taxa] of Object.entries(taxonomy)) {
      if (taxa['selected'].value === '') {
        return name
      }
    }
    return undefined
  }, [])

  const loadChartData = useCallback(
    (environment, selectedTaxonomy, taxonomyGraphdata, contextualFilters) => {
      let chart_data: any[] = []
      if (!taxonomyGraphdata || !taxonomyGraphdata.am_environment) return chart_data

      let am_environments = taxonomyGraphdata.am_environment ? ['All'] : []

      for (const am_environment of Object.keys(taxonomyGraphdata.am_environment)) {
        if (environment) {
          const env_text = find(environment, (option) => option.id === parseInt(am_environment))
          if (env_text) {
            am_environments.push('All ' + env_text.name)
          }
        }
      }

      if (String(contextualFilters.length) !== '0') {
        for (const am_environment of Object.keys(taxonomyGraphdata.am_environment_selected)) {
          const env = find(environment, (option) => option.id === parseInt(am_environment))
          if (env) {
            am_environments.push('Selected ' + env.name)
          }
        }
        for (const am_environment of Object.keys(taxonomyGraphdata.am_environment_non_selected)) {
          const env = find(environment, (option) => option.id === parseInt(am_environment))
          if (env) {
            am_environments.push('Non selected ' + env.name)
          }
        }
      }

      for (const taxa_values of Object.values(taxonomyGraphdata.am_environment_all)) {
        const taxa_id = taxa_values[0]
        const taxa_abundance = taxa_values[1]
        let taxonomyEntry: any = {}
        const selectedTaxa = getSelectedTaxonomy(selectedTaxonomy)
        const taxa = selectedTaxa
          ? find(
              selectedTaxonomy[selectedTaxa]['options'],
              (option) => option.id === parseInt(taxa_id)
            )
          : undefined
        if (taxa) {
          taxonomyEntry['name'] = taxa.value
          taxonomyEntry['x'] = am_environments
          taxonomyEntry['y'] = [taxa_abundance]

          for (const key of Object.keys(taxonomyGraphdata.am_environment)) {
            taxonomyGraphdata.am_environment[key].forEach((value) => {
              if (value[0] === taxa_id) {
                taxonomyEntry['y'].push(value[1])
              }
            })
          }
          for (const key of Object.keys(taxonomyGraphdata.am_environment_selected)) {
            taxonomyGraphdata.am_environment_selected[key].forEach((value) => {
              if (value[0] === taxa_id) {
                taxonomyEntry['y'].push(value[1])
              }
            })
          }
          for (const key of Object.keys(taxonomyGraphdata.am_environment_non_selected)) {
            taxonomyGraphdata.am_environment_non_selected[key].forEach((value) => {
              if (value[0] === taxa_id) {
                taxonomyEntry['y'].push(value[1])
              }
            })
          }

          const textdisplay = taxonomyEntry['name']
            .split('')
            .map(
              (_: any, index: number) => taxonomyEntry['name'] + '<BR>' + taxonomyEntry['y'][index]
            )

          taxonomyEntry['text'] = textdisplay
          taxonomyEntry['texttemplate'] = '%{text}<br>%{value}%'
          taxonomyEntry['hovertemplate'] = '%{label}<br>%{text}<br>%{value}%'
          taxonomyEntry['textposition'] = 'inside'
          taxonomyEntry['textangle'] = '0'
          taxonomyEntry['type'] = 'bar'
          taxonomyEntry['marker'] = {
            line: {
              width: 0,
              color: 'white',
            },
          }
          chart_data.push(taxonomyEntry)
        }
      }
      return chart_data
    },
    [getSelectedTaxonomy]
  )

  const title = 'Taxonomy vs AM Environment Plot'
  const data = loadChartData(environment, taxonomy, taxonomyGraphdata, contextualFilters)

  const default_category_order = [
    'All',
    'All Marine',
    'Non selected Marine',
    'Selected Marine',
    'Selected Soil',
    'Non selected Soil',
    'All Soil',
  ]

  const category_order =
    data.length > 0
      ? lodashFilter(default_category_order, (item) => data[0].x.includes(item))
      : default_category_order

  return (
    <>
      <Plot
        data={data}
        layout={{
          autosize: true,
          width,
          height,
          dragmode: 'zoom',
          title: { text: title, font: { size: 20 } },
          hovermode: 'closest',
          barmode: 'relative',
          barnorm: 'percent',
          yaxis: { title: '% Composition' /* tickformat:',e' */ },
          xaxis: {
            title: 'AM_Environment',
            type: 'category',
            categoryorder: 'array',
            categoryarray: category_order,
          },
        }}
        config={plotly_chart_config(title)}
      />
      <span id={filter}></span>
    </>
  )
}

const mapStateToProps = (state) => {
  return {
    taxonomy: state.searchPage.filters.taxonomy,
    contextualFilters: state.searchPage.filters.contextual.filters,
    environment: state.contextualDataDefinitions.environment,
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators(
    {
      selectEnvironment,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(StackChartTaxonomy)
