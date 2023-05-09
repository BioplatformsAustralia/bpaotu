import { isEmpty, map, reject } from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'

import { Button, Card, CardBody, CardHeader } from 'reactstrap'

import { useAnalytics } from 'use-analytics'
import Octicon from 'components/octicon'

import { EmptyOTUQuery } from 'search'
import SearchResultsTable from './search_results_table'

const HeaderButton = (props) => (
  <Button
    style={{ marginRight: 10 }}
    outline={true}
    color="primary"
    disabled={props.disabled}
    onClick={props.onClick}
  >
    {props.octicon ? (
      <span>
        <Octicon name={props.octicon} />
        &nbsp;
      </span>
    ) : (
      ''
    )}
    {props.text}
  </Button>
)

const SearchResultsCard = (props) => {
  const { ckanAuthToken, extraColumns, sorting } = props
  const { track } = useAnalytics()

  const exportCSV = () => {
    const params = new URLSearchParams()
    params.set('token', ckanAuthToken)
    params.set('otu_query', JSON.stringify(EmptyOTUQuery))
    params.set('columns', JSON.stringify(extraColumns))
    params.set('sorting', JSON.stringify(sorting))

    track('otu_export_contextual_CSV', {
      columns: extraColumns.sort(),
    })

    const baseURL = window.otu_search_config.contextual_csv_download_endpoint
    const url = `${baseURL}?${params.toString()}`
    window.open(url)
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div>
            <HeaderButton
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
