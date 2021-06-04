import React from 'react';
import Plot from 'react-plotly.js';
import { connect } from 'react-redux'
import {plotly_chart_config} from './plotly_chart'
import { bindActionCreators } from 'redux'
import { selectEnvironment } from '../../reducers/contextual'
import { search } from '../../reducers/search'
import { fetchContextualDataForGraph } from '../../../../reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from '../../../../reducers/taxonomy_data_graph'

class PieChartEnvironment extends React.Component<any> {
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

  render() {
    let filter = this.props.filter
    let graphData = this.props.contextualGraphdata[filter]
    let title = 'AM Environment Plot'

    let labels = []
    let values = []
    let text = []

    if(graphData && graphData.length>1) {
      text = graphData[0]
      values = graphData[1]
    }

    for(let selected_txt of text){
      for(let option of this.props.options){
        if(option.id === selected_txt)
          labels.push(option.name)
      }
    }
    
    let chart_data = [
      {
        values: values,
        labels: labels,
        text: text,
        textinfo: 'label+value+percent',
        automargin: true,
        opacity: 0.8,
        insidetextorientation: "radial",
        textposition: 'inside',
        font: {
          family: 'Heebo, Overpass, sans-serif',
          // color: theme.fgGrey
        },
        type: 'pie',
        marker: {
          line: {
            width: 2,
            color: 'white',
            // width: this.state.markerLineWidth,
          },
        }
      }]

    return (
      <>
      <Plot 
        data={chart_data}
        layout={{ 
          autosize: true,
          // width: 960, height: 720, 
          title: {'text':title, 'font':{'size': 20}}, 
          hovermode: 'closest' }}
        config={plotly_chart_config(title)}
        // onClick={evt => this.props.selectEnvironment(evt.points[0].label)}
        onClick={e => {
          const { points } = e;
          if(points) {
            let env_val = points[0].text
            let textData = chart_data[0].text
            if (!textData.includes(env_val))
              env_val = ''
            // console.log(points[0])
            // console.log("onClick", env_val, points[0].label)
            this.props.selectEnvironment(env_val)
            // this.setState({
            //   markerLineWidth: this.highlightSelected(textData , env_val, 3)
            // })
            // this.props.search()
            this.props.fetchContextualDataForGraph()
            this.props.fetchTaxonomyDataForGraph()
            this.props.selectToScroll(this.props.filter)
          }
        }}
        // onDoubleClick={e => {
        //   const { points } = e;
        //   if(points) {
        //     let env_val = points[0].text
        //     let textData = chart_data[0].text
        //     if (!chart_data[0].text.includes(env_val))
        //       env_val = ''
        //     // console.log(points[0])
        //     console.log("onDoubleClick", env_val, points[0].label)
        //     this.props.selectEnvironment()
        //     this.setState({
        //       markerLineWidth: this.highlightSelected(textData , env_val, 0)
        //     })
        //     this.props.search()
        //     this.props.fetchContextualDataForGraph()
        //   }
        // }}
      />
      <span id={this.props.filter}></span>
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    selected: state.searchPage.filters.contextual.selectedEnvironment,
    options: state.contextualDataDefinitions.environment
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      selectEnvironment,
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
)(PieChartEnvironment)
