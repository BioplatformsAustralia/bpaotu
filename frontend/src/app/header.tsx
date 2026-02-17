import React, { useEffect, useState } from 'react'
import { join } from 'lodash'
import { Collapse, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap'
import { NavLink as RRNavLink } from 'react-router-dom'
import { useAnalytics } from 'use-analytics'

import { useDispatch, useSelector } from 'react-redux'
import { setPortalContext } from 'reducers/context'
import { fetchReferenceData } from 'reducers/reference_data/reference_data'

import Octicon from 'components/octicon'
import MainTutorial from 'components/tutorials/main_tutorial'

const Header = ({ userEmailAddress }) => {
  const { track } = useAnalytics()

  const dispatch = useDispatch()
  const portalContext = useSelector((state: any) => state.context.portalContext)

  const setAM = () => dispatch(setPortalContext('am'))
  const setEDNA = () => dispatch(setPortalContext('edna'))

  // manage state of NavbarToggler for smaller screens
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => setIsOpen(!isOpen)

  useEffect(() => {
    dispatch(fetchReferenceData())
  }, [portalContext, dispatch])

  const navLinkStyle = {
    paddingLeft: '16px',
    paddingRight: '16px',
  } as React.CSSProperties

  const logoPNG_AM =
    window.otu_search_config.static_base_url +
    join(['bpa-logos', 'Australian-Microbiome-LOGO.png'], '/')

  const logoPNG_eDNA =
    window.otu_search_config.static_base_url + join(['bpa-logos', 'CSIRO_Solid_RGB.png'], '/')

  const logoByContext: Record<string, string> = {
    am: logoPNG_AM,
    edna: logoPNG_eDNA,
  }

  const activeLogo = logoByContext[portalContext]

  return (
    <Navbar color="light" light={true} expand="lg">
      <NavbarBrand className="site-header-logo" href="/">
        <img className="logo" src={activeLogo} alt="Context logo" />
      </NavbarBrand>
      <div className="d-flex flex-column align-items-center mr-3">
        <button
          className={`btn btn-sm mb-1 ${
            portalContext === 'am' ? 'btn-primary' : 'btn-outline-primary'
          }`}
          onClick={setAM}
        >
          AM
        </button>
        <button
          className={`btn btn-sm mt-1 ${
            portalContext === 'edna' ? 'btn-primary' : 'btn-outline-primary'
          }`}
          onClick={setEDNA}
        >
          eDNA
        </button>
      </div>
      <NavbarToggler onClick={toggle} />
      <Collapse isOpen={isOpen} navbar={true}>
        <Nav tabs className="navbar-nav">
          <NavItem>
            <NavLink
              style={navLinkStyle}
              activeClassName="active"
              tag={RRNavLink}
              data-tut="tabHighlighterAmplicon"
              to="/"
              exact={true}
            >
              {/*<Octicon name="beaker" />*/}
              Amplicon
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink
              style={navLinkStyle}
              activeClassName="active"
              tag={RRNavLink}
              data-tut="tabHighlighterMetagenome"
              to="/metagenome"
            >
              {/*<Octicon name="list-unordered" />*/}
              Metagenome
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink style={navLinkStyle} activeClassName="active" tag={RRNavLink} to="/contextual">
              {/*<Octicon name="file" />*/}
              Contextual
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink style={navLinkStyle} activeClassName="active" tag={RRNavLink} to="/mags">
              {/*<Octicon name="file" />*/}
              MAGs
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink style={navLinkStyle} activeClassName="active" tag={RRNavLink} to="/map">
              {/*<Octicon name="globe" />*/}
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
            <NavLink href="mailto:help@bioplatforms.com?subject=Australian%20Microbiome%20Help">
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
