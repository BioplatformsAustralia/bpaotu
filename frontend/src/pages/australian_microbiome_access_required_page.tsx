import * as React from 'react'
import { Alert, Container } from 'reactstrap'

export default (props) => {
  // ckanURL changed to host location so that ckan and bpaotu are pointed to the same server address
  const ckanURL = (path) => `${window.location.origin}/${path}`

  return (
    <Container fluid={true}>
      <Alert color="danger" className="text-center">
        <h4 className="alert-heading">Australian Microbiome Data Access Required</h4>
        <p>You do not have access to the Australian Microbiome data.</p>
        <p>
          Please request membership via the <a href={ckanURL('member-request/new')}>memberships</a>{' '}
          page on the Bioplatforms Australia Data Portal.
        </p>
        <p>
          Please contact <a href="mailto:help@bioplatforms.com">help@bioplatforms.com</a> for
          additional support.
        </p>
      </Alert>
    </Container>
  )
}
