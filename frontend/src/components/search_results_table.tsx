import * as React from 'react'
import { get as _get, isEmpty, map, reject } from 'lodash'
import { Alert, UncontrolledTooltip } from 'reactstrap'

import Octicon from 'components/octicon'

import ReactTable from 'react-table'
import 'react-table/react-table.css'

const sample_link = (props) => (
  <div>
    <a href={bpaIDToCKANURL(props.value)} target="_blank" rel="noopener noreferrer">
      {props.value}
    </a>
  </div>
)

const sample_link_run_id = (props) => (
  <div>
    <a href={runIDToSandpiperURL(props.value)} target="_blank" rel="noopener noreferrer">
      {props.value}
    </a>
  </div>
)

const bpaIDToCKANURL = (bpaId) => {
  if (bpaId.startsWith('SAMN')) {
    return `https://www.ncbi.nlm.nih.gov/biosample/?term=${bpaId}`
  } else {
    return `${window.otu_search_config.ckan_base_url}/organization/australian-microbiome?q=sample_id:102.100.100/${bpaId}`
  }
}

const runIDToSandpiperURL = (runId) => {
  const base_url = 'https://sandpiper.qut.edu.au/run'
  return `${base_url}/${runId}`
}

const mapDefinitions = (fields) => {
  return map(
    reject(fields, (f) => isEmpty(f.name)),
    (c) => ({
      name: c.name,
      displayName: c.displayName,
    })
  )
}

export const fieldsToColumns = (fields, contextualDataDefinitions) => {
  // which switching pages, contextualDataDefinitions gets refreshed
  // since it is initialised as it's `initialState` it will be empty for a brief moment
  // so use the base fields until it is defined
  if (contextualDataDefinitions) {
    const fieldsPlus = fields.map((x) => {
      // handle cases when adding field it adds an empty object first
      if (x.name === '') {
        return x
      } else {
        // there will only be one match for each name
        const def = contextualDataDefinitions.values.find((f) => f.name === x.name)
        const extra = { displayName: def.display_name }
        return { ...x, ...extra }
      }
    })

    return mapDefinitions(fieldsPlus)
  } else {
    return mapDefinitions(fields)
  }
}

export class SearchResultsTable extends React.Component<any> {
  static defaultProps = {
    cell_func: sample_link,
    cell_func_run_id: sample_link_run_id,
    krona_func: null,
    metagenome: false,
  }

  public defaultColumns = [
    {
      // as function so that runIdcolumn works too
      Header: () => <div>Sample ID</div>,
      accessor: 'sample_id',
      sortable: true,
      Cell: this.props.cell_func,
    },
    {
      Header: 'Environment',
      sortable: true,
      accessor: 'environment',
    },
  ]

  public kronaColumn = {
    Header: () => (
      <div>
        Krona Plot{' '}
        <span id="singleMTipTabKrona">
          <Octicon name="info" />
        </span>
        <UncontrolledTooltip target="singleMTipTabKrona" autohide={false} placement="bottom">
          Includes abundance for all taxonomies found in this sample (unaffected by filters)
        </UncontrolledTooltip>
      </div>
    ),
    accessor: 'sample_id',
    sortable: true,
    Cell: this.props.krona_func,
  }

  public runIdColumn = {
    Header: () => (
      <div>
        Sandpiper community profile{' '}
        <span id="singleMTipTabSandpiper">
          <Octicon name="info" />
        </span>
        <UncontrolledTooltip target="singleMTipTabSandpiper" autohide={false} placement="bottom">
          Link to{' '}
          <a href={'https://github.com/wwood/singlem'} target="_blank" rel="noopener noreferrer">
            SingleM
          </a>{' '}
          community profiles from shotgun metagenome datasets at the{' '}
          <a href="https://sandpiper.qut.edu.au/" target="_blank" rel="noopener noreferrer">
            Sandpiper Database
          </a>
        </UncontrolledTooltip>
      </div>
    ),
    accessor: 'run_id',
    sortable: true,
    Cell: this.props.cell_func_run_id,
  }

  constructor(props) {
    super(props)
    this.onSortedChange = this.onSortedChange.bind(this)
    this.onPageChange = this.onPageChange.bind(this)
    this.onPageSizeChange = this.onPageSizeChange.bind(this)
  }

  public getColumns() {
    const extraColumns = map(this.props.extraColumns, (field) => ({
      Header: _get(field, 'displayName', field.name),
      accessor: field.name,
      sortable: _get(field, 'sortable', true),
    }))

    if (this.props.metagenome) {
      return this.defaultColumns
        .concat(this.kronaColumn)
        .concat(this.runIdColumn)
        .concat(extraColumns)
    } else {
      return this.defaultColumns.concat(this.kronaColumn).concat(extraColumns)
    }
  }

  public render() {
    return (
      <>
        <Alert color="secondary" className="text-center">
          <h6 className="alert-heading">
            {this.props.results.cleared
              ? 'Please use the search button to start your search'
              : this.props.results.isLoading
              ? `Searching samples...`
              : `Found ${this.props.results.rowsCount} samples`}
          </h6>
        </Alert>
        <ReactTable
          // We use key= to force ReactTable to respect the page= prop. Without
          // this it won't reset to page 1 for new searches. This is a
          // workaround for what is probably a bug in react-table 6.10.0
          key={this.props.results.page}
          columns={this.getColumns()}
          manual={true}
          loading={this.props.results.isLoading}
          data={this.props.results.data}
          page={this.props.results.page}
          pageSize={this.props.results.pageSize}
          pages={this.props.results.pages}
          className="-striped -highlight"
          onSortedChange={this.onSortedChange}
          onPageChange={this.onPageChange}
          onPageSizeChange={this.onPageSizeChange}
          noDataText={this.props.results.cleared ? 'No search performed yet' : 'No rows found'}
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
              textAlign: 'center',
            },
          })}
        />
      </>
    )
  }

  public onPageChange(pageIndex) {
    this.props.changeTableProperties({
      ...this.props.results,
      page: pageIndex,
    })

    if (this.props.results.pages > 0) {
      this.props.search()
    }
  }

  public onPageSizeChange(pageSize) {
    this.props.changeTableProperties({
      ...this.props.results,
      pageSize,
    })

    if (this.props.results.pages > 0) {
      this.props.search()
    }
  }

  public onSortedChange(sorted) {
    this.props.changeTableProperties({
      ...this.props.results,
      sorted,
    })

    if (this.props.results.pages > 0) {
      this.props.search()
    }
  }
}
