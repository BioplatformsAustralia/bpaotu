import LoginButton from 'components/login_button'
import RegisterButton from 'components/register_button'
import * as React from 'react'
import { Alert, Container } from 'reactstrap'

export default (props) => {
  return (
    <Container fluid={true}>
      <Alert color="danger" className="text-center">
        <h4 className="alert-heading">Login required</h4>
        <p>
          Please log into the <strong>Bioplatforms Data Portal</strong> with your{' '}
          <strong>BioCommons Access</strong> account
        </p>
        <div className="d-inline-flex align-items-center mb-5">
          <LoginButton className="btn btn-sm btn-primary" />
        </div>
        <p>
          If you do not have a <strong>BioCommons Access</strong> account please register for one
        </p>
        <div className="d-inline-flex align-items-center mb-5">
          <RegisterButton className="btn btn-sm btn-primary" />
        </div>
        <p>
          If you still cannot access the data after logging in, please request membership to the{' '}
          <strong>Australian Microbiome bundle</strong> in your{' '}
          <strong>My BioCommons Access</strong> page
        </p>
        <p>
          Alternatively, please contact{' '}
          <a href="mailto:help@bioplatforms.com">help@bioplatforms.com</a> for additional support
        </p>
      </Alert>
    </Container>
  )
}
