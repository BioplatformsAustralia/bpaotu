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
  // state = {
  //   markerLineWidth: [],
  // }

  // public highlightSelected = (data, selected, lineWidth) => {
  //   let markerLineWidth = []
  //   for (var i = 0; i < data.length; i++) {
  //     markerLineWidth[i] = data[i] == selected ? lineWidth : 0
  //   };
  //   return markerLineWidth
  // }

  // public componentDidMount() {
  //   this.props.fetchContextualDataForGraph()
  // }

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
        // values: [5964, 256, 18, 299, 238, 18, 2, 302, 20, 330, 160, 18, 18, 231, 6, 589],
        // labels: ['', 'Cropland', 'Dune', 'Forest', 'Grassland', 'Heathland', 'Mangrove', 'Marine - neritic (coastal off shore)', 'Marsh/bog', 'Moss and lichen', 'Other', 'Rehabilitation area', 'Savannah', 'Shrubland', 'Sparse open woodland', 'Woodland'],
        // text: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
        labels: labels,
        values:values,
        text: text,
        textinfo: 'label+value+percent',
        type: 'pie',
        opacity: 0.8,
        automargin: true,
        // margin:[140, 40, 50, 50, 0],
        insidetextorientation: "radial",
        textposition: 'inside',
        // pull: [0.1, 0, 0, 0, 0],
        marker: {
          line: {
            width: 2,
            color: 'white',
            // width: this.state.markerLineWidth,
          }
        },
      }]

    return (
      <>
      <Plot
        data={chart_data}
        layout={{ 
          autosize: true, 
          // width: 640, height: 480, 
          title: {'text':title, 'font':{'size': 20}}, 
         hovermode: 'closest',  
        //  paper_bgcolor: '#fafafa',
        //  plot_bgcolor: '#fafafa',
        //  margin: {l: 10, r:10, b: 10, t: 10}
        }}
        config={plotly_chart_config(title)}
        // onClick={evt => this.props.selectEnvironment(evt.points[0].label)}
        onClick={e => {
          const { points } = e;
          let env_val = points[0].text
          let textData = chart_data[0].text
          if (!textData.includes(env_val))
            env_val = ''
          // console.log(points[0])
          // console.log("onClick", env_val, points[0].label)
          // this.props.addContextualFilter()
          // console.log(this.props.filters.contextual.filters)
          // const filter = 'vegetation_type_id'
          let index = this.findFilterIndex(this.props.filters.contextual.filters, filter)
          // console.log(filter, " index: ", index)
          this.props.selectContextualFilter(index, filter)
          this.props.changeContextualFilterOperator(index,'')
          this.props.changeContextualFilterValue(index, env_val)
          // this.props.changeContextualFilterValue2(env_val)
          // this.props.changeContextualFilterValues(env_val)
          // this.setState({
          //     markerLineWidth: this.highlightSelected(textData , env_val, 3)
          // })
          // this.props.search()
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
