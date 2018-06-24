import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
    Card,
    CardBody,
    CardHeader,
    Container,
    Col,
    Modal,
    ModalBody,
    ModalHeader,
    Row,
    Button,
} from 'reactstrap';

import Octicon from '../components/octicon';
import SamplesMapModal from './samples_map_modal';
import SearchResultsTable from './search_results_table';
import { describeSearch, openSamplesMapModal } from '../actions';

const HeaderButton = (props) => (
    <Button style={{ marginRight: 10 }} outline color="primary" onClick={props.onClick} >
        {(props.octicon) ? (<span><Octicon name={props.octicon} />&nbsp;</span>) : ''}
        {props.text}
    </Button>
);

class SearchResultsCard extends React.Component<any, any> {
    render() {
        return (
            <div>
                <Card>
                    <CardHeader>
                        <div >
                            <HeaderButton octicon="globe" text="Show results on Map" onClick={this.props.openSamplesMapModal} />
                            {window.otu_search_config.ckan_auth_integration && (
                                <HeaderButton octicon="clippy" text="Submit to Galaxy" />
                            )}
                            <HeaderButton octicon="desktop-download" text="Export Search Results (CSV)" onClick={this.exportCSV.bind(this)} />
                            <HeaderButton octicon="desktop-download" text="Export Search Results (BIOM)" onClick={this.exportBIOM.bind(this)} />
                        </div>
                    </CardHeader>
                    <CardBody>
                        <SearchResultsTable />
                    </CardBody>
                </Card>
                <SamplesMapModal />
            </div>
        );
    }

    export(baseURL) {
        let params = new URLSearchParams();
        params.set('token', this.props.ckanAuthToken);
        params.set('q', JSON.stringify(describeSearch(this.props.filters)));

        const url = `${baseURL}?${params.toString()}`;
        window.open(url)
    }

    exportBIOM() {
        this.export(window.otu_search_config.export_biom_endpoint);
    }

    exportCSV() {
        this.export(window.otu_search_config.export_endpoint);
    }
}

function mapStateToProps(state) {
    return {
        ckanAuthToken: state.auth.ckanAuthToken,
        filters: state.searchPage.filters,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        openSamplesMapModal,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchResultsCard);
