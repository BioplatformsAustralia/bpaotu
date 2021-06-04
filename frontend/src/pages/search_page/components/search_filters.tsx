import React from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Button } from 'reactstrap'
import Octicon from '../../../components/octicon'
import { selectEnvironment, removeContextualFilter } from '../reducers/contextual'
import { selectAmplicon } from '../reducers/amplicon'
import { updateTaxonomyDropDowns } from '../reducers/taxonomy'
import { fetchContextualDataForGraph } from '../../../reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from '../../../reducers/taxonomy_data_graph'

import { createAction } from 'redux-actions'

const SearchFilterButton = props => {
    return (
  <Button style={{ marginRight: 10 }} outline={true} color={props.color} disabled={props.disabled} onClick={props.onClick}>
    {props.text}
    {props.octicon ? (
      <span>
         &nbsp;
        <Octicon name={props.octicon} />
      </span>
    ) : (
      ''
    )}
    
  </Button>
)}


class SearchFilters extends React.Component<any> {

  getSelectedFilter = (filters, filter_id, filter_name) => {
    for (let i in filters) {
        let filter = filters[i]
        if (String(filter.id) === String(filter_id))
          return filter[filter_name]
    }
    return filter_id
  }

  getSelectedFilterDisplayName = (contextualFilters, selectedFilter) => {
    for (let x in contextualFilters) {
        let contextualFilter = contextualFilters[x]
        if (contextualFilter['name'] === selectedFilter) {
            return contextualFilter['display_name']
        }
    }
    return selectedFilter
  }

  getSelectedFilterValue = (contextualFilters, selectedFilter, selectedFilterValue) => {
    for (let x in contextualFilters) {
        let contextualFilter = contextualFilters[x]
        if (contextualFilter['name'] === selectedFilter) {
            let contextualFilterValues = contextualFilter['values']
            if(contextualFilterValues && contextualFilterValues[selectedFilterValue]) {
                return contextualFilterValues[selectedFilterValue][1]
            }
            else
                return selectedFilterValue
        }
    }
    return selectedFilterValue
  }

  onSelectAmplicon = () => {
    // console.log("onSelectAmplicon")
    this.props.selectAmplicon('')
    this.props.updateTaxonomy()
    this.props.fetchContextualDataForGraph()
    this.props.fetchTaxonomyDataForGraph()
    this.props.selectToScroll('amplicon_id')
  }

  onSelectTaxonomy = (taxa) => {
    // console.log("onSelectTaxonomy", taxa)
    switch(taxa) {
      case "kingdom":
        this.props.selectValueKingdom('')
        this.props.onChangeKingdom(taxa)
        break
      case "phylum":
        this.props.selectValuePhylum('')
        this.props.onChangePhylum(taxa)
        break
      case "class":
        this.props.selectValueClass('')
        this.props.onChangeClass(taxa)
        break
      case "order":
        this.props.selectValueOrder('')
        this.props.onChangeOrder(taxa)
        break
      case "family":
        this.props.selectValueFamily('')
        this.props.onChangeFamily(taxa)
        break
      case "genus":
        this.props.selectValueGenus('')
        this.props.onChangeGenus(taxa)
        break
      case "species":
        this.props.selectValueSpecies('')
        this.props.onChangeSpecies(taxa)
        break
    }
    this.props.fetchContextualDataForGraph()
    this.props.fetchTaxonomyDataForGraph()
    this.props.selectToScroll('taxonomy_id')
  }

  onSelectEnvironment = () => {
    // console.log("onSelectEnvironment")
    this.props.selectEnvironment('')
    this.props.fetchContextualDataForGraph()
    this.props.fetchTaxonomyDataForGraph()
    this.props.selectToScroll('am_environment_id')
  }

