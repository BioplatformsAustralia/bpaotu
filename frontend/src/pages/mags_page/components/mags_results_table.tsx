import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import debounce from 'lodash/debounce'
import { Alert, UncontrolledTooltip } from 'reactstrap'

import ReactTable from 'react-table'
import 'react-table/react-table.css'

import { changeTablePropertiesMags, searchMags } from '../reducers/mags'
import { columns as columnsDef } from '../definitions/columns'

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

  // table
  const columns = useMemo(() => {
    return columnsDef
  }, [columnsDef])

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
    }

    dispatch(changeTablePropertiesMags(args))
    if (canSearch) dispatch(searchMags())
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
        getTheadProps={(thead) => ({
          // fix the header not aligning with cells, including the column separators
          style: {
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: '8px',
            paddingBottom: '8px',
          },
        })}
        getTdProps={(cellInfo) => ({
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        })}
      />
    </>
  )
}

export default MagsResultsTable

// re-render
// https://github.com/TanStack/table/issues/4614
// https://github.com/TanStack/table/issues/1266

// If you want to handle pagination, sorting, and filtering on the server, react-table makes it easy on you.

//     Feed React Table data from somewhere dynamic. eg. state, a redux store, etc...
//     Add manual as a prop. This informs React Table that you'll be handling sorting and pagination server-side
//     Subscribe to the onFetchData prop. This function is called at componentDidMount and any time sorting, pagination or filterting is changed in the table
//     In the onFetchData callback, request your data using the provided information in the params of the function (current state and instance)
//     Update your data with the rows to be displayed
//     Optionally set how many pages there are total

// <ReactTable
//   ...
//   data={this.state.data} // should default to []
//   pages={this.state.pages} // should default to -1 (which means we don't know how many pages we have)
//   loading={this.state.loading}
//   manual // informs React Table that you'll be handling sorting and pagination server-side
//   onFetchData={(state, instance) => {
//     // show the loading overlay
//     this.setState({loading: true})
//     // fetch your data
//     Axios.post('mysite.com/data', {
//       page: state.page,
//       pageSize: state.pageSize,
//       sorted: state.sorted,
//       filtered: state.filtered
//     })
//       .then((res) => {
//         // Update react-table
//         this.setState({
//           data: res.data.rows,
//           pages: res.data.pages,
//           loading: false
//         })
//       })
//   }}
// />
