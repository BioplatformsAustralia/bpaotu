import * as _ from 'lodash';
import * as React from 'react';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import ReactTable from 'react-table';
import 'react-table/react-table.css';

import { changeTableProperties, search } from '../reducers/search';


class SearchResultsTable extends React.Component<any> {
    defaultColumns = [
        {
            Header: "BPA Sample ID",
            accessor: "bpa_id",
            sortable: true,
            Cell: row => (<div><a href={bpaIDToCKANURL(row.value)} target="_blank">{row.value}</a></div>),
        }, {
            Header: "BPA Project",
            sortable: true,
            accessor: "environment",
    }];

    componentDidMount() {
        if (_.isEmpty(this.props.results.data)) {
            this.props.search();
        }
    }

    getColumns() {
        const extraColumns = _.map(this.props.extraColumns, field => ({
            Header: _.get(field, 'displayName', field.name),
            accessor: field.name,
            sortable: _.get(field, 'sortable', true),
        }));
        const columns = this.defaultColumns.concat(extraColumns);
        return columns;
    }

    render() {
        return (
            <div>
                <ReactTable
                    columns={this.getColumns()}
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

function fieldToDisplayName(fieldName) {
    const words = fieldName.split('_');
    // For ontology foreign key cases, we drop all 'id' words that are not in the first position
    const filteredWords = _.concat([_.first(words)], _.reject(_.drop(words), w => w === 'id'))
    const userFriendly = _.join(_.map(filteredWords, _.capitalize), ' ');
    return userFriendly;
}

const fieldsToColumns = fields => _.map(
    _.reject(fields, f => _.isEmpty(f.name)),
    c => ({
        name: c.name,
        displayName: fieldToDisplayName(c.name)
}));

function mapStateToProps(state) {
    return { 
        results: state.contextualPage.results,
        extraColumns: fieldsToColumns(state.contextualPage.selectColumns.columns),
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        changeTableProperties,
        search,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchResultsTable);