import * as _ from 'lodash';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { changeTableProperties, search } from '../reducers/search';

import * as React from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';


class SearchResultsTable extends React.Component<any> {
    componentDidMount() {
        if (_.isEmpty(this.props.results.data)) {
            this.props.search();
        }
    }

    render() {
        const columns = [
            {
                Header: "BPA Sample ID",
                accessor: "bpa_id",
                sortable: false,
                Cell: row => (<div><a href={bpaIDToCKANURL(row.value)} target="_blank">{row.value}</a></div>),
            }, {
                Header: "BPA Project",
                sort: false,
                sortable: false,
                accessor: "environment",
        }];

        return (
            <div>
                <ReactTable
                    columns={columns}
                    manual
                    loading={this.props.results.isLoading}
                    data={this.props.results.data}
                    page={this.props.results.page}
                    pageSize={this.props.results.pageSize}
                    pages={this.props.results.pages}
                    className="-striped -highlight"
                    onSortedChange={this.onSortedChange.bind(this)}
                    onPageChange={this.onPageChange.bind(this)}
                    onPageSizeChange={this.onPageSizeChange.bind(this)}
                />
            </div>
        )
    }

    onPageChange(pageIndex) {
        this.props.changeTableProperties({
            ...this.props.results,
            page: pageIndex,
        });
        this.props.search();
    }

    onPageSizeChange(pageSize) {
        this.props.changeTableProperties({
            ...this.props.results,
            pageSize,
        });
        this.props.search();
    }

    onSortedChange(sorted) {
        this.props.changeTableProperties({
            ...this.props.results,
            sorted,
        });
        this.props.search();
    }
}

function bpaIDToCKANURL(bpaId) { 
    return `${window.otu_search_config.ckan_base_url}/organization/australian-microbiome?q=bpa_id:102.100.100.${bpaId}`;
}

function mapStateToProps(state) {
    return { 
        results: state.searchPage.results
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        changeTableProperties,
        search,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchResultsTable);