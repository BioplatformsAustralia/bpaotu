import * as _ from 'lodash';
import * as React from 'react';
import {Nav, Navbar, NavbarBrand, NavItem} from 'reactstrap';

import Octicon from '../components/octicon';

export default props => {
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