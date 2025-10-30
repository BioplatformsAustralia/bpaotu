import React from 'react'
import Plot from 'react-plotly.js'
import { connect } from 'react-redux'
import { plotly_chart_config } from './plotly_chart'
import { bindActionCreators } from 'redux'

import { fetchContextualDataForGraph } from 'reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from 'reducers/taxonomy_data_graph'

import { selectEnvironment } from '../../reducers/contextual'

const PieChartEnvironment = (props) => {
  const {
    filter,
    contextualGraphdata,
    options,
    width,
    height,
    selectEnvironment,
    fetchContextualDataForGraph,
    fetchTaxonomyDataForGraph,
    selectToScroll,
    selectTab,
  } = props

  const graphData = contextualGraphdata[filter]
  const title = 'AM Environment Plot'

  let labels: string[] = []
  let values: any[] = []
  let text: any[] = []

  if (graphData && graphData.length > 1) {
    text = graphData[0]
    values = graphData[1]
  }

  for (let selected_txt of text) {
    for (let option of options) {
      if (option.id === selected_txt) labels.push(option.name)
    }
  }

  const chart_data = [
    {
      values,
      labels,
      text,
      textinfo: 'label+value+percent',
      automargin: true,
      opacity: 0.8,
      insidetextorientation: 'radial',
      textposition: 'inside',
      font: {
        family: 'Heebo, Overpass, sans-serif',
      },
      type: 'pie',
      marker: {
        line: {
          width: 2,
          color: 'white',
        },
      },
    },
  ]

  const handleClick = (e: any) => {
    const { points } = e
    if (points) {
      let env_val = points[0].text
      let textData = chart_data[0].text
      if (!textData.includes(env_val)) env_val = ''
      selectEnvironment(env_val)
      fetchContextualDataForGraph()
      fetchTaxonomyDataForGraph()
      selectToScroll(filter)
      selectTab('tab_' + filter)
    }
  }

  return (
    <>
      <Plot
        data={chart_data}
        layout={{
          autosize: true,
          width,
          height,
          title: { text: title, font: { size: 20 } },
          hovermode: 'closest',
        }}
        config={plotly_chart_config(title)}
        onClick={handleClick}
      />
      <span id={filter}></span>
    </>
  )
}

function mapStateToProps(state: any) {
  return {
    selected: state.searchPage.filters.contextual.selectedEnvironment,
    options: state.contextualDataDefinitions.environment,
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      selectEnvironment,
      fetchContextualDataForGraph,
      fetchTaxonomyDataForGraph,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(PieChartEnvironment)
