  import React, { useState } from 'react'
  import { join } from 'lodash'

  import { useSelector } from 'react-redux'
  import { Collapse, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink as RSNavLink } from 'reactstrap'
  import { NavLink  } from 'react-router-dom'

  import MainTutorial from 'components/tutorials/main_tutorial'
  import UserProfile from 'components/user_profile'

  const Header = () => {
    const { auth } = useSelector((state: any) => ({
      auth: state.auth,
    }))

    // manage state of NavbarToggler for smaller screens
    const [isOpen, setIsOpen] = useState(false)
    const toggle = () => setIsOpen(!isOpen)

    const magsAvailable = window.otu_search_config.mags_available

    const navLinkStyle = {
      paddingLeft: '16px',
      paddingRight: '16px',
    } as React.CSSProperties

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
                to="/"
                end
                data-tut="tabHighlighterAmplicon"
                style={navLinkStyle}
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                {/*<Octicon name="beaker" />*/}
                Amplicon
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink
                to="/metagenome"
                data-tut="tabHighlighterMetagenome"
                style={navLinkStyle}
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                {/*<Octicon name="list-unordered" />*/}
                Metagenome
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink
                to="/contextual"
                style={navLinkStyle}
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                {/*<Octicon name="file" />*/}
                Contextual
              </NavLink>
            </NavItem>

            {magsAvailable && (
              <NavItem>
                <NavLink
                  to="/mags"
                  style={navLinkStyle}
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  {/*<Octicon name="file" />*/}
                  MAGs
                </NavLink>
              </NavItem>
            )}

            <NavItem>
              <NavLink
                to="/map"
                style={navLinkStyle}
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                {/*<Octicon name="globe" />*/}
                Map
              </NavLink>
            </NavItem>
          </Nav>
          <Nav className="ms-auto" navbar={true}>
            <NavItem>
              <RSNavLink>
                <MainTutorial />
              </RSNavLink>
            </NavItem>

            <NavItem>
              <RSNavLink href="mailto:help@bioplatforms.com?subject=Australian%20Microbiome%20Help">
                Help
              </RSNavLink>
            </NavItem>

            <NavItem>
              <RSNavLink
                target="_am"
                href={
                  window.otu_search_config.ckan_base_url + 'organization/about/australian-microbiome'
                }
              >
                Australian Microbiome Home
              </RSNavLink>
            </NavItem>

            <NavItem>
              <UserProfile auth={auth} header={true} />
            </NavItem>
          </Nav>
        </Collapse>
      </Navbar>
    )
  }

  export default Header
