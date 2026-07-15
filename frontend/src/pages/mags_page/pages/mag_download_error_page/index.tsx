import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { NavLink as RRNavLink, useLocation } from 'react-router-dom'
import { Card, CardHeader, CardBody, Container, Row, Col, NavLink } from 'reactstrap'

const leftColumnStyle = {
  display: 'inline-block',
  width: 150,
  minWidth: 150,
  fontWeight: 'bold',
} as React.CSSProperties

export const MagDownloadErrorPage = (props) => {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const magId = params.get('magId')
  const downloadType = params.get('downloadType')

  return (
    <Container fluid={true}>
      <Row className="space-above">
        <Col sm={{ size: 6, offset: 3 }}>
          <Card>
            <CardHeader tag="h5">File Not Available</CardHeader>
            <CardBody>
              <p>The requested file does not exist:</p>
              <p>
                <span style={leftColumnStyle}>MAG ID:</span>
                <span>{magId}</span>
              </p>
              <p>
                <span style={leftColumnStyle}>Download type:</span>
                <span>{downloadType}</span>
              </p>
              <p>Please contact us to request more information.</p>
              <p>
                <a href="#" onClick={() => window.close()}>
                  Close this window and return to data portal
                </a>
              </p>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default MagDownloadErrorPage
