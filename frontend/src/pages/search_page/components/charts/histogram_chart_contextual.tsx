import React from 'react';
import Plot from 'react-plotly.js';
import {plotly_chart_config} from './plotly_chart'
import { find } from 'lodash'
import { search } from '../../reducers/search'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fetchContextualDataForGraph } from '../../../../reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from '../../../../reducers/taxonomy_data_graph'

import {
  addContextualFilter, 
  changeContextualFilterOperator,
  changeContextualFilterValue,
  changeContextualFilterValue2,
  changeContextualFilterValues,
  selectContextualFilter
} from '../../reducers/contextual'

class HistogramChartContextual extends React.Component<any> {
  state = {
    markerLineWidth: [],
  }

  public highlightSelected = (data, selected, lineWidth) => {
    let markerLineWidth = []
    for (var i = 0; i < data.length; i++) {
      markerLineWidth[i] = data[i] === selected ? lineWidth : 0
    };
    return markerLineWidth
  }

  public findFilterIndex = (data, selected) => {
    let index = 0
    for (var i = 0; i < data.length; i++) {
      index = data[i].name === selected ? i : data.length
    };
    return index
  }

  render() {
    let filter = this.props.filter
    let graphData = this.props.contextualGraphdata[filter]
    let dataDefinition = find(this.props.dataDefinitions, dd => dd.name === filter)
    let title="", xaxisTitle=""
    if(dataDefinition) {
      title = dataDefinition.display_name + ' Plot'
      xaxisTitle = dataDefinition.display_name + (dataDefinition.units?' in ('+dataDefinition.units+')':'')
    }
    let values = []
    let text = []
    if(graphData && graphData.length>1) {
      text = graphData[0]
      values = graphData[1]
    }

    let chart_data = [
      {
        y: values,
        x: text,
        type: 'bar',
        opacity: 0.8,
        marker: {
          line: {
            width: this.state.markerLineWidth
          },
        }}
    ]


    return (
      <>
      <Plot
        data={chart_data}
        layout={{ 
          autosize: true,
          width: this.props.width, height: this.props.height,
          dragmode:'select',
          title: {'text':title, 'font':{'size': 20}}, 
          hovermode: 'closest', 
          yaxis: {title: 'Frequency'}, xaxis: {title: xaxisTitle },
       }}
        config={plotly_chart_config(title)}
        onSelected={e => {
          if (e) {
            const { points } = e;
            if(points) {
              let value = points[0].label;
              let value2 = points[0].label;
              for (let i = 1; i < points.length; ++i) {
                let point = points[i].label
                value = (point < value) ? point : value
                value2 = (point > value2) ? point : value2
              }
              let index = this.findFilterIndex(this.props.filters.contextual.filters, filter)
              this.props.selectContextualFilter(index, filter)
              this.props.changeContextualFilterOperator(index,'')
              this.props.changeContextualFilterValue(index, value)
              this.props.changeContextualFilterValue2(index, value2)
              this.props.fetchContextualDataForGraph()
              this.props.fetchTaxonomyDataForGraph()
              this.props.selectToScroll(this.props.filter)
              this.props.selectTab('tab_contextual')
            }
          }
        }}
      />
      <span id={this.props.filter}></span>
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    filters: state.searchPage.filters,
    dataDefinitions: state.contextualDataDefinitions.filters,
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      addContextualFilter,
      selectContextualFilter,
      changeContextualFilterOperator,
      changeContextualFilterValue,
      changeContextualFilterValue2,
      changeContextualFilterValues,
      search,
      fetchContextualDataForGraph,
      fetchTaxonomyDataForGraph
    },
    dispatch
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HistogramChartContextual)
