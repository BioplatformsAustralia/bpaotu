import { isEmpty, map, reject } from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'

import { Card, CardBody, CardHeader } from 'reactstrap'

import { ExportDataButton } from 'components/export_data_button'

import { EmptyOTUQuery } from 'search'
import SearchResultsTable from './search_results_table'

const SearchResultsCard = (props) => {
  const { ckanAuthToken, extraColumns, sorting } = props

  const exportCSV = () => {
    const params = new URLSearchParams()
    params.set('token', ckanAuthToken)
    params.set('otu_query', JSON.stringify(EmptyOTUQuery))
    params.set('columns', JSON.stringify(extraColumns))
    params.set('sorting', JSON.stringify(sorting))

    const baseURL = window.otu_search_config.contextual_csv_download_endpoint
    const url = `${baseURL}?${params.toString()}`
    window.open(url)
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div>
            <ExportDataButton
              octicon="desktop-download"
              text="Export Search Results (CSV)"
              onClick={exportCSV}
            />
          </div>
        </CardHeader>
        <CardBody>
          <SearchResultsTable />
        </CardBody>
      </Card>
    </div>
  )
}

function mapStateToProps(state) {
  return {
    ckanAuthToken: state.auth.ckanAuthToken,
    extraColumns: reject(
      map(state.contextualPage.selectColumns.columns, (c) => c.name),
      (c) => isEmpty(c)
    ),
    sorting: state.contextualPage.results.sorted,
  }
}

export default connect(mapStateToProps, null)(SearchResultsCard)
