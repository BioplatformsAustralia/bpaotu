import React from 'react'
import Plot from 'react-plotly.js'
import { plotly_chart_config } from './../charts/plotly_chart'
import { find, filter } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { selectEnvironment } from '../../reducers/contextual'

class StackChartTraits extends React.Component<any> {
  loadChartData(environment, selectedTaxonomy, taxonomyGraphdata, contextualFilters) {
    let chart_data = []
    if (taxonomyGraphdata.traits_am_environment) {
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
      if (String(contextualFilters.length) !== '0') {
        for (const traits_am_environment of Object.keys(
          taxonomyGraphdata.traits_am_environment_selected
        )) {
          traits_am_environments.push(
            'Selected ' +
              find(environment, (option) => option.id === parseInt(traits_am_environment)).name
          )
        }
        for (const traits_am_environment of Object.keys(
          taxonomyGraphdata.traits_am_environment_non_selected
        )) {
          traits_am_environments.push(
            'Non selected ' +
              find(environment, (option) => option.id === parseInt(traits_am_environment)).name
          )
        }
      }
      for (const taxa_values of Object.values(taxonomyGraphdata.traits_am_environment_all)) {
        const taxa_id = taxa_values[0]
        const taxa_abundance = taxa_values[1]
        let taxonomy = {}
        if (taxa_id) {
          taxonomy['name'] = taxa_id
          taxonomy['x'] = traits_am_environments
          taxonomy['y'] = [taxa_abundance]

          for (const key of Object.keys(taxonomyGraphdata.traits_am_environment)) {
            taxonomyGraphdata.traits_am_environment[key].forEach((value) => {
              if (value[0] === taxa_id) {
                taxonomy['y'].push(value[1])
              }
            })
          }
          for (const key of Object.keys(taxonomyGraphdata.traits_am_environment_selected)) {
            taxonomyGraphdata.traits_am_environment_selected[key].forEach((value) => {
              if (value[0] === taxa_id) {
                taxonomy['y'].push(value[1])
              }
            })
          }
          for (const key of Object.keys(taxonomyGraphdata.traits_am_environment_non_selected)) {
            taxonomyGraphdata.traits_am_environment_non_selected[key].forEach((value) => {
              if (value[0] === taxa_id) {
                taxonomy['y'].push(value[1])
              }
            })
          }
          let textdisplay = []
          for (const index of Object.keys(taxonomy['name'])) {
            textdisplay[index] = taxonomy['name'] + '<BR>' + taxonomy['y'][index]
          }
          taxonomy['text'] = textdisplay
          taxonomy['texttemplate'] = '%{text}<br>%{value}%'
          taxonomy['hovertemplate'] = '%{label}<br>%{text}<br>%{value}%'
          taxonomy['textposition'] = 'inside'
          taxonomy['textangle'] = '0'
          taxonomy['type'] = 'bar'
          taxonomy['marker'] = {
            line: {
              width: 0,
              color: 'white',
            },
          }
          chart_data.push(taxonomy)
        }
      }
    }
    return chart_data
  }

  render() {
    const title = 'Traits vs AM Environment Plot'
    const data = this.loadChartData(
      this.props.environment,
      this.props.taxonomy,
      this.props.taxonomyGraphdata,
      this.props.contextualFilters
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
        ? filter(default_category_order, (item) => data[0].x.includes(item))
        : default_category_order
    return (
      <>
        <Plot
          data={data}
          layout={{
            autosize: true,
            width: this.props.width,
            height: this.props.height,
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
              categoryarray: { category_order },
            },
          }}
          config={plotly_chart_config(title)}
        />
        <span id={this.props.filter}></span>
      </>
    )
  }
}

function mapStateToProps(state) {
  return {
    taxonomy: state.searchPage.filters.taxonomy,
    contextualFilters: state.searchPage.filters.contextual.filters,
    environment: state.contextualDataDefinitions.environment,
    traits: state.contextualDataDefinitions,
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      selectEnvironment,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(StackChartTraits)
