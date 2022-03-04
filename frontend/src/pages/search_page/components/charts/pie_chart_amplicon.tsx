import React from 'react';
import Plot from 'react-plotly.js';
import {plotly_chart_config} from './plotly_chart'
import { connect } from 'react-redux'
import { startCase } from 'lodash'

class PieChartAmplicon extends React.Component<any> {
  render() {
    let graphData = this.props.taxonomyGraphdata
    const title = startCase(this.props.filter)  +' Plot'
    let labels = []
    let text = []
    let values = []

    if(graphData) {
      for (const [id, sum] of Object.entries(graphData)) {
        text.push(id)
        values.push(sum)
      }
    }

    for(let option of this.props.options){
        if(this.props.selected.value === '' || String(this.props.selected.value) === String(option.id)) {
            labels.push(option.value)
            text.push(option.id)
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
        type: 'pie',
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
        config={plotly_chart_config(title)}
        layout={{
          autosize: true,
          width: this.props.width, height: this.props.height,
          title: {'text':title, 'font':{  'size': 20}, 'position':'middle center'},
          hovermode: 'closest'
        }}
      />
      <span id={this.props.filter}></span>
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    options: state.referenceData.amplicons.values,
    selected: state.searchPage.filters.selectedAmplicon
  }
}

export default connect(
  mapStateToProps
)(PieChartAmplicon)
