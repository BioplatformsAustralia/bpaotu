import * as React from "react";
import { join } from "lodash";
import { Link } from 'react-router-dom'

export default class Footer extends React.Component<any, any> {
  public render() {
    const logoPNG = (name) =>
      join([window.otu_search_config.static_base_url.replace(/\/$/, ''), "bpa-logos", name], "/");

    return (
      <footer className="site-footer space-above">
        <div className="site-footer-links container-fluid">
          <a href="http://www.bioplatforms.com">
            Operated by Bioplatforms Australia
          </a>
          <a href="https://github.com/BioplatformsAustralia/bpaotu">
            Source Code
          </a>
          <Link to="/privacy-policy">
            Privacy Policy
          </Link>
          <a href="mailto:help@bioplatforms.com" data-tut="reactour__Contact">
            Contact
          </a>
        </div>
        <div className="site-footer-logo container-fluid">
          <span>
            <a href="https://www.bioplatforms.com">
              <img
                className="footer-logos"
                src={logoPNG("BIO-RGB_Large-NEGTRANS.png")}
                alt="Bioplatforms Australia"
              />
            </a>
          </span>
          <span style={{ paddingLeft: 30 }}>
            <a href="https://www.education.gov.au/national-collaborative-research-infrastructure-strategy-ncris">
              <img className="footer-logos" src={logoPNG("ncris-footer.png")} />
            </a>
          </span>
        </div>
      </footer>
    );
  }
}
