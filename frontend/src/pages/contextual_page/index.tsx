import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import { useAnalytics } from 'use-analytics'
import { Col, Container, Row } from 'reactstrap'

import SearchResultsCard from './components/search_results_card'
import SelectColumnsCard from './components/select_columns_card'

export const ContextualPage = (props) => {
  const { page } = useAnalytics()

  // track page visit only on first render
  useEffect(() => {
    page()
  }, [page])

  return (
    <Container fluid={true}>
      <Row className="space-above">
        <Col sm={{ size: 6, offset: 3 }}>
          <SelectColumnsCard />
        </Col>
      </Row>

      <Row className="space-above">
        <Col sm={12}>
          <SearchResultsCard />
        </Col>
      </Row>
    </Container>
  )
}

function mapStateToProps(state) {
  return {
    isSearchButtonDisabled: state.searchPage.results.isLoading,
    errors: state.searchPage.results.errors,
  }
}

export default connect(mapStateToProps)(ContextualPage)
