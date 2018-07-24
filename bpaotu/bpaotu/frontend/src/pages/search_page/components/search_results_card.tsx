import * as _ from 'lodash';
import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
    Alert,
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

import Octicon from '../../../components/octicon';
import SamplesMapModal from './samples_map_modal';
import SearchResultsTable from './search_results_table';
import { describeSearch } from '../reducers/search';
import { openSamplesMapModal } from '../reducers/samples_map_modal';
import { GalaxySubmission } from '../reducers/types';
import { submitToGalaxy, clearGalaxyAlert } from '../reducers/submit_to_galaxy';

const HeaderButton = (props) => (
    <Button style={{ marginRight: 10 }} outline color="primary" disabled={props.disabled} onClick={props.onClick} >
        {(props.octicon) ? (<span><Octicon name={props.octicon} />&nbsp;</span>) : ''}
        {props.text}
    </Button>
);

class SearchResultsCard extends React.Component<any, any> {
    render() {
        /*
        TODO
        The UI for the galaxy submission will probably change, so showing the history link inside the Alert box might not
        be necessary later on.
        In case, we keep this code, we should probably use something like sanitize-html to make sure we don't end up with
        anything dangerous in the text.
        */
        const wrapText = (text) => ({__html: text});
        return (
            <div>
                <Card>
                    <CardHeader>
                        <div >
                            <HeaderButton octicon="globe" text="Show results on Map" onClick={this.props.openSamplesMapModal} />
                            {window.otu_search_config.ckan_auth_integration && (
                                <HeaderButton
                                    octicon="clippy"
                                    text="Submit to Galaxy"
                                    disabled={this.isGalaxySubmissionDisabled()}
                                    onClick={this.props.submitToGalaxy} />
                            )}
                            <HeaderButton octicon="desktop-download" text="Export Search Results (CSV)" onClick={this.exportCSV.bind(this)} />
                            <HeaderButton octicon="desktop-download" text="Export Search Results (BIOM)" onClick={this.exportBIOM.bind(this)} />
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div>
                            { this.props.galaxy.alerts.map((alert, idx) =>
                                (<Alert
                                    key={idx}
                                    color={alert.color}
                                    className="text-center"
                                    toggle={() => this.props.clearGalaxyAlert(idx)}>
                                        <div dangerouslySetInnerHTML={wrapText(alert.text)} />
                                 </Alert>))}
                        </div>
                        <SearchResultsTable />
                    </CardBody>
                </Card>
                <SamplesMapModal />
            </div>
        );
    }

    isGalaxySubmissionDisabled() {
        if (this.props.galaxy.isSubmitting) {
            return true;
        }
        const lastSubmission: GalaxySubmission = _.last(this.props.galaxy.submissions);
        return (lastSubmission && !lastSubmission.finished)
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
        galaxy: state.searchPage.galaxy,
        filters: state.searchPage.filters,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        openSamplesMapModal,
        submitToGalaxy,
        clearGalaxyAlert,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchResultsCard);
