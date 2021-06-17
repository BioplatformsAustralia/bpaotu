import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { Col, Container, Row } from 'reactstrap'

import SearchButton from '../../components/search_button'
import AnimateHelix from '../../components/animate_helix'
import AmpliconTaxonomyFilterCard from './components/amplicon_taxonomy_filter_card'
import BlastSearchCard from './components/blast_search_card'
import ContextualFilterCard from './components/contextual_filter_card'
import SearchErrors from './components/search_errors'
import SearchResultsCard from './components/search_results_card'

import { search } from './reducers/search'

export const SearchPage = props => (
  <Container fluid={true}>
    
    <Row>
      <Col sm={6}>
        <Row>
          <Col data-tut="reactour__AmpliconTaxonomyFilterCard">
            <AmpliconTaxonomyFilterCard  />
          </Col>
        </Row>
        <Row className="space-above">
          <Col>
            <BlastSearchCard />
          </Col>
        </Row>
      </Col>
      <Col sm={6} data-tut="reactour__ContextualFilterCard">
        <ContextualFilterCard />
      </Col>
    </Row>
    
    <Row className="space-above">
      <Col sm={{ size: 6, offset: 3 }}>
        <SearchErrors errors={props.errors} />
      </Col>
    </Row>

    <Row className="space-above">
      {props.isSearchInProgress ? (
        <Col className="text-center" sm={12}>
          <AnimateHelix scale={0.2} />
        </Col>
      ) : (
        <Col sm={{ size: 2, offset: 5 }} data-tut="reactour__SearchButton">
          <SearchButton search={props.search} />
        </Col>
      )}
    </Row>

    <Row className="space-above"></Row>

    <Row className="space-above">
      <Col sm={12} data-tut="reactour__SearchResultsCard">
        <SearchResultsCard />
      </Col>
    </Row>
  </Container>
)

function mapStateToProps(state) {
  return {
    isSearchInProgress: state.searchPage.results.isLoading,
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
