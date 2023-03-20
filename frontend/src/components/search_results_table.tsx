import * as React from "react";
import {
  capitalize,
  concat,
  drop,
  first,
  get as _get,
  isEmpty,
  join,
  map,
  reject,
} from "lodash";
import { Alert } from "reactstrap";

import ReactTable from "react-table";
import "react-table/react-table.css";

const sample_link = (props) => (
  <div>
    <a
      href={bpaIDToCKANURL(props.value)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {props.value}
    </a>
  </div>
);

export class SearchResultsTable extends React.Component<any> {
  static defaultProps = {
    cell_func: sample_link,
  };

  public defaultColumns = [
    {
      Header: "Sample ID",
      accessor: "sample_id",
      sortable: true,
      Cell: this.props.cell_func,
    },
    {
      Header: "Environment",
      sortable: true,
      accessor: "environment",
    },
  ];

  constructor(props) {
    super(props);
    this.onSortedChange = this.onSortedChange.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this.onPageSizeChange = this.onPageSizeChange.bind(this);
  }

  public getColumns() {
    const extraColumns = map(this.props.extraColumns, (field) => ({
      Header: _get(field, "displayName", field.name),
      accessor: field.name,
      sortable: _get(field, "sortable", true),
    }));
    const columns = this.defaultColumns.concat(extraColumns);

    return columns;
  }

  public render() {
    return (
      <>
        <Alert color="secondary" className="text-center">
          <h6 className="alert-heading">
            {this.props.results.cleared
              ? "Please use the search button to start your search"
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
          noDataText={
            this.props.results.cleared
              ? "No search performed yet"
              : "No rows found"
          }
        />
      </>
    );
  }

  public onPageChange(pageIndex) {
    this.props.changeTableProperties({
      ...this.props.results,
      page: pageIndex,
    });

    this.props.search();
  }

  public onPageSizeChange(pageSize) {
    this.props.changeTableProperties({
      ...this.props.results,
      pageSize,
    });

    this.props.search();
  }

  public onSortedChange(sorted) {
    this.props.changeTableProperties({
      ...this.props.results,
      sorted,
    });

    this.props.search();
  }
}

function bpaIDToCKANURL(bpaId) {
  if (bpaId.startsWith("SAMN")) {
    return `https://www.ncbi.nlm.nih.gov/biosample/?term=${bpaId}`;
  } else {
    return `${window.otu_search_config.ckan_base_url}/organization/australian-microbiome?q=sample_id:102.100.100/${bpaId}`;
  }
}

function fieldToDisplayName(fieldName) {
  const words = fieldName.split("_");
  // For ontology foreign key cases, we drop all 'id' words that are not in the first position
  const filteredWords = concat(
    [first(words)],
    reject(drop(words), (w) => w === "id")
  );
  const userFriendly = join(map(filteredWords, capitalize), " ");

  return userFriendly;
}

export const fieldsToColumns = (fields) =>
  map(
    reject(fields, (f) => isEmpty(f.name)),
    (c) => ({
      name: c.name,
      displayName: fieldToDisplayName(c.name),
    })
  );
