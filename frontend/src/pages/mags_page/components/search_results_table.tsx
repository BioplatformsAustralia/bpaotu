import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import debounce from 'lodash/debounce'
import { Alert, UncontrolledTooltip } from 'reactstrap'

import ReactTable from 'react-table'
import 'react-table/react-table.css'
import './search_results_table.css'

import { changeTablePropertiesMags, searchMags } from 'pages/mags_page/reducers/mags'
import { searchColumns } from 'pages/mags_page/definitions/search_columns'

const DEBOUNCE_DELAY = 400
const SEARCH_CHAR_THRESHOLD = 3

// General helpers
const isEmptyString = (v: any) => typeof v === 'string' && v.trim() === ''
const isNil = (v: any) => v == null
const isRange = (v: any) => v && typeof v === 'object' && ('min' in v || 'max' in v)
const rangeHasValue = (v: { min?: string; max?: string }) =>
  (!isNil(v.min) && !isEmptyString(v.min)) || (!isNil(v.max) && !isEmptyString(v.max))

// Remove filters that have no meaningful value
const sanitiseFiltered = (filtered: any[]) => {
  if (!Array.isArray(filtered)) return []
  return filtered.filter((f) => {
    const v = f && f.value
    if (isNil(v)) return false
    if (isRange(v)) return rangeHasValue(v)
    if (isEmptyString(v)) return false
    return true
  })
}

// Note: filtered passed in here should already be sanitised
const shouldSearch = (filtered: any[]) => {
  if (!filtered || filtered.length === 0) return true
  return filtered.every((f) => {
    const v = f.value
    if (isRange(v)) return rangeHasValue(v)
    if (isEmptyString(v)) return false
    return String(v).length >= SEARCH_CHAR_THRESHOLD
  })
}

const SearchResultsTable = (props) => {
  const { sampleId } = props
  const dispatch = useDispatch()

  // because this table can have data from different contexts
  // it should also use the results in state that parent has determined
  const { results } = useSelector((state: any) => {
    return {
      results: state.magsPage.results,
    }
  })

  const columns = useMemo(
    () =>
      searchColumns.map((col) => {
        // if table is for a particular sample ID then freeze sample ID column
        if (sampleId && col.accessor === 'sample_id') {
          return {
            ...col,
            filterable: false,
            sortable: false,
            Cell: null,
          }
        } else {
          return col
        }
      }),
    [sampleId]
  )

  const debouncedSearch = useMemo(
    () =>
      debounce(
        () => {
          dispatch(searchMags())
        },
        DEBOUNCE_DELAY,
        {
          leading: false,
          trailing: true,
          maxWait: 2000, //  so fast typing still triggers a search eventually
        }
      ),
    [dispatch]
  )

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // TODO
  // contextual had this as `results.pages > 0`
  // but if filter returns no results, then table can get stuck on 0 pages
  const canSearch = true

  // Track the last 'effective' filtered set (after sanitization)
  const prevEffectiveFilteredRef = useRef<any[]>(sanitiseFiltered(results.filtered))
  useEffect(() => {
    prevEffectiveFilteredRef.current = sanitiseFiltered(results.filtered)
  }, [results.filtered])

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

  const onFilteredChange = (incomingFiltered) => {
    // Sanitise what ReactTable gives us
    const effectiveFiltered = sanitiseFiltered(incomingFiltered)

    // Persist sanitised filters and reset page
    const args = {
      ...results,
      filtered: effectiveFiltered,
      page: 0,
    }
    dispatch(changeTablePropertiesMags(args))

    // Determine search behaviour:
    const prevEffective = prevEffectiveFilteredRef.current
    const cleared = Array.isArray(prevEffective) && prevEffective.length > effectiveFiltered.length

    if (cleared) {
      // If num filters decreased (a filter was cleared), fire immediately
      debouncedSearch.cancel()
      dispatch(searchMags())
    } else if (shouldSearch(effectiveFiltered)) {
      debouncedSearch()
    } else {
      debouncedSearch.cancel()
    }

    // Update the ref to the latest effective set
    prevEffectiveFilteredRef.current = effectiveFiltered
  }

  return (
    <>
      <Alert color="secondary" className="text-center">
        <h6 className="alert-heading">
          {results.cleared
            ? 'Please use the search button to start your search'
            : results.isLoading
              ? `Searching MAGs...`
              : `Found ${results.rowsCount} MAGs`}
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

export default SearchResultsTable
