import React from 'react'
import { isEmpty, reject, uniqBy } from 'lodash'
import { useAppDispatch, useAppSelector } from 'hooks/redux'
import type { RootState } from 'app/store'

import {
  fieldsToColumns,
  SearchResultsTable,
  type SearchResultsTablePresentationProps,
} from 'components/search_results_table'

import { changeTableProperties, search } from '../reducers/search'

import 'react-table/react-table.css'

const ConnectedSearchResultsTable = (props: SearchResultsTablePresentationProps) => {
  const { cellFunc, cellFuncRunId, kronaFunc, metagenome = false, contextual = false } = props

  const dispatch = useAppDispatch()
  const results = useAppSelector((state: RootState) => state.searchPage.results)
  const filters = useAppSelector((state: RootState) => state.searchPage.filters)
  const contextualDefinitions = useAppSelector(
    (state: RootState) => state.contextualDataDefinitions,
  )

  const nonEmptyFilters = uniqBy(
    reject(filters.contextual.filters, (f) => isEmpty(f.name)),
    'name',
  )
  const nonEmptySIWFilters = uniqBy(
    reject(filters.sampleIntegrityWarning.filters, (f) => isEmpty(f.name)),
    'name',
  )
  const extraColumns = fieldsToColumns(
    [...nonEmptyFilters, ...nonEmptySIWFilters],
    contextualDefinitions,
  )

  return (
    <SearchResultsTable
      cellFunc={cellFunc}
      cellFuncRunId={cellFuncRunId}
      kronaFunc={kronaFunc}
      metagenome={metagenome}
      contextual={contextual}
      //
      results={results}
      extraColumns={extraColumns}
      changeTableProperties={(payload) => dispatch(changeTableProperties(payload))}
      search={() => dispatch(search())}
    />
  )
}

export default ConnectedSearchResultsTable
