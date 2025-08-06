import React from 'react'
import { find } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createAction } from 'redux-actions'

import { taxonomy_ranks } from 'app/constants'
import DropDownFilter from 'components/drop_down_filter'

import { updateTaxonomyDropDowns } from '../reducers/taxonomy'

import DropDownSelector from './dropdown_selector'

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

const taxonomyFilterStateToProps =
  (rank, label: any = '') =>
  (state) => {
    const { options, isDisabled, isLoading, selected } = state.searchPage.filters.taxonomy[rank]

    return {
      label: label || state.referenceData.ranks.rankLabels[rank] || null,
      options,
      selected,
      optionsLoading: isLoading,
      isDisabled,
    }
  }
const taxonomyDispatchToProps = (rank) => (dispatch) => {
  const nameU = rank.toUpperCase()
  return bindActionCreators(
    {
      selectValue: createAction('SELECT_' + nameU),
      selectOperator: createAction(`SELECT_${nameU}_OPERATOR`),
      onChange: updateTaxonomyDropDowns(rank),
    },
    dispatch
  )
}

const connectUpTaxonomyDropDownFilter = (rank) =>
  connect(taxonomyFilterStateToProps(rank), taxonomyDispatchToProps(rank))(DropDownFilter)

export const TaxonomySelector = connect(
  taxonomyFilterStateToProps('taxonomy_source', 'Taxonomy'),
  taxonomyDispatchToProps('taxonomy_source')
)(TaxonomySourceSelector)

export const TaxonomyDropDowns = taxonomy_ranks.map((rank) => {
  const TaxonomyLevelDropDown = connectUpTaxonomyDropDownFilter(rank)
  return <TaxonomyLevelDropDown key={rank} />
})
