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

class HistogramChart extends React.Component<any> {
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
        // y: [1,2,3,5,8,7,12,13,21,34,41,60,72,77,83,103,122,121,107,94,94,90,70,61,50,40,27,23,22,22,24,19,16,10,9,13,20,18,16,32,23,19,12,15,18,1,1,1,23,1,2,1,25,2,1,1,2,2,2,2,1,23,3,1,1,2,29,2,16,14,23,12,2,1,7,2,1,1],
        // x: [3,3.1,3.2,3.3,3.4,3.5,3.6,3.7,3.8,3.9,4,4.1,4.2,4.3,4.4,4.5,4.6,4.7,4.8,4.9,5,5.1,5.2,5.3,5.4,5.5,5.6,5.7,5.8,5.9,6,6.1,6.2,6.3,6.4,6.5,6.6,6.7,6.8,6.9,7,7.1,7.2,7.3,7.4,7.42,7.44,7.47,7.5,7.54,7.58,7.59,7.6,7.61,7.62,7.63,7.64,7.65,7.66,7.67,7.69,7.7,7.72,7.74,7.77,7.78,7.8,7.84,7.9,8,8.1,8.2,8.3,8.4,8.5,8.6,8.7,8.8],
        y: values,
        x: text,
        type: 'bar',
        // nbinsx: 50, 
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
          // width: 1024, height: 720, 
          dragmode:'select',
          title: {'text':title, 'font':{'size': 20}}, 
          hovermode: 'closest', 
          yaxis: {title: 'Frequency'}, xaxis: {title: xaxisTitle },
          // paper_bgcolor: '#fafafa',
          // plot_bgcolor: '#fafafa',
       }}
        config={plotly_chart_config(title)}
        onSelected={e => {
          if (e) {
            const { points } = e;
            if(points) {
              // console.log(points)
              let value = points[0].label;
              let value2 = points[0].label;
              for (let i = 1; i < points.length; ++i) {
                let point = points[i].label
                value = (point < value) ? point : value
                value2 = (point > value2) ? point : value2
              }
              // const filter = 'ph'
              let index = this.findFilterIndex(this.props.filters.contextual.filters, filter)
              this.props.selectContextualFilter(index, filter)
              this.props.changeContextualFilterOperator(index,'')
              this.props.changeContextualFilterValue(index, value)
              this.props.changeContextualFilterValue2(index, value2)
              // this.setState({
              //     markerLineWidth: this.highlightSelected(textData , env_val, 3)
              // })
              // this.props.search()
              this.props.fetchContextualDataForGraph()
              this.props.fetchTaxonomyDataForGraph()
              this.props.selectToScroll(this.props.filter)
            }
          }
        }}
        // onClick={e => {
        //   const { points } = e;
        //   console.log(points[0])
        // //   console.log("onClick", points[0].text, points[0].label)
        //   this.setState({
        //     // markerLineWidth: this.highlightSelectedPie(chart_data[0].text, points[0].text, 3)
        //   })
        // //   this.props.selectEnvironment(points[0].text)
        // //   this.props.search()
        // }}
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
)(HistogramChart)
