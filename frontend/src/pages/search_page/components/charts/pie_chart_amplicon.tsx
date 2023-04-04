import React from 'react'
import Plot from 'react-plotly.js'
import { plotly_chart_config } from './plotly_chart'
import { connect } from 'react-redux'
import { startCase, fromPairs, unzip } from 'lodash'
import { getAmpliconFilter } from '../../reducers/amplicon'

class PieChartAmplicon extends React.Component<any> {
  render() {
    let graphData = this.props.taxonomyGraphdata
    if (!graphData) {
      return null
    }
    const title = startCase(this.props.filter) + ' Plot'
    const ampliconsById = fromPairs(this.props.options.map((kv) => [kv.id, kv.value]))

    const [labels, values] = unzip(
      Object.entries(graphData).map(([id, sum]) => [ampliconsById[id], sum])
    )

    let chart_data = [
      {
        values: values,
        labels: labels,
        textinfo: 'label+value+percent',
        automargin: true,
        opacity: 0.8,
        type: 'pie',
        insidetextorientation: 'radial',
        textposition: 'inside',
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
          config={plotly_chart_config(title)}
          layout={{
            autosize: true,
            width: this.props.width,
            height: this.props.height,
            title: { text: title, font: { size: 20 }, position: 'middle center' },
            hovermode: 'closest',
          }}
        />
        <span id={this.props.filter}></span>
      </>
    )
  }
}

function mapStateToProps(state) {
  return {
    options: state.referenceData.amplicons.values,
    selected: getAmpliconFilter(state),
  }
}

export default connect(mapStateToProps)(PieChartAmplicon)
