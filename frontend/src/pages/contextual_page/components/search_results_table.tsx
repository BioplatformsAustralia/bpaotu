import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { isEmpty } from 'lodash'

import 'react-table/react-table.css'
import { fieldsToColumns, SearchResultsTable } from 'components/search_results_table'
import { changeTableProperties, search } from '../reducers/search'

const ContextualSearchResultsTable = () => {
  const dispatch = useDispatch()

  const { results, extraColumns, sorting } = useSelector((state: any) => ({
    results: state.contextualPage.results,
    extraColumns: fieldsToColumns(
      state.contextualPage.selectColumns.columns,
      state.contextualDataDefinitions
    ),
    sorting: state.contextualPage.results.sorted,
  }))

  useEffect(() => {
    if (isEmpty(results.data)) {
      dispatch(search())
    }
  }, [results.data, dispatch])

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
