import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import { useAnalytics } from 'use-analytics'
import { Col, Container, Row } from 'reactstrap'

import MagsResultsCard from './components/mags_results_card'

export const MagsPage = (props) => {
  const { page } = useAnalytics()

  // track page visit only on first render
  useEffect(() => {
    page()
  }, [page])

  return (
    <Container fluid={true}>
      <Row className="space-above">
        <Col sm={12}>
          <MagsResultsCard />
        </Col>
      </Row>
    </Container>
  )
}

export default MagsPage
