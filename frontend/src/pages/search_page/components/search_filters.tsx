import React from 'react'
import { find, isNull } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createAction } from 'redux-actions'
import { Button, Input, UncontrolledTooltip } from 'reactstrap'

import { taxonomy_ranks } from 'app/constants'
import Octicon from 'components/octicon'
import { fetchTraits } from 'reducers/reference_data/traits'

import {
  selectEnvironment,
  removeContextualFilter,
  selectContextualFiltersMode,
} from '../reducers/contextual'
import { removeSampleIntegrityWarningFilter } from '../reducers/sample_integrity_warning'
import { isMetagenomeSearch } from '../reducers/amplicon'
import { clearAllTaxonomyFilters } from '../reducers/taxonomy'
import { selectTrait } from '../reducers/trait'
import { updateTaxonomyDropDowns } from '../reducers/taxonomy'

const SearchFilterButton = (props) => {
  const mytooltip = {
    maxHeight: window.innerHeight * 0.5,
    maxWidth: window.innerWidth * 0.5,
    overflowY: 'auto' as 'auto',
  }

  return (
    <Button
      size="sm"
      style={{ marginRight: 0 }}
      outline={true}
      color={props.color}
      disabled={props.disabled}
    >
      {props.text.length > 75 ? (
        <>
          {props.text.substring(0, 75)}&nbsp;
          <span id={'context_filter_' + props.index}>
            &nbsp;
            <Octicon name="kebab-horizontal" />
          </span>
          {props.octicon ? (
            <span onClick={props.onClick}>
              <Octicon name={props.octicon} />
            </span>
          ) : (
            ''
          )}
          <UncontrolledTooltip
            style={mytooltip}
            trigger="click"
            target={'context_filter_' + props.index}
            placement="auto"
          >
            {props.text}
          </UncontrolledTooltip>
        </>
      ) : (
        <>
          {props.text}&nbsp;
          {props.octicon ? (
            <span onClick={props.onClick}>
              <Octicon name={props.octicon} />
            </span>
          ) : (
            ''
          )}
        </>
      )}
    </Button>
  )
}

const InfoBox = (props) => (
  <div className="alert-secondary btn-sm" style={{ borderWidth: '1px', borderStyle: 'solid' }}>
    {props.children}
  </div>
)

class SearchFilters extends React.Component<any> {
  getSelectedFilter = (filters, filter_id, filter_name) => {
    for (let i in filters) {
      let filter = filters[i]
      if (String(filter.id) === String(filter_id)) {
        return filter[filter_name]
      }
    }
    return filter_id
  }

  getSelectedFilterDisplayName = (allFilters, selectedFilter) => {
    for (let x in allFilters) {
      let filter = allFilters[x]
      if (filter['name'] === selectedFilter) {
        return filter['display_name']
      }
    }
    return selectedFilter
  }

  getSelectedFilterValue = (allFilters, selectedFilter, selectedFilterValue) => {
    for (let x in allFilters) {
      let filter = allFilters[x]
      if (filter['name'] === selectedFilter) {
        let filterValues = filter['values']
        const selectedValue = find(
          filterValues,
          (option) => String(option[0]) === String(selectedFilterValue)
        )
        if (selectedValue) {
          return selectedValue[1]
        } else {
          return selectedFilterValue
        }
      }
    }
    return selectedFilterValue
  }

  onSelectTrait = () => {
    this.props.selectTrait('')
    this.props.updateTaxonomyDropDown('')
    this.props.handleSearchFilterClick('amplicon_id')
  }

  onSelectTaxonomy = (taxa) => {
    this.props.clearTaxonomyValue(taxa)
    this.props.updateTaxonomyDropDown(taxa)
    this.props.handleSearchFilterClick('taxonomy_id')
  }

  onSelectEnvironment = () => {
    this.props.selectEnvironment('')
    this.props.handleSearchFilterClick('am_environment_id')
  }

  onSelectFilter = (index, filter, key) => {
    if (key === 'contextual') {
      this.props.removeContextualFilter(index)
    }
    if (key === 'sampleIntegrityWarning') {
      this.props.removeSampleIntegrityWarningFilter(index)
    }

    this.props.handleSearchFilterClick(filter)
  }

  onSelectFilterType = (mode) => {
    this.props.selectContextualFiltersMode(mode)
    this.props.handleSearchFilterClick('')
  }

