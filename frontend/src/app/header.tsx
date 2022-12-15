import { join } from 'lodash'
import * as React from 'react'
import { Collapse, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap'

import { NavLink as RRNavLink } from 'react-router-dom'
import Octicon from '../components/octicon'
import BPAOTUTour from '../components/bpaotu_tour'

const Motd = () =>(
  <div style={{margin: '0 1rem', border: '1px solid #ddd', padding: '1rem', fontSize: '75%'}}>
    We are experiencing a few issues that may affect the performance of Australian Microbiome OTU database. We are in the process of addressing these issues and expect them to be resolved in early January 2023.  If you experience problems, or require assistance accessing data while we investigate these issues please email us at help@bioplatforms.com
  </div>)

export default class Header extends React.Component<any, any> {
  constructor(props) {
    super(props)

    this.toggle = this.toggle.bind(this)
    this.state = {
      isOpen: false
    }
  }

  public toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    })
  }

  public render() {
    const logoPNG = window.otu_search_config.static_base_url + join(['bpa-logos', 'BIO-RGB_Full-POS_Portal.png'], '/')
    return (
      <>
      <Motd/>
      <Navbar color="light" light={true} expand="lg">
        <NavbarBrand className="site-header-logo" href="/">
          <img className="logo" src={logoPNG} alt="Bioplatform Australia" />
        </NavbarBrand>
        <NavbarToggler onClick={this.toggle} />
        <Collapse isOpen={this.state.isOpen} navbar={true}>
          <Nav tabs className="navbar-nav">

            <NavItem>
              <NavLink exact={true} to="/" activeClassName="active" tag={RRNavLink}>
                Amplicon
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink to="/contextual" activeClassName="active" tag={RRNavLink}>
                Contextual
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink to="/non-denoised" activeClassName="active" tag={RRNavLink}>
                Non-denoised data
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink to="/metagenome" activeClassName="active" tag={RRNavLink}>
                Metagenome
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink to="/map" activeClassName="active" tag={RRNavLink}>
                Map
              </NavLink>
            </NavItem>

          </Nav>
          <Nav className="ml-auto" navbar={true}>

            <NavItem>
              <NavLink>
                <BPAOTUTour />
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink target="_am" href={window.otu_search_config.ckan_base_url + "organization/pages/australian-microbiome/processed"}>
                Help
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink target="_am" href={window.otu_search_config.ckan_base_url + "organization/about/australian-microbiome"}>
                Australian Microbiome Home
              </NavLink>
            </NavItem>

            <NavItem>
              {this.props.userEmailAddress ? (
                <div className="navbar-text">
                  <Octicon name="person" />
                  <span className="site-header-username">{this.props.userEmailAddress}</span>
                </div>
              ) : (
                ''
              )}
            </NavItem>
          </Nav>
        </Collapse>
      </Navbar>
      </>
    )
  }
}
