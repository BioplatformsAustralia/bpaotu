import React, { useCallback } from 'react'
import Plot from 'react-plotly.js'
import { plotly_chart_config } from './plotly_chart'
import { find, isUndefined, sum, startCase } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createAction } from 'redux-actions'

import { taxonomy_ranks } from 'app/constants'
import { fetchContextualDataForGraph } from 'reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from 'reducers/taxonomy_data_graph'

import { selectEnvironment } from '../../reducers/contextual'
import { updateTaxonomyDropDowns } from '../../reducers/taxonomy'

const make_id = (name: string, tx_id: string | number) => `${name}_${tx_id}`

const SunBurstChartTaxonomy = (props: any) => {
  const loadTaxonomyData = useCallback(
    (sunburst_data, parentId, taxonomy, taxa, taxa_label, taxonomyGraphData) => {
      let selectedTaxonomy = taxonomy.selected.value
      if (selectedTaxonomy) {
        let lab = find(taxonomy.options, (opt) => String(opt.id) === String(selectedTaxonomy))
        if (lab) {
          let total = sum(Object.values(taxonomyGraphData).map((abundance) => Number(abundance)))
          sunburst_data.labels.push(lab.value)
          sunburst_data.parents.push(parentId)
          sunburst_data.ids.push(make_id(taxa, selectedTaxonomy))
          sunburst_data.text.push(taxa_label)
          sunburst_data.customdata.push(taxa)
          sunburst_data.values.push(total)
        }
      } else {
        for (const option of taxonomy.options) {
          let val = taxonomyGraphData[option.id]
          if (isUndefined(val)) val = 0
          else {
            sunburst_data.labels.push(option.value)
            sunburst_data.parents.push(parentId)
            sunburst_data.ids.push(make_id(taxa, option.value))
            sunburst_data.text.push(taxa_label)
            sunburst_data.customdata.push(taxa)
            sunburst_data.values.push(val)
          }
        }
      }
      return selectedTaxonomy
    },
    []
  )

  const onSelectTaxonomy = useCallback(
    (taxa: string, value: any) => {
      const found = find(props.taxonomy[taxa].options, (obj) => String(obj.value) === String(value))
      if (found && found.id !== undefined) {
        props.selectTaxonomyValue(taxa, found.id)
        props.updateTaxonomyDropDown(taxa)
        props.fetchContextualDataForGraph()
        props.fetchTaxonomyDataForGraph()
      }
    },
    [props]
  )

  const get_clickable_rank = useCallback(
    (e: any) => {
      const cd = e.points[0].customdata
      const rank = Array.isArray(cd) ? cd[0] : cd // cd will be 1-element array for pie chart
      return isUndefined(e.nextLevel) &&
        e.points[0].label !== e.points[0].root &&
        props.taxonomy[rank].selected.value === ''
        ? rank
        : null
    },
    [props.taxonomy]
  )

  const generateGraphData = useCallback(() => {
    let sunburst_data = { labels: [], parents: [], text: [], ids: [], values: [], customdata: [] }
    if (props.taxonomyGraphdata && props.taxonomyGraphdata.taxonomy) {
      let parentId = ''
      for (const taxa of taxonomy_ranks) {
        const taxa_label = props.rankLabels[taxa]
        if (!taxa_label) {
          break // Reached the last rank for the current taxonomy
        }
        const selectedTaxonomy = loadTaxonomyData(
          sunburst_data,
          parentId,
          props.taxonomy[taxa],
          taxa,
          taxa_label,
          props.taxonomyGraphdata.taxonomy
        )
        parentId = make_id(taxa, selectedTaxonomy)
      }
    }
    return sunburst_data
  }, [props.taxonomyGraphdata, props.rankLabels, props.taxonomy, loadTaxonomyData])

  const title = startCase(props.filter) + ' Plot'
  const graphData = generateGraphData()

  const data =
    graphData.ids.length > 1
      ? [
          {
            type: 'sunburst',
            parents: graphData.parents,
            ids: graphData.ids,
            customdata: graphData.customdata,
            text: graphData.text,
            values: graphData.values,
            branchvalues: 'total',
            texttemplate: '%{label}<br>%{text}<br>%{value}<br>%{percentEntry:.2%}',
            hovertemplate: '%{label}<br>%{text}<br>%{value}<br>%{percentEntry:.2%}<extra></extra>',
            labels: graphData.labels,
            leaf: { opacity: 0.8 },
            marker: { line: { width: 2 } },
            textposition: 'inside',
          },
        ]
      : [
          {
            labels: graphData.labels,
            values: graphData.values,
            customdata: graphData.customdata,
            text: graphData.text,
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

  return (
    <>
      <Plot
        data={data}
        layout={{
          autosize: true,
          width: props.width,
          height: props.height,
          title: { text: title, font: { size: 20 } },
          hovermode: 'closest',
        }}
        config={plotly_chart_config(title)}
        onHover={(e) => {
          // This may be the least ugly way to set a pointer cursor for our
          // click handler. There's no documented way to identify the outer
          // slices in the DOM, so we can't do it reliably with CSS selectors.
          if (e.points && get_clickable_rank(e)) {
            e.event.currentTarget.style.cursor = 'pointer'
          }
        }}
        onClick={(e) => {
          const { points } = e
          if (points) {
            const rank = get_clickable_rank(e)
            if (rank) {
              onSelectTaxonomy(rank, points[0].label)
              props.selectToScroll(props.filter)
              props.selectTab('tab_' + props.filter)
            } else {
              return false
            }
          }
        }}
      />
      <span id={props.filter}></span>
    </>
  )
}

const mapStateToProps = (state) => {
  return {
    taxonomy: state.searchPage.filters.taxonomy,
    rankLabels: state.referenceData.ranks.rankLabels,
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators(
    {
      selectEnvironment,
      selectTaxonomyValue: (taxa, id) => createAction('SELECT_' + taxa.toUpperCase())(id),
      updateTaxonomyDropDown: (taxa) => updateTaxonomyDropDowns(taxa)(),
      fetchContextualDataForGraph,
      fetchTaxonomyDataForGraph,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SunBurstChartTaxonomy)
