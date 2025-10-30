import React from 'react'
import Plot from 'react-plotly.js'
import { plotly_chart_config } from './plotly_chart'
import { connect } from 'react-redux'
import { startCase, fromPairs, unzip } from 'lodash'

import { getAmpliconFilter } from '../../reducers/amplicon'

const PieChartAmplicon = (props) => {
  const { taxonomyGraphdata, filter, options, width, height } = props

  if (!taxonomyGraphdata) {
    return null
  }

  const title = startCase(filter) + ' Plot'
  const ampliconsById = fromPairs(options.map((kv) => [kv.id, kv.value]))

  const [labels, values] = unzip(
    Object.entries(taxonomyGraphdata).map(([id, sum]) => [ampliconsById[id], sum])
  )

  const chart_data = [
    {
      values,
      labels,
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
          width,
          height,
          title: { text: title, font: { size: 20 }, position: 'middle center' },
          hovermode: 'closest',
        }}
      />
      <span id={filter}></span>
    </>
  )
}

function mapStateToProps(state) {
  return {
    options: state.referenceData.amplicons.values,
    selected: getAmpliconFilter(state),
  }
}

export default connect(mapStateToProps)(PieChartAmplicon)
