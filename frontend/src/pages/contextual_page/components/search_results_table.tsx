import React, { useEffect } from 'react'

import { useAppSelector, useAppDispatch } from 'hooks/redux'

import 'react-table/react-table.css'
import { fieldsToColumns, SearchResultsTable } from 'components/search_results_table'
import { changeTableProperties, search } from '../reducers/search'

const ContextualSearchResultsTable = () => {
  const dispatch = useAppDispatch()

  const { results, extraColumns } = useAppSelector((state) => ({
    results: state.contextualPage.results,
    extraColumns: fieldsToColumns(
      state.contextualPage.selectColumns.columns,
      state.contextualDataDefinitions
    ),
  }))

  // search once on initial mount
  useEffect(() => {
    dispatch(search())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SearchResultsTable
      contextual
      results={results}
      extraColumns={extraColumns}
      changeTableProperties={(...args) => dispatch(changeTableProperties(...args))}
      search={() => dispatch(search())}
    />
  )
}

export default ContextualSearchResultsTable
