import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import {
    Alert,
    Container,
    Col,
    Row,
} from 'reactstrap';

import AmpliconTaxonomyFilterCard from './containers/amplicon_taxonomy_filter_card';
import ContextualFilterCard from './containers/contextual_filter_card';
import SearchButton from './containers/search_button';
import SearchResultsCard from './containers/search_results_card';

import { getCKANAuthInfo } from './actions/index';

class App extends React.Component<any> {
    componentWillMount() {
        if (window.otu_search_config.ckan_auth_integration) {
            this.props.getCKANAuthInfo();
        }
    }

    render() {
        if (window.otu_search_config.ckan_auth_integration) {
            if (this.props.auth.isLoginInProgress) {
                return this.renderLoginInProgress();
            }
            if (!this.props.auth.isLoggedIn) {
                return this.renderLoginRequired();
            }
        }
        return this.renderApp();
    }

    renderApp() {
        return (
            <div>
                <Container fluid>
                    <Row>
                        <Col sm={6}>
                            <AmpliconTaxonomyFilterCard />
                        </Col>
                        <Col sm={6}>
                            <ContextualFilterCard />
                        </Col>
                    </Row>
                    <Row className="space-above">
                        <Col sm={{ size: 2, offset: 5 }}>
                            <SearchButton />
                        </Col>
                    </Row>
                    <Row className="space-above">
                        <Col sm={12}>
                            <SearchResultsCard />

                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }

    renderLoginInProgress() {
        const ckanURL = (path) => `${window.otu_search_config.ckan_base_url}/${path}`

        return (
            <Container fluid>
                <Alert color="warning" className="text-center">
                    <h4 className="alert-heading">Login Required</h4>
                    <p>
                        Please stand by while we're checking your permissions to the Bioplatforms Data Portal.
                        If you cannot access the application, contact <a href='help@bioplatforms.com'>support</a>.
                    </p>
                </Alert>
            </Container>
        );
    }
    renderLoginRequired() {
        const ckanURL = (path) => `${window.otu_search_config.ckan_base_url}/${path}`

        return (
            <Container fluid>
                <Alert color="danger" className="text-center">
                    <h4 className="alert-heading">Login required</h4>
                    <p>
                        Please log into the <a href={ckanURL('user/login')}>Bioplatforms Data Portal</a>, or <a href={ckanURL('user/register')}>request access</a>.
                        If you still cannot access the data after logging in, contact <a href='help@bioplatforms.com'>support</a>.
                    </p>
                </Alert>
            </Container>
        );
    }
}


function mapStateToProps(state) {
    return {
        auth: state.auth
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getCKANAuthInfo,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
