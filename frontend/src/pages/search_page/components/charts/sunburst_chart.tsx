import React from 'react'
import Plot from 'react-plotly.js'
import {plotly_chart_config} from './plotly_chart'
import { find, isUndefined, sum } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { selectEnvironment } from '../../reducers/contextual'
import { search } from '../../reducers/search'
import { updateTaxonomyDropDowns } from '../../reducers/taxonomy'
import { fetchContextualDataForGraph } from '../../../../reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from '../../../../reducers/taxonomy_data_graph'
import { createAction } from 'redux-actions'

class SunBurstChart extends React.Component<any> {

  public loadTaxonomyData = (parentLabel, taxonomy, taxa, taxonomyGraphData) => {
    let labels = [], parents = [], ids = [], text = [], values = [], selectedTaxonomy = taxonomy.selected.value
    let total = sum(Object.values(taxonomyGraphData).map(abundance=>Number(abundance)))

    if(selectedTaxonomy)
    {
      let lab = find(taxonomy.options, opt => String(opt.id) === String(selectedTaxonomy))
      if(lab) 
      {
        labels.push(lab.value)
        parents.push(parentLabel)
        ids.push(taxa+selectedTaxonomy)
        text.push(taxa)
        values.push(total)
      }
    }
    else{
      for(const option of taxonomy.options){
        let val = taxonomyGraphData[option.id]
        if(isUndefined(val))
          val = 0
        else {
          labels.push(option.value)
          parents.push(parentLabel)
          ids.push(taxa+option.value)
          text.push(taxa)
          values.push(val)
        }
      }
    }
    const graphData = {"labels":labels, "parents": parents, "selectedTaxonomy":selectedTaxonomy, "text":text, "ids": ids, "values": values}
    return graphData
  }

