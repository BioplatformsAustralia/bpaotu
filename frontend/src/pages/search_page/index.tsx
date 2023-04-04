import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Col, Container, Row } from 'reactstrap'

import analytics, { triggerHashedIdentify } from 'app/analytics'

import AnimateHelix from 'components/animate_helix'
import SearchButton from 'components/search_button'

import { AmpliconTaxonomyFilterCard } from './components/amplicon_taxonomy_filter_card'
import BlastSearchCard from './components/blast_search_card'
import ContextualFilterCard from './components/contextual_filter_card'
import SearchErrors from './components/search_errors'
import { SearchResultsCard, MetagenomeSearchResultsCard } from './components/search_results_card'

import { openSamplesMapModal } from './reducers/samples_map_modal'
import { openSamplesGraphModal } from './reducers/samples_graph_modal'
import { search } from './reducers/search'
import { clearSearchResults } from './reducers/search'

const SearchPage = (props) => {
  const newSearch = () => {
    props.clearSearchResults()
    props.search()
  }
  const interactiveMapSearch = () => {
    analytics.track('otu_interactive_map_search')
    props.openSamplesMapModal()
  }
  const interactiveGraphSearch = () => {
    analytics.track('otu_interactive_graph_search')
    props.openSamplesGraphModal()
  }

  const children = React.Children.toArray(props.children)

  // this is here so we can access the auth state
  // it will trigger on both Amplicon and Metagenome search pages
  // but that is not an issue
  triggerHashedIdentify(props.auth.email)

  return (
    <Container fluid={true}>
      <Row>
        <Col sm={6}>
          <Row>{children[0]}</Row>
          {children[1]}
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

      <Row className="space-above space-below">
        {props.isSearchInProgress ? (
          <Col className="text-center" sm={12}>
            <AnimateHelix scale={0.2} />
          </Col>
        ) : (
          <>
            <Col sm={{ size: 2, offset: 3 }}>
              <SearchButton octicon="search" text="Sample search" onClick={newSearch} />
            </Col>
            <Col sm={{ size: 2 }}>
              <SearchButton
                octicon="globe"
                text="Interactive map search"
                onClick={interactiveMapSearch}
              />
            </Col>
            <Col sm={{ size: 2 }}>
              <SearchButton
                octicon="graph"
                text="Interactive graph search"
                onClick={interactiveGraphSearch}
              />
            </Col>
          </>
        )}
      </Row>

      <Row className="space-above">{children[2]}</Row>
    </Container>
  )
}

function mapStateToProps(state) {
  return {
    isSearchInProgress: state.searchPage.results.isLoading,
    errors: state.searchPage.results.errors,
    auth: state.auth,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      openSamplesMapModal,
      openSamplesGraphModal,
      search,
      clearSearchResults,
    },
    dispatch
  )
}

const ConnectedSearchPage = connect(mapStateToProps, mapDispatchToProps)(SearchPage)

export function SampleSearchPage() {
  analytics.page()

  return (
    <ConnectedSearchPage>
      <Col data-tut="reactour__AmpliconTaxonomyFilterCard">
        <AmpliconTaxonomyFilterCard metagenomeMode={false} />
      </Col>

      <Row className="space-above">
        <Col>
          <BlastSearchCard />
        </Col>
      </Row>

      <Col sm={12} data-tut="reactour__SearchResultsCard">
        <SearchResultsCard />
      </Col>
    </ConnectedSearchPage>
  )
}

export function MetaGenomeSearchPage() {
  analytics.page()

  return (
    <ConnectedSearchPage>
      <Col>
        <AmpliconTaxonomyFilterCard metagenomeMode={true} />
      </Col>

      <></>

      <Col sm={12}>
        <MetagenomeSearchResultsCard />
      </Col>
    </ConnectedSearchPage>
  )
}
