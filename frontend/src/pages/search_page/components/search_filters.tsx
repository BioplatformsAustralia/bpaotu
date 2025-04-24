import React, { CSSProperties, useCallback } from 'react'
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
  const mytooltip: CSSProperties = {
    maxHeight: window.innerHeight * 0.5,
    maxWidth: window.innerWidth * 0.5,
    overflowY: 'auto',
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

const SearchFilters = (props) => {
  const getSelectedFilter = useCallback((filters, filter_id, filter_name) => {
    for (let i in filters) {
      let filter = filters[i]
      if (String(filter.id) === String(filter_id)) {
        return filter[filter_name]
      }
    }
    return filter_id
  }, [])

  const getSelectedFilterDisplayName = useCallback((allFilters, selectedFilter) => {
    for (let x in allFilters) {
      let filter = allFilters[x]
      if (filter['name'] === selectedFilter) {
        return filter['display_name']
      }
    }
    return selectedFilter
  }, [])

  const getSelectedFilterValue = useCallback((allFilters, selectedFilter, selectedFilterValue) => {
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
  }, [])

  const onSelectTrait = useCallback(() => {
    props.selectTrait('')
    props.updateTaxonomyDropDown('')
    props.handleSearchFilterClick('amplicon_id')
  }, [props])

  const onSelectTaxonomy = useCallback(
    (taxa) => {
      props.clearTaxonomyValue(taxa)
      props.updateTaxonomyDropDown(taxa)
      props.handleSearchFilterClick('taxonomy_id')
    },
    [props]
  )

  const onSelectEnvironment = useCallback(() => {
    props.selectEnvironment('')
    props.handleSearchFilterClick('am_environment_id')
  }, [props])

  const onSelectFilter = useCallback(
    (index, filter, key) => {
      if (key === 'contextual') {
        props.removeContextualFilter(index)
      }
      if (key === 'sampleIntegrityWarning') {
        props.removeSampleIntegrityWarningFilter(index)
      }

      props.handleSearchFilterClick(filter)
    },
    [props]
  )

  const onSelectFilterType = useCallback(
    (mode) => {
      props.selectContextualFiltersMode(mode)
      props.handleSearchFilterClick('')
    },
    [props]
  )

  let searchFilters = []

  for (const [key, value] of Object.entries(props.filters)) {
    switch (key) {
      case 'selectedAmplicon':
        if (value['value']) {
          searchFilters.push(
            <InfoBox key={'selectedAmplicon'}>
              {'Amplicon <' +
                value['operator'] +
                '> ' +
                getSelectedFilter(props.amplicons, value['value'], 'value')}
            </InfoBox>
          )
        }
        break
      case 'selectedTrait':
        if (value['value']) {
          let searchFilter = (
            <SearchFilterButton
              onClick={onSelectTrait}
              color="secondary"
              key={key}
              octicon={props.static ? '' : 'x'}
              text={
                'Trait <' +
                value['operator'] +
                '> ' +
                getSelectedFilter(props.traits, value['value'], 'value')
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
              props.rankLabels[taxoType] +
              ' <' +
              selectedTaxo['operator'] +
              '> ' +
              getSelectedFilter(taxoValue['options'], selectedTaxo['value'], 'value')
            if (taxonomy_ranks.indexOf(taxoType) < 0) {
              searchFilters.push(<InfoBox key={taxoType}>{text}</InfoBox>)
            } else {
              searchFilters.push(
                <SearchFilterButton
                  id={taxoType}
                  onClick={() => onSelectTaxonomy(taxoType)}
                  color="secondary"
                  key={taxoType}
                  octicon={props.static ? '' : 'x'}
                  text={text}
                />
              )
            }
          }
        }
        break

      case 'contextual':
        let selectedEnvironmentValue = value['selectedEnvironment']
        if (selectedEnvironmentValue && selectedEnvironmentValue['value']) {
          const searchFilterText =
            'AM Environment <' +
            selectedEnvironmentValue['operator'] +
            '> ' +
            getSelectedFilter(props.environment, selectedEnvironmentValue['value'], 'name')

          let searchFilter = (
            <SearchFilterButton
              onClick={onSelectEnvironment}
              color="info"
              key={'selectedEnvironment'}
              octicon={props.static ? '' : 'x'}
              text={searchFilterText}
            />
          )
          searchFilters.push(searchFilter)
        }

      case 'sampleIntegrityWarning':
        let selectedFilters = value['filters']
        for (let selectedFilterIndex in selectedFilters) {
          let selectedFilter = selectedFilters[selectedFilterIndex]
          if (selectedFilter && selectedFilter['name']) {
            let name = selectedFilter['name']
            let value = selectedFilter['value']
            let value2 = selectedFilter['value2']
            let values = selectedFilter['values']

            let text = getSelectedFilterDisplayName(props.contextualFilters, name)
            let selectedFilterValue = getSelectedFilterValue(props.contextualFilters, name, value)

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
                onClick={() => onSelectFilter(selectedFilterIndex, name, key)}
                color="success"
                key={`${selectedFilterIndex}-${key}`}
                octicon={props.static ? '' : 'x'}
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
      {props.selectedContextualFilters.length >= 2 && (
        <div data-tut="reactour__graph_any_all">
          <Input
            type="select"
            bsSize="sm"
            value={props.contextualFiltersMode}
            color="info"
            onChange={(evt) => onSelectFilterType(evt.target.value)}
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

function mapStateToProps(state) {
  return {
    amplicons: state.referenceData.amplicons.values,
    traits: state.referenceData.traits.values,
    rankLabels: state.referenceData.ranks.rankLabels,
    filters: state.searchPage.filters,
    staticFilters: state.searchPage.samplesComparisonModal.staticFilters,
    isMetagenomeSearch: isMetagenomeSearch(state),
    environment: state.contextualDataDefinitions.environment,
    contextualFilters: state.contextualDataDefinitions.filters,
    contextualFiltersMode: state.searchPage.filters.contextual.filtersMode,
    selectedContextualFilters: state.searchPage.filters.contextual.filters,
  }
}

function mapDispatchToProps(dispatch) {
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
