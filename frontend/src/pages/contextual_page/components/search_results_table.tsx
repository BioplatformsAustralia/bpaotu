import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { isEmpty } from 'lodash'

import 'react-table/react-table.css'

import { fieldsToColumns, SearchResultsTable } from 'components/search_results_table'
import { changeTableProperties, search } from '../reducers/search'

function mapStateToProps(state) {
  return {
    results: state.contextualPage.results,
    extraColumns: fieldsToColumns(
      state.contextualPage.selectColumns.columns,
      state.contextualDataDefinitions.filters
    ),
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      changeTableProperties,
      search,
    },
    dispatch
  )
}

class ContextualSearchResultsTable extends SearchResultsTable {
  public componentDidMount() {
    if (isEmpty(this.props.results.data)) {
      this.props.search()
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ContextualSearchResultsTable)
