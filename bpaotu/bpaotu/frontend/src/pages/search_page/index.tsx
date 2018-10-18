import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { Col, Container, Row } from 'reactstrap'

import SearchButton from '../../components/search_button'
import AmpliconTaxonomyFilterCard from './components/amplicon_taxonomy_filter_card'
import ContextualFilterCard from './components/contextual_filter_card'
import SearchErrors from './components/search_errors'
import SearchResultsCard from './components/search_results_card'

import { search } from './reducers/search'

export const SearchPage = props => (
  <Container fluid={true}>
    <Row>
      <Col sm={6}>
        <AmpliconTaxonomyFilterCard />
      </Col>
      <Col sm={6}>
        <ContextualFilterCard />
      </Col>
    </Row>

    <Row className="space-above">
      <Col sm={{ size: 6, offset: 3 }}>
        <SearchErrors errors={props.errors} />
      </Col>
    </Row>

    <Row className="space-above">
      <Col sm={{ size: 2, offset: 5 }}>
        <SearchButton isDisabled={props.isSearchButtonDisabled} search={props.search} />
      </Col>
    </Row>
    <Row className="space-above">
      <Col sm={12}>
        <SearchResultsCard />
      </Col>
    </Row>
  </Container>
)

function mapStateToProps(state) {
  return {
    isSearchButtonDisabled: state.searchPage.results.isLoading,
    errors: state.searchPage.results.errors
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      search
    },
    dispatch
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchPage)
