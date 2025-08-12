import React from 'react'
import { useSelector } from 'react-redux'
import { Card, CardBody, CardHeader } from 'reactstrap'
import { isEmpty, map, reject } from 'lodash'

import { EmptyOTUQuery } from 'search'
import { ExportDataButton } from 'components/export_data_button'
import ContextualSearchResultsTable from './search_results_table'

const SearchResultsCard = (props) => {
  const ckanAuthToken = useSelector((state: any) => state.auth.ckanAuthToken)
  const { extraColumns, sorting } = useSelector((state: any) => ({
    extraColumns: reject(
      map(state.contextualPage.selectColumns.columns, (c) => c.name),
      (c) => isEmpty(c)
    ),
    sorting: state.contextualPage.results.sorted,
  }))

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
          <ContextualSearchResultsTable />
        </CardBody>
      </Card>
    </div>
  )
}

export default SearchResultsCard
