import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';

import {
    Card,
    CardBody,
    CardHeader,
    Button,
} from 'reactstrap';

import Octicon from '../../../components/octicon';

import SearchResultsTable from './search_results_table';
import { EmptyOTUQuery } from '../../../search';

const HeaderButton = (props) => (
    <Button style={{ marginRight: 10 }} outline color="primary" disabled={props.disabled} onClick={props.onClick} >
        {(props.octicon) ? (<span><Octicon name={props.octicon} />&nbsp;</span>) : ''}
        {props.text}
    </Button>
);

class SearchResultsCard extends React.Component<any, any> {
    render() {
        console.log('Columns', this.props.extraColumns);
        return (
            <div>
                <Card>
                    <CardHeader>
                        <div >
                            <HeaderButton octicon="desktop-download" text="Export Search Results (CSV)" onClick={this.exportCSV.bind(this)} />
                        </div>
                    </CardHeader>
                    <CardBody>
                        <SearchResultsTable />
                    </CardBody>
                </Card>
            </div>
        );
    }

    exportCSV() {
        let params = new URLSearchParams();
        params.set('token', this.props.ckanAuthToken);
        params.set('otu_query', JSON.stringify(EmptyOTUQuery));
        params.set('columns', JSON.stringify(this.props.extraColumns));
        params.set('sorting', JSON.stringify(this.props.sorting));

        const baseURL = window.otu_search_config.contextual_csv_download_endpoint;
        const url = `${baseURL}?${params.toString()}`;
        window.open(url)
    }
}

function mapStateToProps(state) {
    return {
        ckanAuthToken: state.auth.ckanAuthToken,
        extraColumns: _.reject(_.map(state.contextualPage.selectColumns.columns, c => c.name), c => _.isEmpty(c)),
        sorting: state.contextualPage.results.sorted,
    };
}

export default connect(mapStateToProps, null)(SearchResultsCard);
