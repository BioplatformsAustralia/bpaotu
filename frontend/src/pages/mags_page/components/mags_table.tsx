import React, { useMemo } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import ReactTable from 'react-table'
import 'react-table/react-table.css'

import { changeMagsTableProperties, fetchMagsRecords } from 'pages/mags_page/reducers'

import { columns } from '../definitions/columns'

const MagsTable = (props) => {
  const columnsMemo = useMemo(() => columns, [])

  const { results, changeMagsTableProperties, fetchMagsRecords } = props

  const onPageChange = (pageIndex) => {
    changeMagsTableProperties({
      ...results,
      page: pageIndex,
    })
    if (results.pages > 0) fetchMagsRecords()
  }

  const onPageSizeChange = (pageSize) => {
    changeMagsTableProperties({
      ...results,
      pageSize,
    })
    if (results.pages > 0) fetchMagsRecords()
  }

  const onSortedChange = (sorted) => {
    changeMagsTableProperties({
      ...results,
      sorted,
    })
    if (results.pages > 0) fetchMagsRecords()
  }

  return (
    <ReactTable
      // We use key= to force ReactTable to respect the page= prop. Without
      // this it won't reset to page 1 for new searches. This is a
      // workaround for what is probably a bug in react-table 6.10.0
      key={results.page}
      columns={columnsMemo}
      manual={true}
      loading={results.isLoading}
      data={results.data}
      page={results.page}
      pageSize={results.pageSize}
      pages={results.pages}
      className="-striped -highlight"
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
  )
}

function mapStateToProps(state) {
  return {
    results: state.magsPage.results,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      changeMagsTableProperties,
      fetchMagsRecords,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(MagsTable)