  public onSelectTaxonomy = (taxa, value) => {
    const taxonomy = {
      kingdom:  (value) => {
        this.props.selectValueKingdom(find(this.props.taxonomy.kingdom.options, obj => String(obj.value) === String(value)).id)
        this.props.onChangeKingdom(taxa)
      },
      phylum: (value) => {
        this.props.selectValuePhylum(find(this.props.taxonomy.phylum.options, obj => String(obj.value) === String(value)).id)
        this.props.onChangePhylum(taxa)
      },
      class: (value) => {
        this.props.selectValueClass(find(this.props.taxonomy.class.options, obj => String(obj.value) === String(value)).id)
        this.props.onChangeClass(taxa)
      },
      order: (value) => {
        this.props.selectValueOrder(find(this.props.taxonomy.order.options, obj => String(obj.value) === String(value)).id)
        this.props.onChangeOrder(taxa)
      },
      family: (value) => {
        this.props.selectValueFamily(find(this.props.taxonomy.family.options, obj => String(obj.value) === String(value)).id)
        this.props.onChangeFamily(taxa)
      },
      genus: (value) => {
        this.props.selectValueGenus(find(this.props.taxonomy.genus.options, obj => String(obj.value) === String(value)).id)
        this.props.onChangeGenus(taxa)
      },
      species: (value) => {
        this.props.selectValueSpecies(find(this.props.taxonomy.species.options, obj => String(obj.value) === String(value)).id)
        this.props.onChangeSpecies(taxa)
      }
    }
    taxonomy[taxa](value)
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
    const title = "Taxonomy Plot"
    const graphData = this.generateGraphData()
    let data = []
    if(graphData.ids.length>1) {
      data = [{
        type: "sunburst",
        parents: graphData.parents,
        ids:  graphData.ids,
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
            title: {'text':title, 'font':{'size': 20}}, 
            hovermode: 'closest', 
          }}
          config={plotly_chart_config(title)}
          onClick={e => {
            const { points } = e;
            if(points) {
              if(isUndefined(e.nextLevel) && points[0].label !== points[0].root && this.props.taxonomy[points[0].text].selected.value===""){
                this.onSelectTaxonomy(points[0].text, points[0].label)
                this.props.selectToScroll(this.props.filter)
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

  public generateGraphData() {
    let labels=[], parents=[], ids=[], text=[], values=[] 
    if(!this.props.taxonomyIsLoading && this.props.taxonomyGraphdata.taxonomy) 
    {
      const kingdomData = this.loadTaxonomyData("", this.props.taxonomy.kingdom, "kingdom", this.props.taxonomyGraphdata.taxonomy)
      const phylumData = this.loadTaxonomyData("kingdom"+kingdomData.selectedTaxonomy, this.props.taxonomy.phylum, "phylum", this.props.taxonomyGraphdata.taxonomy)
      const classData = this.loadTaxonomyData("phylum"+phylumData.selectedTaxonomy, this.props.taxonomy.class, "class", this.props.taxonomyGraphdata.taxonomy)
      const orderData = this.loadTaxonomyData("class"+classData.selectedTaxonomy, this.props.taxonomy.order, "order", this.props.taxonomyGraphdata.taxonomy)
      const familyData = this.loadTaxonomyData("order"+orderData.selectedTaxonomy, this.props.taxonomy.family, "family", this.props.taxonomyGraphdata.taxonomy)
      const genusData = this.loadTaxonomyData("family"+familyData.selectedTaxonomy, this.props.taxonomy.genus, "genus", this.props.taxonomyGraphdata.taxonomy)
      const speciesData = this.loadTaxonomyData("genus"+genusData.selectedTaxonomy, this.props.taxonomy.species, "species", this.props.taxonomyGraphdata.taxonomy)

      labels = [
        ...Array.from(kingdomData.labels), 
        ...Array.from(phylumData.labels), 
        ...Array.from(classData.labels), 
        ...Array.from(orderData.labels),
        ...Array.from(familyData.labels),
        ...Array.from(genusData.labels),
        ...Array.from(speciesData.labels)
      ]
      parents = [
        ...Array.from(kingdomData.parents),
        ...Array.from(phylumData.parents),
        ...Array.from(classData.parents),
        ...Array.from(orderData.parents),
        ...Array.from(familyData.parents),
        ...Array.from(genusData.parents),
        ...Array.from(speciesData.parents)
      ]
      ids = [
        ...Array.from(kingdomData.ids), 
        ...Array.from(phylumData.ids), 
        ...Array.from(classData.ids), 
        ...Array.from(orderData.ids),
        ...Array.from(familyData.ids),
        ...Array.from(genusData.ids),
        ...Array.from(speciesData.ids)
      ]
      text = [
        ...Array.from(kingdomData.text), 
        ...Array.from(phylumData.text), 
        ...Array.from(classData.text), 
        ...Array.from(orderData.text),
        ...Array.from(familyData.text),
        ...Array.from(genusData.text),
        ...Array.from(speciesData.text)
      ]
      values = [
        ...Array.from(kingdomData.values), 
        ...Array.from(phylumData.values), 
        ...Array.from(classData.values), 
        ...Array.from(orderData.values),
        ...Array.from(familyData.values),
        ...Array.from(genusData.values),
        ...Array.from(speciesData.values)
      ]

      
    } 
    return {"labels":labels, "parents": parents, "text":text, "ids": ids, "values": values}
  }
}

function mapStateToProps(state) {
  return {
    taxonomy: state.searchPage.filters.taxonomy,
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      selectEnvironment,
      selectValueKingdom: createAction('SELECT_KINGDOM'),
      onChangeKingdom: updateTaxonomyDropDowns('kingdom'),
      selectValuePhylum: createAction('SELECT_PHYLUM'),
      onChangePhylum: updateTaxonomyDropDowns('phylum'),
      selectValueClass: createAction('SELECT_CLASS'),
      onChangeClass: updateTaxonomyDropDowns('class'),
      selectValueOrder: createAction('SELECT_ORDER'),
      onChangeOrder: updateTaxonomyDropDowns('order'),
      selectValueFamily: createAction('SELECT_FAMILY'),
      onChangeFamily: updateTaxonomyDropDowns('family'),
      selectValueGenus: createAction('SELECT_GENUS'),
      onChangeGenus: updateTaxonomyDropDowns('genus'),
      selectValueSpecies: createAction('SELECT_SPECIES'),
      onChangeSpecies: updateTaxonomyDropDowns('species'),
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
)(SunBurstChart)
