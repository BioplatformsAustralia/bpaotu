import React, { useState } from 'react'
import { join } from 'lodash'
import { Collapse, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap'
import { NavLink as RRNavLink } from 'react-router-dom'
import { useAnalytics } from 'use-analytics'

import Octicon from 'components/octicon'
import MainTutorial from 'components/tutorials/main_tutorial'

const Header = ({ userEmailAddress }) => {
  const { track } = useAnalytics()

  // manage state of NavbarToggler for smaller screens
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => setIsOpen(!isOpen)

  const logoPNG =
    window.otu_search_config.static_base_url +
    join(['bpa-logos', 'BIO-RGB_Full-POS_Portal.png'], '/')

  return (
    <Navbar color="light" light={true} expand="lg">
      <NavbarBrand className="site-header-logo" href="/">
        <img className="logo" src={logoPNG} alt="Bioplatform Australia" />
      </NavbarBrand>
      <NavbarToggler onClick={toggle} />
      <Collapse isOpen={isOpen} navbar={true}>
        <Nav tabs className="navbar-nav">
          <NavItem>
            <NavLink
              exact={true}
              to="/"
              activeClassName="active"
              tag={RRNavLink}
              data-tut="tabHighlighterAmplicon"
            >
              Amplicon
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink
              to="/metagenome"
              activeClassName="active"
              tag={RRNavLink}
              data-tut="tabHighlighterMetagenome"
            >
              Metagenome
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
            <NavLink to="/map" activeClassName="active" tag={RRNavLink}>
              Map
            </NavLink>
          </NavItem>
        </Nav>
        <Nav className="ml-auto" navbar={true}>
          <NavItem>
            <NavLink>
              <MainTutorial />
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink
              target="_am"
              href={
                window.otu_search_config.ckan_base_url +
                'organization/pages/australian-microbiome/processed'
              }
              onClick={() => {
                console.log('otu_click_header_help before')
                track('otu_click_header_help')
                console.log('otu_click_header_help after')
              }}
            >
              Help
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink
              target="_am"
              href={
                window.otu_search_config.ckan_base_url + 'organization/about/australian-microbiome'
              }
            >
              Australian Microbiome Home
            </NavLink>
          </NavItem>

          <NavItem>
            {userEmailAddress ? (
              <div className="navbar-text">
                <Octicon name="person" />
                <span className="site-header-username">{userEmailAddress}</span>
              </div>
            ) : (
              ''
            )}
          </NavItem>
        </Nav>
      </Collapse>
    </Navbar>
  )
}

export default Header
