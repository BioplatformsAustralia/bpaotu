import React from 'react'
import { find } from 'lodash'
import { useAppDispatch, useAppSelector } from 'hooks/redux'
import { createAction } from 'redux-actions'

import { taxonomy_ranks } from 'app/constants'

import { updateTaxonomyDropDowns } from '../reducers/taxonomy'
import DropDownFilter from 'components/drop_down_filter'
import DropDownSelector from './drop_down_selector'

const TaxonomySourceSelector = (props) => {
  const getDefaultOption = (options) => {
    for (const default_ts of window.otu_search_config.default_taxonomies) {
      const d = find(options, (opt) => opt.value.toLowerCase() === default_ts.toLowerCase())
      if (d) {
        return d.id
      }
    }

    // return options[0]?.id
    return options.length > 0 ? options[0].id : undefined
  }

  return <DropDownSelector {...props} getDefaultOption={getDefaultOption} />
}

const TaxonomyFilter = ({ rank, label = '' }) => {
  const dispatch = useAppDispatch()
  const rankState = useAppSelector((state: any) => state.searchPage.filters.taxonomy[rank] || {})
  const rankLabel = useAppSelector(
    (state: any) => state.referenceData.ranks.rankLabels[rank] || null,
  )
  const {
    options = [],
    isDisabled = false,
    isLoading = false,
    selected = { value: '', operator: 'is' },
  } = rankState as any
  const selectValue = (value: string) =>
    dispatch(createAction('SELECT_' + rank.toUpperCase())(value))
  const selectOperator = (value: string) =>
    dispatch(createAction(`SELECT_${rank.toUpperCase()}_OPERATOR`)(value))
  const onChange = () => dispatch(updateTaxonomyDropDowns(rank))

  return (
    <DropDownFilter
      label={label || rankLabel || null}
      options={options}
      selected={selected}
      optionsLoading={isLoading}
      optionsLoadingError={false}
      isDisabled={isDisabled}
      selectValue={selectValue}
      selectOperator={selectOperator}
      onChange={onChange}
    />
  )
}

export const TaxonomySelector = ({ info }: { info: string }) => {
  const dispatch = useAppDispatch()
  const rankState = useAppSelector(
    (state: any) => state.searchPage.filters.taxonomy.taxonomy_source || {},
  )
  const rankLabel = useAppSelector(
    (state: any) => state.referenceData.ranks.rankLabels.taxonomy_source || null,
  )
  const {
    options = [],
    isDisabled = false,
    isLoading = false,
    selected = { value: '', operator: 'is' },
  } = rankState as any
  const selectValue = (value: string) => dispatch(createAction('SELECT_TAXONOMY_SOURCE')(value))
  const selectOperator = (value: string) =>
    dispatch(createAction('SELECT_TAXONOMY_SOURCE_OPERATOR')(value))
  const onChange = () => dispatch(updateTaxonomyDropDowns('taxonomy_source'))

  return (
    <TaxonomySourceSelector
      label={rankLabel || 'Taxonomy'}
      info={info}
      placeholder="Select database and method&hellip;"
      options={options}
      selected={selected}
      optionsLoading={isLoading}
      isDisabled={isDisabled}
      selectValue={selectValue}
      selectOperator={selectOperator}
      onChange={onChange}
      getDefaultOption={(options) => {
        for (const default_ts of window.otu_search_config.default_taxonomies) {
          const d = find(options, (opt) => opt.value.toLowerCase() === default_ts.toLowerCase())
          if (d) {
            return d.id
          }
        }
        return options.length > 0 ? options[0].id : undefined
      }}
    />
  )
}

export const TaxonomyDropDowns = taxonomy_ranks.map((rank) => {
  return <TaxonomyFilter rank={rank} key={rank} />
})
