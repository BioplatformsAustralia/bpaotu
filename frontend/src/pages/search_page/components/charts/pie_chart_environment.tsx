import React from 'react'
import Plot from './plot'
import { useAppDispatch, useAppSelector } from 'hooks/redux'
import type { RootState } from 'app/store'
import { plotly_chart_config } from './plotly_chart'

import { fetchContextualDataForGraph } from 'reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from 'reducers/taxonomy_data_graph'

import { selectEnvironment } from '../../reducers/contextual'

const PieChartEnvironment = (props) => {
  const dispatch = useAppDispatch()
  const { filter, contextualGraphdata, width, height, selectToScroll, selectTab } = props
  const options = useAppSelector((state: RootState) => state.contextualDataDefinitions.environment)

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
      dispatch(selectEnvironment(env_val))
      dispatch(fetchContextualDataForGraph())
      dispatch(fetchTaxonomyDataForGraph())
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

export default PieChartEnvironment
