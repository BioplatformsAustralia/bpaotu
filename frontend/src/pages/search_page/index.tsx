import React, { useEffect, useContext } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Col, Container, Row } from 'reactstrap'

import { triggerHashedIdentify } from 'app/analytics'
import { useAnalytics } from 'use-analytics'
import { withAnalytics } from 'use-analytics'

import AnimateHelix from 'components/animate_helix'
import SearchButton from 'components/search_button'
import { TourContext } from 'providers/tour_provider'

import { AmpliconTaxonomyFilterCard } from './components/amplicon_taxonomy_filter_card'
import ContextualFilterCard from './components/contextual_filter_card'
import SearchErrors from './components/search_errors'
import SearchRunningIcon from './components/search_running_icon'
import SearchFinishedIcon from './components/search_finished_icon'
import { SearchResultsCard, MetagenomeSearchResultsCard } from './components/search_results_card'

import { openBlastModal } from './reducers/blast_modal'
import { openSamplesMapModal } from './reducers/samples_map_modal'
import { openSamplesGraphModal } from './reducers/samples_graph_modal'
import { openSamplesComparisonModal } from './reducers/samples_comparison_modal'
import { search } from './reducers/search'
import { clearSearchResults } from './reducers/search'

const SearchPage = (props) => {
  const { page, track, identify } = useAnalytics()
  const { setMainTourStep } = useContext(TourContext)

  // this correctly recognises whether this is the Amplicon or Metagenome page
  // track page visit only on first render
  useEffect(() => {
    page()
  }, [page])

  // ensure tour starts from the start if user switches the page
  useEffect(() => {
    setMainTourStep(0)
  }, [setMainTourStep])

  const newSearch = () => {
    props.clearSearchResults()
    props.search(track)
  }
  const blastSearch = () => {
    track('otu_blast_search')
    props.openBlastModal()
  }
  const interactiveMapSearch = () => {
    track('otu_interactive_map_search')
    props.openSamplesMapModal()
  }
  const interactiveGraphSearch = () => {
    track('otu_interactive_graph_search')
    props.openSamplesGraphModal()
  }
  const interactiveSampleComparison = () => {
    track('otu_interactive_comparison_search')
    props.openSamplesComparisonModal()
  }

  const children = React.Children.toArray(props.children)

  // this is here so we can access the auth state
  // it will trigger on both Amplicon and Metagenome search pages
  // but that is not an issue
  triggerHashedIdentify(identify, props.auth.email)

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
            <Col sm={{ size: 2, offset: 1 }}>
              <SearchButton
                id="SampleSearchButton"
                octicon="search"
                text="Sample search"
                onClick={newSearch}
              />
            </Col>
            <Col sm={{ size: 2 }} style={{ position: 'relative' }}>
              <SearchButton
                id="BLASTSearchButton"
                octicon="beaker"
                text="BLAST search"
                onClick={blastSearch}
              />
              {props.isBlastSearchRunning && <SearchRunningIcon />}
              {props.isBlastSearchFinished && <SearchFinishedIcon />}
            </Col>
            <Col sm={{ size: 2 }}>
              <SearchButton
                id="InteractiveMapSearchButton"
                octicon="globe"
                text="Interactive map search"
                onClick={interactiveMapSearch}
              />
            </Col>
            <Col sm={{ size: 2 }}>
              <SearchButton
                id="InteractiveGraphSearchButton"
                octicon="graph"
                text="Interactive graph search"
                onClick={interactiveGraphSearch}
              />
            </Col>
            <Col sm={{ size: 2 }}>
              <SearchButton
                id="InteractiveSampleComparisonButton"
                octicon="globe"
                text="Interactive sample comparison"
                onClick={interactiveSampleComparison}
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
    isBlastSearchRunning: state.searchPage.blastSearch.isSubmitting,
    isBlastSearchFinished: state.searchPage.blastSearch.isFinished,
    errors: state.searchPage.results.errors,
    auth: state.auth,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      openBlastModal,
      openSamplesMapModal,
      openSamplesGraphModal,
      openSamplesComparisonModal,
      search,
      clearSearchResults,
    },
    dispatch
  )
}

const ConnectedSearchPage = withAnalytics(connect(mapStateToProps, mapDispatchToProps)(SearchPage))

export function SampleSearchPage() {
  return (
    <ConnectedSearchPage>
      <Col data-tut="reactour__AmpliconTaxonomyFilterCard">
        <AmpliconTaxonomyFilterCard metagenomeMode={false} />
      </Col>

      <Row className="space-above">
        <Col></Col>
      </Row>

      <Col sm={12} data-tut="reactour__SearchResultsCard">
        <SearchResultsCard />
      </Col>
    </ConnectedSearchPage>
  )
}

export function MetagenomeSearchPage() {
  return (
    <ConnectedSearchPage>
      <Col data-tut="reactour__AmpliconTaxonomyFilterCard">
        <AmpliconTaxonomyFilterCard metagenomeMode={true} />
      </Col>

      <></>

      <Col sm={12} data-tut="reactour__SearchResultsCard">
        <MetagenomeSearchResultsCard />
      </Col>
    </ConnectedSearchPage>
  )
}
