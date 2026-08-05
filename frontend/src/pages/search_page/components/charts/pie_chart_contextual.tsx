import React, { useCallback } from 'react'
import Plot from './plot'
import { plotly_chart_config } from './plotly_chart'
import { find } from 'lodash'
import { useAppDispatch, useAppSelector } from 'hooks/redux'
import type { RootState } from 'app/store'

import { fetchContextualDataForGraph } from 'reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from 'reducers/taxonomy_data_graph'

import {
  changeContextualFilterOperator,
  changeContextualFilterValue,
  changeContextualFilterValue2,
  selectContextualFilter,
} from '../../reducers/contextual'

const PieChartContextual = (props) => {
  const dispatch = useAppDispatch()
  const { filter, contextualGraphdata, width, height, selectToScroll, selectTab } = props
  const filters = useAppSelector((state: RootState) => state.searchPage.filters)
  const dataDefinitions = useAppSelector(
    (state: RootState) => state.contextualDataDefinitions.filters,
  )

  const findFilterIndex = useCallback((data, selected) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i].name === selected) return i
    }
    return data.length
  }, [])

  let graphData = contextualGraphdata[filter]
  let dataDefinition = find(dataDefinitions, (dd) => dd.name === filter)

  let title = ''
  let labels = []
  let values = []
  let text = []

  if (graphData && graphData.length > 1) {
    text = graphData[0]
    values = graphData[1]
  }

  if (dataDefinition) {
    title = dataDefinition.display_name + ' Plot'
    for (const value of Object.values(dataDefinition.values)) {
      if (text.includes(value[0])) {
        labels.push(value[0] === 0 && value[1] === '' ? 'Null' : value[1])
      }
    }
  }

  let chart_data = [
    {
      labels: labels,
      values: values,
      text: text,
      textinfo: 'label+value+percent',
      type: 'pie',
      opacity: 0.8,
      automargin: true,
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

  const handleClick = (e) => {
    const { points } = e
    let env_val = points[0].text
    let textData = chart_data[0].text
    if (!textData.includes(env_val)) env_val = ''
    let index = findFilterIndex(filters.contextual.filters, filter)
    dispatch(selectContextualFilter(index, filter))
    dispatch(changeContextualFilterOperator(index, ''))
    dispatch(changeContextualFilterValue(index, env_val))
    dispatch(changeContextualFilterValue2(index, env_val))
    dispatch(fetchContextualDataForGraph())
    dispatch(fetchTaxonomyDataForGraph())
    selectToScroll(filter)
    selectTab('tab_contextual')
  }

  return (
    <>
      <Plot
        data={chart_data}
        layout={{
          autosize: true,
          width: width,
          height: height,
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

export default PieChartContextual
