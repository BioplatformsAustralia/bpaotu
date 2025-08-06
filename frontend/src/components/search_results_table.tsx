import React, { useMemo } from 'react'
import { get as _get, isEmpty, map, reject } from 'lodash'
import { Alert, UncontrolledTooltip } from 'reactstrap'
import ReactTable from 'react-table'
import 'react-table/react-table.css'

import Octicon from 'components/octicon'

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

export const SearchResultsTable = (props) => {
  const {
    cell_func = sample_link,
    cell_func_run_id = sample_link_run_id,
    krona_func = null,
    metagenome = false,
    contextual = false,
    extraColumns = [],
    results,
    changeTableProperties,
    search,
  } = props

  const defaultColumns = useMemo(
    () => [
      {
        // as function so that runIdcolumn works too
        Header: () => <div>Sample ID</div>,
        accessor: 'sample_id',
        sortable: true,
        Cell: cell_func,
      },
      {
        Header: 'Environment',
        sortable: true,
        accessor: 'environment',
      },
    ],
    [cell_func]
  )

  const kronaColumn = useMemo(
    () => ({
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
      Cell: krona_func,
    }),
    [krona_func]
  )

  const runIdColumn = useMemo(
    () => ({
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
      Cell: cell_func_run_id,
    }),
    [cell_func_run_id]
  )

  const columns = useMemo(() => {
    const extraCols = map(extraColumns, (field) => ({
      Header: _get(field, 'displayName', field.name),
      accessor: field.name,
      sortable: _get(field, 'sortable', true),
    }))

    if (metagenome) {
      return defaultColumns.concat(kronaColumn, runIdColumn, extraCols)
    }

    if (contextual) {
      return defaultColumns.concat(extraCols)
    }

    return defaultColumns.concat(kronaColumn, extraCols)
  }, [defaultColumns, kronaColumn, runIdColumn, extraColumns, metagenome])

  const onPageChange = (pageIndex) => {
    changeTableProperties({
      ...results,
      page: pageIndex,
    })
    if (results.pages > 0) search()
  }

  const onPageSizeChange = (pageSize) => {
    changeTableProperties({
      ...results,
      pageSize,
    })
    if (results.pages > 0) search()
  }

  const onSortedChange = (sorted) => {
    changeTableProperties({
      ...results,
      sorted,
    })
    if (results.pages > 0) search()
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
        // We use key= to force ReactTable to respect the page= prop. Without
        // this it won't reset to page 1 for new searches. This is a
        // workaround for what is probably a bug in react-table 6.10.0
        key={results.page}
        columns={columns}
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
            textAlign: 'center',
          },
        })}
      />
    </>
  )
}

export default SearchResultsTable
