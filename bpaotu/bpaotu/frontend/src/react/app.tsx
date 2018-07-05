import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
    BrowserRouter as Router,
    Link,
    Route,
    Redirect,
    Switch,
    withRouter,
 } from 'react-router-dom';

import {
    Alert,
    Container,
    Col,
    Nav,
    Navbar,
    NavbarBrand,
    NavItem,
    Row,
} from 'reactstrap';

import Octicon from './components/octicon';
import SearchPage from './containers/search_page';

import { getCKANAuthInfo } from './actions/index';


class App extends React.Component<any> {
    componentWillMount() {
        if (window.otu_search_config.ckan_auth_integration) {
            this.props.getCKANAuthInfo();
        }
    }

    render() {
        return (
            <div>
                <Header userEmailAddress={this.props.auth.email} />
                { this.renderContents() }

                { /* TODO
                    Port the footer into React as well. Currently it is provided by the base.html Django template.
                    What is preventing porting it for now is the wrapping logic. Check .content-div in bpaotu.css for more details.
                <Footer /> */}
            </div>
        );
    }

    renderContents() {
        if (window.otu_search_config.ckan_auth_integration) {
            if (this.props.auth.isLoginInProgress) {
                return <LoginInProgress />
            }
            if (!this.props.auth.isLoggedIn) {
                return <LoginRequired />
            }
        }
        return <Routes />
    }
}

function Routes(props) {
    return (
        <div>
            <Route exact path="/" component={SearchPage} />
            {/* Add more routes here:
            <Route path="/bye" component={GoodbyePage} />
            <Route path="/hello" component={HelloPage} />
            */}
        </div>
    );
}

function Header(props) {
    const logoPNG = _.join([window.otu_search_config.static_base_url, 'bpa-logos', 'bpalogo_withdataportal.png'], '/');
    return (
        <Navbar>
            <NavbarBrand className="site-header-logo" href="https://data.bioplatforms.com/">
                <img src={logoPNG} alt="Bioplatform Australia" />
            </NavbarBrand>
            <Nav className="ml-auto site-header-user" navbar>
                <NavItem>
                    { props.userEmailAddress ?
                        <div>
                            <Octicon name="person" />
                            <span className="site-header-username">
                                { props.userEmailAddress }
                            </span>
                        </div> : ''
                    }
                </NavItem>
            </Nav>
        </Navbar>
    );
}

function Footer(props) {
    const logoPNG = (name) => _.join([window.otu_search_config.static_base_url, 'bpa-logos', name], '/');
    return (
        <footer className="site-footer space-above">
            <div className="site-footer-links container-fluid">
                <a href="http://www.bioplatforms.com">Operated by Bioplatforms Australia</a>
                <a href="https://github.com/muccg/bpaotu">Source Code</a>
                <a href="mailto:help@bioplatforms.com">Contact</a>
            </div>
            <div className="site-footer-logo container-fluid">
                <span>
                    <a href="https://www.bioplatforms.com">
                        <img className="footer-logos" src={ logoPNG('bpa-footer.png') } alt="Bioplatforms Australia" />
                      </a>
                </span>
                <span style={{paddingLeft: 30}}>
                    <a href="https://www.education.gov.au/national-collaborative-research-infrastructure-strategy-ncris">
                        <img className="footer-logos" src={ logoPNG('ncris-footer.png') } />
                    </a>
                </span>
            </div>
        </footer>
    );
}

function LoginInProgress(props) {
    const ckanURL = (path) => `${window.otu_search_config.ckan_base_url}/${path}`

    return (
        <Container fluid>
            <Alert color="warning" className="text-center">
                <h4 className="alert-heading">Login Required</h4>
                <p>
                    Please stand by while we're checking your permissions to the Bioplatforms Data Portal.
                    If you cannot access the application, contact <a href='mailto:help@bioplatforms.com'>support</a>.
                </p>
            </Alert>
        </Container>
    );
}

function LoginRequired(props) {
    const ckanURL = (path) => `${window.otu_search_config.ckan_base_url}/${path}`

    return (
        <Container fluid>
            <Alert color="danger" className="text-center">
                <h4 className="alert-heading">Login required</h4>
                <p>
                    Please log into the <a href={ckanURL('user/login')}>Bioplatforms Data Portal</a>, or <a href={ckanURL('user/register')}>request access</a>.
                    If you still cannot access the data after logging in, contact <a href='mailto:help@bioplatforms.com'>support</a>.
                </p>
            </Alert>
        </Container>
    );
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App) as any);