  onSelectFilter = (index, filter) => {
    // console.log("onSelectFilter", index, filter)
    this.props.removeContextualFilter(index)
    this.props.fetchContextualDataForGraph()
    this.props.fetchTaxonomyDataForGraph()
    this.props.selectToScroll(filter)
  }

  render() {
    // console.log(this.props.filters)
    // console.log("environment", this.props.environment)
    let searchFilters = []
    for (const [key, value] of Object.entries(this.props.filters)) {
      switch(key) {
        case "selectedAmplicon":
          if (value['value']) {
            let searchFilter = <SearchFilterButton onClick={() => this.onSelectAmplicon()}  color="primary" key={key} octicon="x" text={"Amplicon <"+value['operator']+"> "+this.getSelectedFilter(this.props.amplicons, value['value'], 'value')} />
            searchFilters.push(searchFilter)
          }
          break
        case "taxonomy":
          for (const [taxoType, taxoValue] of Object.entries(value)) {
            let selectedTaxo = taxoValue['selected']
            if (selectedTaxo && selectedTaxo['value']) {
                // console.log(tkey, selected_tvalue['value']);
                let searchFilter = <SearchFilterButton 
                id={taxoType} 
                onClick={() => this.onSelectTaxonomy(taxoType)} 
                color="secondary" key={taxoType} octicon="x" 
                text={taxoType+" <"+selectedTaxo['operator']+"> "+this.getSelectedFilter(taxoValue['options'], selectedTaxo['value'], 'value')} />
                searchFilters.push(searchFilter)
            }
          }
          break
        case "contextual":
          let selectedEnvironmentValue = value['selectedEnvironment']
          if (selectedEnvironmentValue && selectedEnvironmentValue['value']) {
            let searchFilter = <SearchFilterButton 
            onClick={() => this.onSelectEnvironment()}
            color="info" 
            key={'selectedEnvironment'} 
            octicon="x" 
            text={"AM Environment <"+selectedEnvironmentValue['operator'] + "> "+this.getSelectedFilter(this.props.environment, selectedEnvironmentValue['value'], 'name')} />
            searchFilters.push(searchFilter)
          }
          let selectedFilters = value['filters']
          
          for (let selectedFilterIndex in selectedFilters) {
            let selectedFilter = selectedFilters[selectedFilterIndex]
            if (selectedFilter && selectedFilter['name']) {
              let name = selectedFilter['name']
              let value = selectedFilter['value']
              let value2 = selectedFilter['value2']
              let values = selectedFilter['values']
              let text = this.getSelectedFilterDisplayName(this.props.contextualFilters, name)
              if (values.length>0) {
                text += " <"+(selectedFilter['operator']?"isn't":"is")+"> "+values.join(", ")
              }
              else if (value && value2) {
                text += " <"+(selectedFilter['operator']?"not between":"between")+"> "+value+" - "+value2 
              }
              else if (value) {
                text += " <"+(selectedFilter['operator']?"doesn't contain":"contains")+"> "+this.getSelectedFilterValue(this.props.contextualFilters, name, value)
              }
              let searchFilter = <SearchFilterButton index={selectedFilterIndex}
              onClick={() => this.onSelectFilter(selectedFilterIndex, name)}  
              color="success" key={`${selectedFilterIndex}-${key}`} octicon="x" text={text} />
              searchFilters.push(searchFilter)
            }
          }
          break
      }
    }

    return (
      <>
      {searchFilters}
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    amplicons: state.referenceData.amplicons.values,
    filters: state.searchPage.filters,
    environment: state.contextualDataDefinitions.environment,
    contextualFilters: state.contextualDataDefinitions.filters,
  }
}

function mapDispatchToProps(dispatch: any, props) {
  return bindActionCreators(
    {
      selectAmplicon,
      updateTaxonomy: updateTaxonomyDropDowns(''),
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
      selectEnvironment,
      removeContextualFilter,
      fetchContextualDataForGraph,
      fetchTaxonomyDataForGraph
    },
    dispatch
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchFilters)
