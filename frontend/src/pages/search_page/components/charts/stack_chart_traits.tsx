import React, { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { find, filter as lodashFilter } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { plotly_chart_config } from '../charts/plotly_chart'
import { selectEnvironment } from '../../reducers/contextual'

const StackChartTraits = (props: any) => {
  const { environment, taxonomy, taxonomyGraphdata, contextualFilters, width, height, filter } =
    props

  const loadChartData = (
    environment: any,
    taxonomy: any,
    taxonomyGraphdata: any,
    contextualFilters: any[]
  ) => {
    let chart_data: any[] = []
    if (taxonomyGraphdata && taxonomyGraphdata.traits_am_environment) {
      let traits_am_environments = taxonomyGraphdata.traits_am_environment ? ['All'] : []

      for (const traits_am_environment of Object.keys(taxonomyGraphdata.traits_am_environment)) {
        if (environment) {
          const env_text = find(
            environment,
            (option) => option.id === parseInt(traits_am_environment)
          )
          if (env_text) traits_am_environments.push('All ' + env_text.name)
        }
      }

      if (contextualFilters.length !== 0) {
        for (const traits_am_environment of Object.keys(
          taxonomyGraphdata.traits_am_environment_selected || {}
        )) {
          const env = find(environment, (option) => option.id === parseInt(traits_am_environment))
          if (env) {
            traits_am_environments.push('Selected ' + env.name)
          }
        }
        for (const traits_am_environment of Object.keys(
          taxonomyGraphdata.traits_am_environment_non_selected || {}
        )) {
          const env = find(environment, (option) => option.id === parseInt(traits_am_environment))
          if (env) {
            traits_am_environments.push('Non selected ' + env.name)
          }
        }
      }

      for (const taxa_values of Object.values(taxonomyGraphdata.traits_am_environment_all || {})) {
        const taxa_id = taxa_values[0]
        const taxa_abundance = taxa_values[1]
        let taxonomyObj: any = {}

        if (taxa_id) {
          taxonomyObj['name'] = taxa_id
          taxonomyObj['x'] = traits_am_environments
          taxonomyObj['y'] = [taxa_abundance]

          for (const key of Object.keys(taxonomyGraphdata.traits_am_environment)) {
            taxonomyGraphdata.traits_am_environment[key].forEach((value: any) => {
              if (value[0] === taxa_id) {
                taxonomyObj['y'].push(value[1])
              }
            })
          }
          for (const key of Object.keys(taxonomyGraphdata.traits_am_environment_selected || {})) {
            taxonomyGraphdata.traits_am_environment_selected[key].forEach((value: any) => {
              if (value[0] === taxa_id) {
                taxonomyObj['y'].push(value[1])
              }
            })
          }
          for (const key of Object.keys(
            taxonomyGraphdata.traits_am_environment_non_selected || {}
          )) {
            taxonomyGraphdata.traits_am_environment_non_selected[key].forEach((value: any) => {
              if (value[0] === taxa_id) {
                taxonomyObj['y'].push(value[1])
              }
            })
          }

          // Build text display
          let textdisplay = []
          for (let i = 0; i < taxonomyObj['x'].length; i++) {
            textdisplay[i] = taxonomyObj['name'] + '<BR>' + taxonomyObj['y'][i]
          }

          taxonomyObj['text'] = textdisplay
          taxonomyObj['texttemplate'] = '%{text}<br>%{value}%'
          taxonomyObj['hovertemplate'] = '%{label}<br>%{text}<br>%{value}%'
          taxonomyObj['textposition'] = 'inside'
          taxonomyObj['textangle'] = '0'
          taxonomyObj['type'] = 'bar'
          taxonomyObj['marker'] = {
            line: {
              width: 0,
              color: 'white',
            },
          }

          chart_data.push(taxonomyObj)
        }
      }
    }

    return chart_data
  }

  const data = useMemo(
    () => loadChartData(environment, taxonomy, props.taxonomyGraphdata, contextualFilters),
    [environment, taxonomy, props.taxonomyGraphdata, contextualFilters]
  )

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
      ? default_category_order.filter((item) => data[0].x.includes(item))
      : default_category_order

  const title = 'Traits vs AM Environment Plot'

  return (
    <>
      <Plot
        data={data}
        layout={{
          autosize: true,
          width,
          height,
          dragmode: 'False', //['orbit', 'turntable', 'zoom', 'pan', False]
          title: { text: title, font: { size: 20 } },
          hovermode: 'closest',
          barmode: 'relative',
          barnorm: 'percent',
          yaxis: { title: '% Composition' /*tickformat:',e'*/ },
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

const mapStateToProps = (state: any) => {
  return {
    taxonomy: state.searchPage.filters.taxonomy,
    contextualFilters: state.searchPage.filters.contextual.filters,
    environment: state.contextualDataDefinitions.environment,
    traits: state.contextualDataDefinitions,
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

export default connect(mapStateToProps, mapDispatchToProps)(StackChartTraits)
