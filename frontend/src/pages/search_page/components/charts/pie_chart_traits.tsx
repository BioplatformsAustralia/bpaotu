import React from 'react';
import Plot from 'react-plotly.js';
import {plotly_chart_config} from './plotly_chart'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { startCase } from 'lodash'
import { selectTrait } from '../../reducers/trait'
import { updateTaxonomyDropDowns } from '../../reducers/taxonomy'
import { search } from '../../reducers/search'
import { fetchContextualDataForGraph } from '../../../../reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from '../../../../reducers/taxonomy_data_graph'

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
        labels.push(id)
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
        onClick={e => {
          const { points } = e;
          if(points) {
            let env_val = points[0].text
            let textData = chart_data[0].text
            if (!textData.includes(env_val))
              env_val = ''
            this.props.selectTrait(env_val)
            this.props.updateTaxonomy()
            this.props.fetchContextualDataForGraph()
            this.props.fetchTaxonomyDataForGraph()
            this.props.selectToScroll(this.props.filter)
            this.props.selectTab('tab_'+this.props.filter)
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
    options: state.referenceData.traits.values,
    selected: state.searchPage.filters.selectedTrait
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      selectTrait,
      updateTaxonomy: updateTaxonomyDropDowns(''),
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
)(PieChartAmplicon)
