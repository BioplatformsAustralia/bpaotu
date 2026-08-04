import React from 'react'
import Plot from './plot'
import { plotly_chart_config } from './plotly_chart'
import { useAppDispatch, useAppSelector } from 'hooks/redux'
import type { RootState } from 'app/store'
import { startCase } from 'lodash'

import { fetchContextualDataForGraph } from 'reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from 'reducers/taxonomy_data_graph'

import { selectTrait } from '../../reducers/trait'
import { updateTaxonomyDropDowns } from '../../reducers/taxonomy'

const PieChartTraits = (props: any) => {
  const dispatch = useAppDispatch()
  const {
    taxonomyGraphdata,
    filter,
    width,
    height,
    selectToScroll,
    selectTab,
  } = props

  const title = startCase(filter) + ' Plot'

  let labels: string[] = []
  let text: string[] = []
  let values: any[] = []

  if (taxonomyGraphdata) {
    for (const [id, sum] of Object.entries(taxonomyGraphdata)) {
      text.push(id)
      values.push(sum)
      labels.push(id)
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

  const handleClick = (e: any) => {
    const { points } = e
    if (points) {
      let env_val = points[0].text
      let textData = chart_data[0].text
      if (!textData.includes(env_val)) env_val = ''
      dispatch(selectTrait(env_val))
      dispatch(updateTaxonomyDropDowns('')())
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
        config={plotly_chart_config(title)}
        layout={{
          autosize: true,
          width,
          height,
          title: { text: title, font: { size: 20 }, position: 'middle center' },
          hovermode: 'closest',
        }}
        onClick={handleClick}
      />
      <span id={filter}></span>
    </>
  )
}

export default PieChartTraits
