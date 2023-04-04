import React from 'react'
import Plot from 'react-plotly.js'
import { connect } from 'react-redux'
import { plotly_chart_config } from './plotly_chart'
import { bindActionCreators } from 'redux'

import { fetchContextualDataForGraph } from 'reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from 'reducers/taxonomy_data_graph'

import { selectEnvironment } from '../../reducers/contextual'

class PieChartEnvironment extends React.Component<any> {
  render() {
    let filter = this.props.filter
    let graphData = this.props.contextualGraphdata[filter]
    let title = 'AM Environment Plot'

    let labels = []
    let values = []
    let text = []

    if (graphData && graphData.length > 1) {
      text = graphData[0]
      values = graphData[1]
    }

    for (let selected_txt of text) {
      for (let option of this.props.options) {
        if (option.id === selected_txt) labels.push(option.name)
      }
    }

    let chart_data = [
      {
        values: values,
        labels: labels,
        text: text,
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

    return (
      <>
        <Plot
          data={chart_data}
          layout={{
            autosize: true,
            width: this.props.width,
            height: this.props.height,
            title: { text: title, font: { size: 20 } },
            hovermode: 'closest',
          }}
          config={plotly_chart_config(title)}
          onClick={(e) => {
            const { points } = e
            if (points) {
              let env_val = points[0].text
              let textData = chart_data[0].text
              if (!textData.includes(env_val)) env_val = ''
              this.props.selectEnvironment(env_val)
              this.props.fetchContextualDataForGraph()
              this.props.fetchTaxonomyDataForGraph()
              this.props.selectToScroll(this.props.filter)
              this.props.selectTab('tab_' + this.props.filter)
            }
          }}
        />
        <span id={this.props.filter}></span>
      </>
    )
  }
}

function mapStateToProps(state) {
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
