import React from 'react';
import Plot from 'react-plotly.js';
import {plotly_chart_config} from './../charts/plotly_chart'
import { find } from 'lodash';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { selectEnvironment } from '../../reducers/contextual'

class StackChart extends React.Component<any> {

  getSelectedTaxonomy(taxonomy) {
    for(const [name, taxa] of Object.entries(taxonomy)) {
      if(taxa['selected'].value === "") {
        return name
      }
    }
  }

  loadChartData(environment, selectedTaxonomy, taxonomyGraphdata, contextualFilters) {
    let chart_data = []
    if(taxonomyGraphdata.am_environment) {
      let am_environments = taxonomyGraphdata.am_environment?['All']:[]
      for(const am_environment of Object.keys(taxonomyGraphdata.am_environment)) {
        if(environment)
          am_environments.push("All "+find(environment, (option) => option.id === parseInt(am_environment)).name)
      }
      if(String(contextualFilters.length)!=="0") {
        for(const am_environment of Object.keys(taxonomyGraphdata.am_environment_selected)) {
          am_environments.push("Selected "+find(environment, (option) => option.id === parseInt(am_environment)).name)
        }
        for(const am_environment of Object.keys(taxonomyGraphdata.am_environment_non_selected)) {
          am_environments.push("Non selected "+find(environment, (option) => option.id === parseInt(am_environment)).name)
        }
      }
      for(const taxa_values of Object.values(taxonomyGraphdata.am_environment_all)) 
      {
        const taxa_id = taxa_values[0]
        const taxa_abundance = taxa_values[1]
        let taxonomy = {}
        const selectedTaxa = this.getSelectedTaxonomy(selectedTaxonomy)
        const taxa = selectedTaxa?find(selectedTaxonomy[selectedTaxa]['options'], (option) => option.id === parseInt(taxa_id)):undefined
        if(taxa) {
          taxonomy["name"] = taxa.value
          taxonomy["x"] = am_environments
          taxonomy["y"] = [taxa_abundance]

          for(const key of Object.keys(taxonomyGraphdata.am_environment)) {
            taxonomyGraphdata.am_environment[key].forEach(value => {
              if(value[0] === taxa_id) {
                taxonomy["y"].push(value[1])
              }
            })
          }
          for(const key of Object.keys(taxonomyGraphdata.am_environment_selected)) {
            taxonomyGraphdata.am_environment_selected[key].forEach(value => {
              if(value[0] === taxa_id) {
                taxonomy["y"].push(value[1])
              }
            })
          }
          for(const key of Object.keys(taxonomyGraphdata.am_environment_non_selected)) {
            taxonomyGraphdata.am_environment_non_selected[key].forEach(value => {
              if(value[0] === taxa_id) {
                taxonomy["y"].push(value[1])
              }
            })
          }
          let textdisplay = []
          for(const index of Object.keys(taxonomy["name"])) {
            textdisplay[index] = taxonomy["name"]+"<BR>"+taxonomy["y"][index]
          }
          taxonomy["text"] =  textdisplay
          taxonomy["texttemplate"] = '%{text}<br>%{value}%'
          taxonomy["hovertemplate"] = '%{label}<br>%{text}<br>%{value}%'
          taxonomy["textposition"] = 'inside'
          taxonomy["textangle"] = '0'
          taxonomy["type"] = 'bar'
          taxonomy["marker"] = {
            line: {
              width: 0,
              color: 'white',
            }
          }
          chart_data.push(taxonomy)
        }
      }
    }
    return chart_data
  }

  render() {
    const title = 'Taxonomy vs AM Environment Plot'
    return (
      <>
      <Plot
        data={this.loadChartData(this.props.environment, this.props.taxonomy, this.props.taxonomyGraphdata, this.props.contextualFilters)}
        layout={{
          autosize: true,
          dragmode:'False', //['orbit', 'turntable', 'zoom', 'pan', False]
          title: {'text':title, 'font':{'size': 20}}, 
          hovermode: 'closest', 
          barmode:'relative',
          barnorm: 'percent',
          yaxis: {title: '% Composition', /*tickformat:',e'*/}, 
          xaxis: {title: 'AM_Environment'},
      }}
        config={plotly_chart_config(title)}
      />
      <span id={this.props.filter}></span>
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    taxonomy: state.searchPage.filters.taxonomy,
    contextualFilters: state.searchPage.filters.contextual.filters,
    environment: state.contextualDataDefinitions.environment
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      selectEnvironment
    },
    dispatch
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(StackChart)
