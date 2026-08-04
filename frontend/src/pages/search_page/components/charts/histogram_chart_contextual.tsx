import React, { useCallback } from 'react'
import Plot from './plot'
import { plotly_chart_config } from './plotly_chart'
import { find, isString } from 'lodash'
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

const HistogramChartContextual = (props: any) => {
  const dispatch = useAppDispatch()
  const markerLineWidth = []

  const findFilterIndex = useCallback((data: any[], selected: any) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i].name === selected) return i
    }
    return data.length
  }, [])

  const { filter, contextualGraphdata, width, height, selectToScroll, selectTab } = props
  const filters = useAppSelector((state: RootState) => state.searchPage.filters)
  const contextualDataDefinitions = useAppSelector(
    (state: RootState) => state.contextualDataDefinitions.filters
  )
  const dataDefinitions = props.dataDefinitions ?? contextualDataDefinitions

  const graphData = contextualGraphdata[filter]
  const dataDefinition = find(dataDefinitions, (dd) => dd.name === filter)

  let title = ''
  let xaxisTitle = ''

  if (dataDefinition) {
    title = dataDefinition.display_name + ' zz Plot'
    xaxisTitle =
      dataDefinition.display_name +
      (dataDefinition.units ? ' in (' + dataDefinition.units + ')' : '')
  }

  let values: any[] = []
  let text: any[] = []
  let xaxisCategory = ''

  if (graphData && graphData.length > 1) {
    text = graphData[0]
    values = graphData[1]
    xaxisCategory = text.length < 5 || isString(text[0]) ? 'category' : ''
  }

  const chart_data = [
    {
      y: values,
      x: text,
      type: 'bar',
      opacity: 0.8,
      marker: {
        line: {
          width: markerLineWidth,
        },
      },
    },
  ]

  const handleSelected = (e: any) => {
    if (!e) return
    const { points } = e
    if (!points) return

    let value = points[0].label
    let value2 = points[0].label

    for (let i = 1; i < points.length; ++i) {
      let point = points[i].label
      value = point < value ? point : value
      value2 = point > value2 ? point : value2
    }

    const index = findFilterIndex(filters.contextual.filters, filter)
    dispatch(selectContextualFilter(index, filter))
    dispatch(changeContextualFilterOperator(index, ''))
    dispatch(changeContextualFilterValue(index, value))
    dispatch(changeContextualFilterValue2(index, value2))
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
          width,
          height,
          dragmode: 'select',
          title: { text: title, font: { size: 20 } },
          hovermode: 'closest',
          yaxis: { title: 'Frequency', exponentformat: 'e' },
          xaxis: { title: xaxisTitle, type: xaxisCategory, exponentformat: 'e' },
        }}
        config={plotly_chart_config(title)}
        onSelected={handleSelected}
      />
      <span id={filter}></span>
    </>
  )
}

export default HistogramChartContextual
