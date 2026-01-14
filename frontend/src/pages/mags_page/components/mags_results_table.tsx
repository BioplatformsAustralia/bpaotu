import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import debounce from 'lodash/debounce'
import { Alert, UncontrolledTooltip } from 'reactstrap'

import ReactTable from 'react-table'
import 'react-table/react-table.css'
import '../styles.css'

import { changeTablePropertiesMags, searchMags } from '../reducers/mags'
import { columns as columnsDef } from '../definitions/columns'

const DEBOUNCE_DELAY = 400
const SEARCH_CHAR_THRESHOLD = 3

const MagsResultsTable = (props) => {
  const dispatch = useDispatch()

  const { results } = useSelector((state: any) => {
    return {
      results: state.magsPage.results,
      // samples
    }
  })

  // search once on initial mount
  useEffect(() => {
    dispatch(searchMags())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns = useMemo(
    () =>
      columnsDef.map((col) => ({
        ...col,
      })),
    [columnsDef]
  )

  const debouncedSearch = useMemo(
    () =>
      debounce(() => {
        dispatch(searchMags())
      }, DEBOUNCE_DELAY),
    [dispatch]
  )

  const shouldSearch = (filtered) => {
    if (!filtered || filtered.length === 0) return true

    return filtered.every((f) => {
      if (f.value == null) return false
      return String(f.value).length >= SEARCH_CHAR_THRESHOLD
    })
  }

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // TODO
  // contextual had this as `results.pages > 0`
  // but if filter returns no results, then table can get stuck on 0 pages
  const canSearch = true

  const onPageChange = (pageIndex) => {
    const args = {
      ...results,
      page: pageIndex,
    }

    dispatch(changeTablePropertiesMags(args))
    if (canSearch) dispatch(searchMags())
  }

  const onPageSizeChange = (pageSize) => {
    const args = {
      ...results,
      pageSize,
    }

    dispatch(changeTablePropertiesMags(args))
    if (canSearch) dispatch(searchMags())
  }

  const onSortedChange = (sorted) => {
    const args = {
      ...results,
      sorted,
    }

    dispatch(changeTablePropertiesMags(args))
    if (canSearch) dispatch(searchMags())
  }

  const onFilteredChange = (filtered) => {
    const args = {
      ...results,
      filtered,
      page: 0, // reset to page 0 on a new filter
    }

    dispatch(changeTablePropertiesMags(args))

    if (shouldSearch(filtered)) {
      debouncedSearch()
    } else {
      debouncedSearch.cancel()
    }
  }

  return (
    <>
      <Alert color="secondary" className="text-center">
        <h6 className="alert-heading">
          {results.cleared
            ? 'Please use the search button to start your search'
            : results.isLoading
              ? `Searching samples...`
              : `Found ${results.rowsCount} samples`}
        </h6>
      </Alert>
      <ReactTable
        filterable // disable filtering for specific columns in columns definition
        filtered={results.filtered}
        onFilteredChange={onFilteredChange}
        // We use key= to force ReactTable to respect the page= prop. Without
        // this it won't reset to page 1 for new searches. This is a
        // workaround for what is probably a bug in react-table 6.10.0
        key={results.page}
        columns={columns}
        manual
        loading={results.isLoading}
        data={results.data}
        page={results.page}
        pageSize={results.pageSize}
        pages={results.pages}
        className="-striped -highlight"
        sorted={results.sorted}
        onSortedChange={onSortedChange}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        noDataText={results.cleared ? 'No search performed yet' : 'No rows found'}
        getTdProps={(cellInfo) => ({
          style: {
            display: 'flex',
            alignItems: 'center',
          },
        })}
      />
    </>
  )
}

export default MagsResultsTable
