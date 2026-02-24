import React, { useState } from 'react'
import { Collapse, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap'
import { NavLink as RRNavLink } from 'react-router-dom'
import { useAnalytics } from 'use-analytics'

import Octicon from 'components/octicon'
import MainTutorial from 'components/tutorials/main_tutorial'

import { logoPNG } from 'app/helpers'

const Header = ({ userEmailAddress }) => {
  const { track } = useAnalytics()

  // manage state of NavbarToggler for smaller screens
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => setIsOpen(!isOpen)

  const navLinkStyle = {
    paddingLeft: '16px',
    paddingRight: '16px',
  } as React.CSSProperties

  const navRightStyle = {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginRight: '14px',
  } as React.CSSProperties

  const navAMLogoStyle = {
    maxWidth: '100px',
    textAlign: 'center',
    fontSize: '0.8em',
  } as React.CSSProperties

  const logoBP = logoPNG('BIO-RGB_Full-POS_Portal.png')

  return (
    <Navbar color="light" light={true} expand="lg">
      <NavbarBrand className="site-header-logo" href="/">
        <img className="logo" src={logoBP} alt="Bioplatform Australia" />
      </NavbarBrand>
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
        <Nav className="ml-auto" style={{ alignItems: 'center' }} navbar={true}>
          <div style={navRightStyle}>
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

            <NavItem>
              <NavLink>
                <MainTutorial />
              </NavLink>
            </NavItem>
          </div>

          <NavItem>
            <NavLink target="_am" href="https://www.australianmicrobiome.com/">
              <div style={navAMLogoStyle}>
                <span>
                  <img
                    src={logoPNG('Australian-Microbiome-LOGO.png')}
                    alt="Australian Microbiome"
                    height="85"
                    width="85"
                  />
                </span>
                <p>Australian Microbiome Home</p>
              </div>
            </NavLink>
          </NavItem>
        </Nav>
      </Collapse>
    </Navbar>
  )
}

export default Header