  render() {
    let searchFilters = []

    console.log('this.props.filters', this.props.filters)

    for (const [key, value] of Object.entries(this.props.filters)) {
      switch (key) {
        case 'selectedAmplicon':
          if (value['value']) {
            searchFilters.push(
              <InfoBox key={'selectedAmplicon'}>
                {'Amplicon <' +
                  value['operator'] +
                  '> ' +
                  this.getSelectedFilter(this.props.amplicons, value['value'], 'value')}
              </InfoBox>
            )
          }
          break
        case 'selectedTrait':
          if (value['value']) {
            let searchFilter = (
              <SearchFilterButton
                onClick={() => this.onSelectTrait()}
                color="secondary"
                key={key}
                octicon="x"
                text={
                  'Trait <' +
                  value['operator'] +
                  '> ' +
                  this.getSelectedFilter(this.props.traits, value['value'], 'value')
                }
              />
            )
            searchFilters.push(searchFilter)
          }
          break
        case 'taxonomy':
          for (const [taxoType, taxoValue] of Object.entries(value)) {
            let selectedTaxo = taxoValue['selected']
            if (selectedTaxo && selectedTaxo['value']) {
              const text =
                this.props.rankLabels[taxoType] +
                ' <' +
                selectedTaxo['operator'] +
                '> ' +
                this.getSelectedFilter(taxoValue['options'], selectedTaxo['value'], 'value')
              if (taxonomy_ranks.indexOf(taxoType) < 0) {
                searchFilters.push(<InfoBox key={taxoType}>{text}</InfoBox>)
              } else {
                searchFilters.push(
                  <SearchFilterButton
                    id={taxoType}
                    onClick={() => this.onSelectTaxonomy(taxoType)}
                    color="secondary"
                    key={taxoType}
                    octicon="x"
                    text={text}
                  />
                )
              }
            }
          }
          break

        // contextual and sampleIntegrityWarning are the same
        // except that both will contain the selectedEnvironment filter
        // which we want to retain but only want to show it once (the contextual one)
        case 'contextual':
          let selectedEnvironmentValue = value['selectedEnvironment']
          if (selectedEnvironmentValue && selectedEnvironmentValue['value']) {
            const searchFilterText =
              'AM Environment <' +
              selectedEnvironmentValue['operator'] +
              '> ' +
              this.getSelectedFilter(
                this.props.environment,
                selectedEnvironmentValue['value'],
                'name'
              )

            let searchFilter = (
              <SearchFilterButton
                onClick={() => this.onSelectEnvironment()}
                color="info"
                key={'selectedEnvironment'}
                octicon="x"
                text={searchFilterText}
              />
            )
            searchFilters.push(searchFilter)
          }

        // note the intentional missing break above the 'contextual' case
        // to treat both contextual and sampleIntegrityWarning filters the same
        // except that only one selectedEnvironment gets shown
        // eslint-disable-next-line no-fallthrough
        case 'sampleIntegrityWarning':
          let selectedFilters = value['filters']
          for (let selectedFilterIndex in selectedFilters) {
            let selectedFilter = selectedFilters[selectedFilterIndex]
            if (selectedFilter && selectedFilter['name']) {
              let name = selectedFilter['name']
              let value = selectedFilter['value']
              let value2 = selectedFilter['value2']
              let values = selectedFilter['values']

              let text = this.getSelectedFilterDisplayName(this.props.contextualFilters, name)
              let selectedFilterValue = this.getSelectedFilterValue(
                this.props.contextualFilters,
                name,
                value
              )

              if (values.length > 0) {
                text +=
                  ' <' + (selectedFilter['operator'] ? "isn't" : 'is') + '> ' + values.join(', ')
              } else if (value2 && value) {
                text +=
                  ' <' +
                  (selectedFilter['operator'] ? 'not between' : 'between') +
                  '> ' +
                  value +
                  ' and ' +
                  value2
              } else if (!isNull(value)) {
                text +=
                  ' <' +
                  (selectedFilter['operator'] ? "doesn't contain" : 'contains') +
                  '> ' +
                  selectedFilterValue
              }
              let searchFilter = (
                <SearchFilterButton
                  index={selectedFilterIndex}
                  onClick={() => this.onSelectFilter(selectedFilterIndex, name, key)}
                  color="success"
                  key={`${selectedFilterIndex}-${key}`}
                  octicon="x"
                  text={text}
                />
              )

              searchFilters.push(searchFilter)
            }
          }
          break
      }
    }

    return (
      <>
        {this.props.selectedContextualFilters.length >= 2 && (
          <div data-tut="reactour__graph_any_all">
            <Input
              type="select"
              bsSize="sm"
              value={this.props.contextualFiltersMode}
              color="info"
              onChange={(evt) => this.onSelectFilterType(evt.target.value)}
            >
              <option value="and">All contextual filters</option>
              <option value="or">Any contextual filter</option>
            </Input>
          </div>
        )}
        {searchFilters}
      </>
    )
  }
}

function mapStateToProps(state) {
  return {
    amplicons: state.referenceData.amplicons.values,
    traits: state.referenceData.traits.values,
    rankLabels: state.referenceData.ranks.rankLabels,
    filters: state.searchPage.filters,
    isMetagenomeSearch: isMetagenomeSearch(state),
    environment: state.contextualDataDefinitions.environment,
    contextualFilters: state.contextualDataDefinitions.filters,
    contextualFiltersMode: state.searchPage.filters.contextual.filtersMode,
    selectedContextualFilters: state.searchPage.filters.contextual.filters,
  }
}

function mapDispatchToProps(dispatch: any, props) {
  return bindActionCreators(
    {
      selectTrait,
      fetchTraits,
      clearAllTaxonomyFilters,
      clearTaxonomyValue: (taxonomy) => createAction('SELECT_' + taxonomy.toUpperCase())(''),
      updateTaxonomyDropDown: (taxonomy) => updateTaxonomyDropDowns(taxonomy)(),
      selectEnvironment,
      removeContextualFilter,
      selectContextualFiltersMode,
      removeSampleIntegrityWarningFilter,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchFilters)
