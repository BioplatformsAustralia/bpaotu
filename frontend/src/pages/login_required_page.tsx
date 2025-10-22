import * as React from 'react'
import { Alert, Container } from 'reactstrap'

export default (props) => {
  // ckanURL changed to host location so that ckan and bpaotu are pointed to the same server address
  const ckanURL = (path) => `${window.location.origin}/${path}`

  return (
    <Container fluid={true}>
      <Alert color="danger" className="text-center">
        <h4 className="alert-heading">Login required</h4>
        <p>
          Please log into the <a href={ckanURL('user/login')}>Bioplatforms Data Portal</a>, or{' '}
          <a href={ckanURL('user/register')}>request access</a>.
        </p>
        <p>
          If you still cannot access the data after logging in, please request membership via the{' '}
          <a href={ckanURL('member-request/new')}>memberships</a> page on the Bioplatforms Australia
          Data Portal.
        </p>
        <p>
          Alternatively, please contact{' '}
          <a href="mailto:help@bioplatforms.com">help@bioplatforms.com</a> for additional support.
        </p>
      </Alert>
    </Container>
  )
}
