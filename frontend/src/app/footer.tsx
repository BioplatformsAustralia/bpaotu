import React from 'react'
import { join } from 'lodash'
import { Link } from 'react-router-dom'
import { useAnalytics } from 'use-analytics'
import { useDispatch, useSelector } from 'react-redux'

import { openBlastModal } from 'pages/search_page/reducers/blast_modal'

const Footer = () => {
  const { track } = useAnalytics()
  const dispatch = useDispatch()

  const logoPNG = (name) =>
    join([window.otu_search_config.static_base_url.replace(/\/$/, ''), 'bpa-logos', name], '/')

  return (
    <footer className="site-footer space-above">
      <div className="site-footer-links container-fluid">
        <span>
          <a href="http://www.bioplatforms.com">Operated by Bioplatforms Australia</a>
        </span>
        <span>
          <a href="https://github.com/BioplatformsAustralia/bpaotu">Source Code</a>
        </span>
        <span>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </span>
        <span>
          <a
            href="mailto:help@bioplatforms.com"
            data-tut="reactour__Contact"
            onClick={() => {
              track('otu_click_footer_contact')
            }}
          >
            Contact
          </a>
        </span>
      </div>
      <div className="site-footer-logo container-fluid">
        <span>
          <a href="https://www.bioplatforms.com">
            <img
              className="footer-logos"
              src={logoPNG('BIO-RGB_Large-NEGTRANS.png')}
              alt="Bioplatforms Australia"
            />
          </a>
        </span>
        <span>
          <a href="https://www.australianmicrobiome.com/">
            <img
              className="footer-logos"
              src={logoPNG('Australian-Microbiome-NEGTRANS.png')}
              alt="Australian Microbiome"
            />
          </a>
        </span>
        <span style={{ paddingLeft: 30 }}>
          <a href="https://www.education.gov.au/national-collaborative-research-infrastructure-strategy-ncris">
            <img
              className="footer-logos"
              src={logoPNG('ncris-footer.png')}
              alt="National Research Infrastructure for Australia"
            />
          </a>
        </span>
        <div>
          {window.otu_search_config.version && (
            <p style={{ fontSize: 12, marginTop: 4 }}>
              <span onClick={() => dispatch(openBlastModal())}>Version:</span>{' '}
              {window.otu_search_config.version}
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}

export default Footer
