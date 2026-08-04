import React from 'react'
import { get as _get } from 'lodash'
import { useAppDispatch, useAppSelector } from 'hooks/redux'
import type { RootState } from 'app/store'

import DropDownFilter from 'components/drop_down_filter'

import { updateTaxonomyDropDowns } from '../reducers/taxonomy'
import { selectTrait, selectTraitOperator } from '../reducers/trait'

const TraitFilter = () => {
  const dispatch = useAppDispatch()
  const options = useAppSelector((state: RootState) => state.referenceData.traits.values)
  const optionsLoadingError = useAppSelector((state: RootState) => state.referenceData.traits.error)
  const optionsLoading = useAppSelector((state: RootState) => state.referenceData.traits.isLoading)
  const selected = useAppSelector((state: RootState) => state.searchPage.filters.selectedTrait)
  const isDisabled = _get(options, 'length', 0) === 0

  return (
    <DropDownFilter
      label="Trait"
      options={options}
      optionsLoadingError={optionsLoadingError}
      isDisabled={isDisabled}
      optionsLoading={optionsLoading}
      selected={selected}
      selectValue={(id) => dispatch(selectTrait(id))}
      selectOperator={(id) => dispatch(selectTraitOperator(id))}
      onChange={() => dispatch(updateTaxonomyDropDowns('')())}
    />
  )
}

export default TraitFilter
