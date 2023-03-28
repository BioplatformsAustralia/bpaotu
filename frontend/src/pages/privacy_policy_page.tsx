import * as React from 'react'
import { Alert, Container } from 'reactstrap'

import analytics from 'app/analytics'

export default props => {
  analytics.page();

  return (
    <Container fluid={true}>
      <h4>Privacy Policy</h4>
      <p>Lorem ipsum</p>
    </Container>
  )
}
