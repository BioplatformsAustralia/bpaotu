import React from 'react'
import Plot from 'react-plotly.js'
import {plotly_chart_config} from './plotly_chart'
import { find } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
    addContextualFilter, 
    changeContextualFilterOperator,
    changeContextualFilterValue,
    changeContextualFilterValue2,
    changeContextualFilterValues,
    selectContextualFilter
  } from '../../reducers/contextual'
  import { search } from '../../reducers/search'
  import { fetchContextualDataForGraph } from '../../../../reducers/contextual_data_graph'
  import { fetchTaxonomyDataForGraph } from '../../../../reducers/taxonomy_data_graph'


class PieChart extends React.Component<any> {

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

    let title = ""
    let labels = []
    let values = []
    let text = []

    if(graphData && graphData.length>1) {
      text = graphData[0]
      values = graphData[1]
    }

    if(dataDefinition) {
      title = dataDefinition.display_name + ' Plot'
      for (const value of Object.values(dataDefinition.values)) {
        if(text.includes(value[0])) {
          labels.push(value[1])
        }
      }
    }

    let chart_data = [
      {
        labels: labels,
        values:values,
        text: text,
        textinfo: 'label+value+percent',
        type: 'pie',
        opacity: 0.8,
        automargin: true,
        insidetextorientation: "radial",
        textposition: 'inside',
        marker: {
          line: {
            width: 2,
            color: 'white',
          }
        },
      }]

    return (
      <>
      <Plot
        data={chart_data}
        layout={{ 
          autosize: true,
          width: this.props.width, height: this.props.height,
          title: {'text':title, 'font':{'size': 20}}, 
         hovermode: 'closest',  
        }}
        config={plotly_chart_config(title)}
        onClick={e => {
          const { points } = e;
          let env_val = points[0].text
          let textData = chart_data[0].text
          if (!textData.includes(env_val))
            env_val = ''
          let index = this.findFilterIndex(this.props.filters.contextual.filters, filter)
          this.props.selectContextualFilter(index, filter)
          this.props.changeContextualFilterOperator(index,'')
          this.props.changeContextualFilterValue(index, env_val)
          this.props.fetchContextualDataForGraph()
          this.props.fetchTaxonomyDataForGraph()
          this.props.selectToScroll(this.props.filter)
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
)(PieChart)
