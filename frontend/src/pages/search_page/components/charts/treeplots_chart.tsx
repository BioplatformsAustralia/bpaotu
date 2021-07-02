import React from 'react'
import Plot from 'react-plotly.js'
import {plotly_chart_config} from './../charts/plotly_chart'
import { find, isUndefined } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { selectEnvironment } from '../../reducers/contextual'
import { search } from '../../reducers/search'
import { updateTaxonomyDropDowns } from '../../reducers/taxonomy'
import { fetchContextualDataForGraph } from '../../../../reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from '../../../../reducers/taxonomy_data_graph'
import { createAction } from 'redux-actions'

class TreePlotsChart extends React.Component<any> {

  public loadTaxonomyData = (parentLabel, taxonomy, taxa, taxonomyGraphData) => {
    // console.log("taxa:::", taxa, "parentLabel:::", parentLabel, "taxonomy:::", taxonomy, "taxonomyGraphData:::", taxonomyGraphData)
    let selectedTaxonomy = '', labels = [], parents = [], ids = [], text = [], values = [], total = 0

    for(const val of Object.values(taxonomyGraphData)){
      total += parseInt(val.toString())
    }

    selectedTaxonomy = taxonomy.selected.value
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
        let val = taxonomyGraphData[option.id]  // find(taxonomyGraphData, (taxonomy_id, sum) => String(taxonomy_id) === String(option.id))
        if(isUndefined(val))
          val = 0
        labels.push(option.value)
        parents.push(parentLabel)
        ids.push(taxa+option.value)
        text.push(taxa)
        values.push(val)
      }
    }
    const graphData = {"labels":labels, "parents": parents, "selectedTaxonomy":selectedTaxonomy, "text":text, "ids": ids, "values": values}
    // console.log(graphData)
    return graphData
  }

  public onSelectTaxonomy = (taxa, value) => {
    // console.log("onSelectTaxonomy", taxa, value, this.props.taxonomy)
    switch(taxa) {
      case "kingdom":
        value = find(this.props.taxonomy.kingdom.options, obj => String(obj.value) === value).id
        this.props.selectValueKingdom(value)
        this.props.onChangeKingdom(taxa)
        break
      case "phylum":
        value = find(this.props.taxonomy.phylum.options, obj => String(obj.value) === value).id
        this.props.selectValuePhylum(value)
        this.props.onChangePhylum(taxa)
        break
      case "class":
        value = find(this.props.taxonomy.class.options, obj => String(obj.value) === value).id
        this.props.selectValueClass(value)
        this.props.onChangeClass(taxa)
        break
      case "order":
        value = find(this.props.taxonomy.order.options, obj => String(obj.value) === value).id
        this.props.selectValueOrder(value)
        this.props.onChangeOrder(taxa)
        break
      case "family":
        value = find(this.props.taxonomy.family.options, obj => String(obj.value) === value).id
        this.props.selectValueFamily(value)
        this.props.onChangeFamily(taxa)
        break
      case "genus":
        value = find(this.props.taxonomy.genus.options, obj => String(obj.value) === value).id
        this.props.selectValueGenus(value)
        this.props.onChangeGenus(taxa)
        break
      case "species":
        value = find(this.props.taxonomy.species.options, obj => String(obj.value) === value).id
        this.props.selectValueSpecies(value)
        this.props.onChangeSpecies(taxa)
        break
    }
    this.props.fetchContextualDataForGraph()
    this.props.fetchTaxonomyDataForGraph()
  }

  shouldComponentUpdate(nextProps, nextState) {
    // console.log('TreePlotsChart - shouldComponentUpdate lifecycle');
    if (this.props.contextualGraphdata !== nextProps.contextualGraphdata) {
      return true;
    }
    if (this.props.taxonomyGraphdata !== nextProps.taxonomyGraphdata) {
      return true;
    }
    return false;
  }

  render() {
    const title = "Taxonomy Plot"
    // if(!this.props.taxonomyIsLoading) {}
    const graphData = this.generateGraphData()

    var data = [{
      type: "treemap",
      labels: graphData.labels,
      parents: graphData.parents,
      ids:  graphData.ids,
      text:  graphData.text,
      values:  graphData.values,
      branchvalues: "total",
      texttemplate: ('%{label}<br>%{text}<br>%{value}<br>%{percentEntry:.2%}'),
      hovertemplate: ('%{label}<br>%{text}<br>%{value}<br>%{percentEntry:.2%}<extra></extra>'),
      leaf: {opacity: 0.8},
      marker: {line: {width: 2}},
      textposition: 'inside',
    }];

    return (
      <>
      <Plot
        data={data}
        layout= {{ 
          autosize: true,
          // width: 1020, height: 960, 
          title: {'text':title, 'font':{'size': 20}}, 
          hovermode: 'closest', 
          // margin: {l: 0, r: 0, b: 0, t: 0}
        }}
        config={plotly_chart_config(title)}
        
        onClick={e => {
          const { points } = e;
          if(points) {
            if(isUndefined(e.nextLevel) && points[0].label !== points[0].root && this.props.taxonomy[points[0].text].selected.value===""){
              // console.log("onClick", points, points[0].label, points[0].pointNumber, points[0].data.labels.length, e.nextLevel)
              this.onSelectTaxonomy(points[0].text, points[0].label)
              // this.props.search()
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
    // console.log("labels", labels)
    // console.log("parents", parents)
    // console.log("ids", ids)
    // console.log("text", text)
    // console.log("values", values)
    return {"labels":labels, "parents": parents, "text":text, "ids": ids, "values": values}
  }


  // componentDidMoun1t() {
  //   console.log('Sunburst - componentDidMount lifecycle', this.props.taxonomyGraphdata);

  //   //   // let labels=[], parents=[], ids=[], text=[], values=[] 
  //     if(this.props.taxonomyGraphdata && this.props.taxonomyGraphdata.length>0) 
  //     {
  //       console.log("taxonomyGraphdata", this.props.taxonomyGraphdata)
  //       const kingdomData = this.graphData("", this.props.taxonomy.kingdom, "kingdom", this.props.taxonomyGraphdata)
  //       const phylumData = this.graphData("kingdom"+kingdomData.label, this.props.taxonomy.phylum, "phylum", this.props.taxonomyGraphdata)
  //       const classData = this.graphData("phylum"+phylumData.label, this.props.taxonomy.class, "class", this.props.taxonomyGraphdata)
  //       const orderData = this.graphData("class"+classData.label, this.props.taxonomy.order, "order", this.props.taxonomyGraphdata)
  //       const familyData = this.graphData("order"+orderData.label, this.props.taxonomy.family, "family", this.props.taxonomyGraphdata)
  //       const genusData = this.graphData("family"+familyData.label, this.props.taxonomy.genus, "genus", this.props.taxonomyGraphdata)
  //       const speciesData = this.graphData("genus"+genusData.label, this.props.taxonomy.species, "species", this.props.taxonomyGraphdata)
  
  //       this.setState({
  //         labels: [
  //           ...Array.from(kingdomData.labels),
  //           ...Array.from(phylumData.labels), 
  //           ...Array.from(classData.labels),
  //           ...Array.from(orderData.labels),
  //           ...Array.from(familyData.labels),
  //           ...Array.from(genusData.labels),
  //           ...Array.from(speciesData.labels)
  //         ],
  //         parents: [
  //           ...Array.from(kingdomData.parents),
  //           ...Array.from(phylumData.parents),
  //           ...Array.from(classData.parents),
  //           ...Array.from(orderData.parents),
  //           ...Array.from(familyData.parents),
  //           ...Array.from(genusData.parents),
  //           ...Array.from(speciesData.parents)
  //         ],
  //         ids: [
  //           ...Array.from(kingdomData.ids), 
  //           ...Array.from(phylumData.ids), 
  //           ...Array.from(classData.ids), 
  //           ...Array.from(orderData.ids),
  //           ...Array.from(familyData.ids),
  //           ...Array.from(genusData.ids),
  //           ...Array.from(speciesData.ids)
  //         ],
  //         text: [
  //           ...Array.from(kingdomData.text), 
  //           ...Array.from(phylumData.text), 
  //           ...Array.from(classData.text), 
  //           ...Array.from(orderData.text),
  //           ...Array.from(familyData.text),
  //           ...Array.from(genusData.text),
  //           ...Array.from(speciesData.text)
  //         ],
  //         values: [
  //           ...Array.from(kingdomData.values), 
  //           ...Array.from(phylumData.values), 
  //           ...Array.from(classData.values), 
  //           ...Array.from(orderData.values),
  //           ...Array.from(familyData.values),
  //           ...Array.from(genusData.values),
  //           ...Array.from(speciesData.values)
  //         ]
  //       }
  //       )
  
  //       console.log("labels", this.state.labels)
  //       // console.log("parents", parents)
  //       // console.log("ids", ids)
  //       // console.log("text", text)
  //       console.log("values", this.state.values)
  //     } 
  
  //   }
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
)(TreePlotsChart)
