import { join } from 'lodash'
import * as React from 'react'

/*
 TODO: Consider this comment from index.tsx: /* TODO
         Port the footer into React as well. Currently it is provided by the base.html Django template.
         What is preventing porting it for now is the wrapping logic. Check .content-div in bpaotu.css for more details.
*/

export default props => {
  const logoPNG = name => join([window.otu_search_config.static_base_url, 'bpa-logos', name], '/')
  return (
    <footer className="site-footer space-above">
      <div className="site-footer-links container-fluid">
        <a href="http://www.bioplatforms.com">Operated by Bioplatforms Australia</a>
        <a href="https://github.com/BioplatformsAustralia/bpaotu">Source Code</a>
        <a href="mailto:help@bioplatforms.com" data-tut="reactour__Contact">Contact</a>
      </div>
      <div className="site-footer-logo container-fluid">
        <span>
          <a href="https://www.bioplatforms.com">
            <img className="footer-logos" src={logoPNG('bpa-logos/BIO-RGB_Large-NEGTRANS.png')} alt="Bioplatforms Australia" />
          </a>
        </span>
        <span style={{ paddingLeft: 30 }}>
          <a href="https://www.education.gov.au/national-collaborative-research-infrastructure-strategy-ncris">
            <img className="footer-logos" src={logoPNG('ncris-footer.png')} />
          </a>
        </span>
      </div>
    </footer>
  )
}
