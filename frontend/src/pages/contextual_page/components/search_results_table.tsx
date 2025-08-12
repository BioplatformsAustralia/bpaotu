import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { isEmpty } from 'lodash'

import 'react-table/react-table.css'

import { fieldsToColumns, SearchResultsTable } from 'components/search_results_table'
import { changeTableProperties, search } from '../reducers/search'

const ContextualSearchResultsTable = (props) => {
  useEffect(() => {
    if (isEmpty(props.results.data)) {
      props.search()
    }
  }, [props.results.data, props.search])

  return <SearchResultsTable contextual {...props} />
}

const mapStateToProps = (state) => {
  return {
    results: state.contextualPage.results,
    extraColumns: fieldsToColumns(
      state.contextualPage.selectColumns.columns,
      state.contextualDataDefinitions
    ),
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      changeTableProperties,
      search,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ContextualSearchResultsTable)
