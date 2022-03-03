import React from 'react'
import Plot from 'react-plotly.js'
import {plotly_chart_config} from './plotly_chart'
import { find, isUndefined, sum, startCase } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { selectEnvironment } from '../../reducers/contextual'
import { search } from '../../reducers/search'
import { updateTaxonomyDropDowns } from '../../reducers/taxonomy'
import { fetchContextualDataForGraph } from '../../../../reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from '../../../../reducers/taxonomy_data_graph'
import { createAction } from 'redux-actions'
import { taxonomy_ranks } from '../../../../constants'

const make_id = (name, tx_id) => `${name}_${tx_id}`;

class SunBurstChartTaxonomy extends React.Component<any> {

  public loadTaxonomyData = (sunburst_data, parentId, taxonomy, taxa, taxa_label, taxonomyGraphData) => {
    let selectedTaxonomy = taxonomy.selected.value;
    if(selectedTaxonomy) {
      let lab = find(
        taxonomy.options,
        opt => String(opt.id) === String(selectedTaxonomy))
      if(lab) {
        let total = sum(Object.values(taxonomyGraphData).map(abundance => Number(abundance)))
        sunburst_data.labels.push(lab.value)
        sunburst_data.parents.push(parentId)
        sunburst_data.ids.push(make_id(taxa, selectedTaxonomy))
        sunburst_data.text.push(taxa_label)
        sunburst_data.customdata.push(taxa)
        sunburst_data.values.push(total)
      }
    } else {
      for(const option of taxonomy.options){
        let val = taxonomyGraphData[option.id]
        if(isUndefined(val))
          val = 0
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
  }

  public onSelectTaxonomy = (taxa, value) => {
    const taxa_id = find(
      this.props.taxonomy[taxa].options,
      obj => String(obj.value) === String(value)).id;
    this.props.selectTaxonomyValue(taxa, taxa_id);
    this.props.updateTaxonomyDropDown(taxa);
    this.props.fetchContextualDataForGraph()
    this.props.fetchTaxonomyDataForGraph()
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.contextualGraphdata !== nextProps.contextualGraphdata) {
      return true;
    }
    if (this.props.taxonomyGraphdata !== nextProps.taxonomyGraphdata) {
      return true;
    }
    if (this.props.taxonomy !== nextProps.taxonomy) {
      return true;
    }
    return false;
  }

  render() {
    const title = startCase(this.props.filter)  +' Plot'
    const graphData = this.generateGraphData()
    let data = []
    if(graphData.ids.length>1) {
      data = [{
        type: "sunburst",
        parents: graphData.parents,
        ids:  graphData.ids,
        customdata: graphData.customdata,
        text:  graphData.text,
        values:  graphData.values,
        branchvalues: "total",
        texttemplate: ('%{label}<br>%{text}<br>%{value}<br>%{percentEntry:.2%}'),
        hovertemplate: ('%{label}<br>%{text}<br>%{value}<br>%{percentEntry:.2%}<extra></extra>'),
        labels: graphData.labels,
        leaf: {opacity: 0.8},
        marker: {line: {width: 2}},
        textposition: 'inside',
      }];
    }
    else {
      data = [{
        labels: graphData.labels,
        values:graphData.values,
        customdata: graphData.customdata,
        text: graphData.text,
        textinfo: 'label+value+percent',
        type: 'pie',
        opacity: 0.8,
        automargin: true,
        insidetextorientation: "radial",
        textposition: 'inside',
        marker: {
          line: {
            width: 2,
            color: 'white'
          }
        },
      }];
    }

    return (
      <>
        <Plot
          data={data}
          layout= {{
            autosize: true,
            width: this.props.width, height: this.props.height,
            title: {'text':title, 'font':{'size': 20}},
            hovermode: 'closest',
          }}
          config={plotly_chart_config(title)}

          onHover={e => {
            // This may be the least ugly way to set a pointer cursor for our
            // click handler. There's no documented way to identify the outer
            // slices in the DOM, so we can't do it reliably with CSS selectors.
            if (e.points && this.get_clickable_rank(e)) {
              e.event.currentTarget.style.cursor = 'pointer';
            }
          }}

          onClick={e => {
            const { points } = e;
            if(points) {
              const rank = this.get_clickable_rank(e)
              if (rank) {
                this.onSelectTaxonomy(rank, points[0].label)
                this.props.selectToScroll(this.props.filter)
                this.props.selectTab('tab_' + this.props.filter)
              }
              else
                return false
            }
          }}
        />
        <span id={this.props.filter}></span>
      </>
    );
  }

  get_clickable_rank(e) {
    const cd = e.points[0].customdata
    const rank = Array.isArray(cd)? cd[0]: cd // cd will be 1-element array for pie chart
    return (isUndefined(e.nextLevel) && e.points[0].label !== e.points[0].root &&
      this.props.taxonomy[rank].selected.value === "")? rank : null;
  }

  public generateGraphData() {
    let sunburst_data = {"labels":[], "parents":[], "text":[], "ids":[], "values":[], "customdata":[]}
    if(!this.props.taxonomyIsLoading && this.props.taxonomyGraphdata.taxonomy) {
      let parentId = "";
      for (const taxa of taxonomy_ranks) {
        const taxa_label = this.props.rankLabels[taxa]
        if (!taxa_label) {
          break // Reached the last rank for the current taxonomy
        }
        const selectedTaxonomy = this.loadTaxonomyData(
          sunburst_data,
          parentId,
          this.props.taxonomy[taxa],
          taxa,
          taxa_label,
          this.props.taxonomyGraphdata.taxonomy)
        parentId = make_id(taxa, selectedTaxonomy);
      }
    }
    return sunburst_data;
  }
}

function mapStateToProps(state) {
  return {
    taxonomy: state.searchPage.filters.taxonomy,
    rankLabels: state.referenceData.ranks.rankLabels
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      selectEnvironment,
      selectTaxonomyValue: (taxa, id) => (createAction('SELECT_' + taxa.toUpperCase())(id)),
      updateTaxonomyDropDown: (taxa) => (updateTaxonomyDropDowns(taxa)()),
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
)(SunBurstChartTaxonomy)
