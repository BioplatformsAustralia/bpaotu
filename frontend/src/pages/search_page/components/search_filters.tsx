import React, { CSSProperties, useCallback } from 'react'
import { find, isNull } from 'lodash'
import { useAppDispatch, useAppSelector } from 'hooks/redux'
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
import { RootState } from 'app/store'

type TaxonomyFilters = RootState['searchPage']['filters']['taxonomy']

const InfoBox = (props) => (
  <div className="alert alert-secondary py-1 px-2 mb-1" style={{ borderWidth: '1px' }}>
    {props.children}
  </div>
)

const SearchFilterButton = (props) => {
  const mytooltip: CSSProperties = {
    maxHeight: window.innerHeight * 0.5,
    maxWidth: window.innerWidth * 0.5,
    overflowY: 'auto',
  }

  return (
    <Button
      size="md"
      className="me-1 mb-1 px-2 py-1"
      outline
      color={props.color}
      disabled={props.disabled}
    >
      {props.text.length > 75 ? (
        <>
          {props.text.substring(0, 75)}
          <span id={'context_filter_' + props.index}>
            &nbsp;
            <Octicon name="kebab-horizontal" />
          </span>
          {props.octicon ? (
            <span onClick={props.onClick} className="ms-1">
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
          {props.text}
          {props.octicon ? (
            <span onClick={props.onClick} className="ms-1">
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

const SearchFilters = (props) => {
  const dispatch = useAppDispatch()
  const amplicons = useAppSelector((state: any) => state.referenceData.amplicons.values)
  const traits = useAppSelector((state: any) => state.referenceData.traits.values)
  const rankLabels = useAppSelector((state: any) => state.referenceData.ranks.rankLabels)
  const filters = useAppSelector((state: any) => state.searchPage.filters)
  const contextualFilterDefinitions = useAppSelector(
    (state: any) => state.contextualDataDefinitions.filters,
  )
  const contextualFiltersMode = useAppSelector(
    (state: any) => state.searchPage.filters.contextual.filtersMode,
  )
  const selectedContextualFilters = useAppSelector(
    (state: any) => state.searchPage.filters.contextual.filters,
  )
  const environment = useAppSelector((state: any) => state.contextualDataDefinitions.environment)
  const { static: staticFilter, handleSearchFilterClick } = props as any
  const selectTraitAction = (value: string) => dispatch(selectTrait(value))
  const fetchTraitsAction = () => dispatch(fetchTraits())
  const clearAllTaxonomyFiltersAction = () => dispatch(clearAllTaxonomyFilters())
  const clearTaxonomyValueAction = (taxonomy: string) =>
    dispatch(createAction('SELECT_' + taxonomy.toUpperCase())(''))
  const updateTaxonomyDropDownAction = (taxonomy: string) =>
    dispatch(updateTaxonomyDropDowns(taxonomy))
  const selectEnvironmentAction = (value: string) => dispatch(selectEnvironment(value))
  const removeContextualFilterAction = (index: number) => dispatch(removeContextualFilter(index))
  const selectContextualFiltersModeAction = (mode: string) =>
    dispatch(selectContextualFiltersMode(mode))
  const removeSampleIntegrityWarningFilterAction = (index: number) =>
    dispatch(removeSampleIntegrityWarningFilter(index))

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
          (option) => String(option[0]) === String(selectedFilterValue),
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
    selectTraitAction('')
    updateTaxonomyDropDownAction('')
    handleSearchFilterClick('amplicon_id')
  }, [handleSearchFilterClick])

  const onSelectTaxonomy = useCallback(
    (taxa) => {
      clearTaxonomyValueAction(taxa)
      updateTaxonomyDropDownAction(taxa)
      handleSearchFilterClick('taxonomy_id')
    },
    [handleSearchFilterClick],
  )

  const onSelectEnvironment = useCallback(() => {
    selectEnvironmentAction('')
    handleSearchFilterClick('am_environment_id')
  }, [handleSearchFilterClick])

  const onSelectFilter = useCallback(
    (index, filter, key) => {
      if (key === 'contextual') {
        removeContextualFilterAction(index)
      }
      if (key === 'sampleIntegrityWarning') {
        removeSampleIntegrityWarningFilterAction(index)
      }

      handleSearchFilterClick(filter)
    },
    [handleSearchFilterClick],
  )

  const onSelectFilterType = useCallback(
    (mode) => {
      selectContextualFiltersModeAction(mode)
      handleSearchFilterClick('')
    },
    [handleSearchFilterClick],
  )

  const renderSelectedAmplicon = (value) => {
    if (!value.value) return null

    return (
      <InfoBox key="selectedAmplicon">
        {`Amplicon <${value.operator}> ${getSelectedFilter(amplicons, value.value, 'value')}`}
      </InfoBox>
    )
  }

  const renderSelectedTrait = (value) => {
    if (!value.value) return null

    return (
      <SearchFilterButton
        key="selectedTrait"
        color="secondary"
        octicon={staticFilter ? '' : 'x'}
        onClick={onSelectTrait}
        text={`Trait <${value.operator}> ${getSelectedFilter(traits, value.value, 'value')}`}
      />
    )
  }

  const renderTaxonomyFilters = (taxonomy: TaxonomyFilters) =>
    Object.entries(taxonomy).flatMap(([taxoType, taxoValue]) => {
      const selected = taxoValue.selected
      if (!selected?.value) return []

      const text = `${rankLabels[taxoType]} <${selected.operator}> ${getSelectedFilter(
        taxoValue.options,
        selected.value,
        'value',
      )}`

      if (taxonomy_ranks.indexOf(taxoType) < 0) {
        return [<InfoBox key={taxoType}>{text}</InfoBox>]
      }

      return [
        <SearchFilterButton
          key={taxoType}
          id={taxoType}
          color="secondary"
          octicon={staticFilter ? '' : 'x'}
          onClick={() => onSelectTaxonomy(taxoType)}
          text={text}
        />,
      ]
    })

  const renderContextualFilter = (value) => {
    const selectedEnvironment = value.selectedEnvironment

    const environmentFilter = selectedEnvironment?.value ? (
      <SearchFilterButton
        key="selectedEnvironment"
        color="info"
        octicon={staticFilter ? '' : 'x'}
        onClick={onSelectEnvironment}
        text={`AM Environment <${selectedEnvironment.operator}> ${getSelectedFilter(
          environment,
          selectedEnvironment.value,
          'name',
        )}`}
      />
    ) : null

    const contextualFilters = value.filters.flatMap((filter, index) => {
      if (!filter?.name) return []

      let text = getSelectedFilterDisplayName(contextualFilterDefinitions, filter.name)
      const selectedValue = getSelectedFilterValue(
        contextualFilterDefinitions,
        filter.name,
        filter.value,
      )

      if (filter.values.length > 0) {
        text += ` <${filter.operator ? "isn't" : 'is'}> ${filter.values.join(', ')}`
      } else if (filter.value && filter.value2) {
        text += ` <${filter.operator ? 'not between' : 'between'}> ${filter.value} and ${filter.value2}`
      } else if (!isNull(filter.value)) {
        text += ` <${filter.operator ? "doesn't contain" : 'contains'}> ${selectedValue}`
      }

      return [
        <SearchFilterButton
          key={`${index}-contextual`}
          index={index}
          color="success"
          octicon={staticFilter ? '' : 'x'}
          onClick={() => onSelectFilter(index, filter.name, 'contextual')}
          text={text}
        />,
      ]
    })

    return [environmentFilter, ...contextualFilters].filter(Boolean)
  }

  const renderSampleIntegrityFilters = (value) =>
    value.filters.flatMap((filter, index) => {
      if (!filter?.name) return []

      let text = getSelectedFilterDisplayName(contextualFilterDefinitions, filter.name)
      const selectedValue = getSelectedFilterValue(
        contextualFilterDefinitions,
        filter.name,
        filter.value,
      )

      if (filter.values.length > 0) {
        text += ` <${filter.operator ? "isn't" : 'is'}> ${filter.values.join(', ')}`
      } else if (filter.value && filter.value2) {
        text += ` <${filter.operator ? 'not between' : 'between'}> ${filter.value} and ${filter.value2}`
      } else if (!isNull(filter.value)) {
        text += ` <${filter.operator ? "doesn't contain" : 'contains'}> ${selectedValue}`
      }

      return [
        <SearchFilterButton
          key={`${index}-sampleIntegrityWarning`}
          index={index}
          color="success"
          octicon={staticFilter ? '' : 'x'}
          onClick={() => onSelectFilter(index, filter.name, 'sampleIntegrityWarning')}
          text={text}
        />,
      ]
    })

  const filterRenderers = {
    selectedAmplicon: renderSelectedAmplicon,
    selectedTrait: renderSelectedTrait,
    taxonomy: renderTaxonomyFilters,
    contextual: renderContextualFilter,
    sampleIntegrityWarning: renderSampleIntegrityFilters,
  }

  const searchFilters = Object.entries(filters).flatMap(([key, value]) => {
    const renderer = filterRenderers[key]
    if (!renderer) return []

    const result = renderer(value)
    return Array.isArray(result) ? result : result ? [result] : []
  })

  return (
    <>
      {selectedContextualFilters.length >= 2 && (
        <div data-tut="reactour__graph_any_all">
          <Input
            type="select"
            bsSize="sm"
            className="form-select-sm"
            value={contextualFiltersMode}
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

export default SearchFilters
