import React, { useEffect, useContext } from 'react'
import { useAppDispatch, useAppSelector } from 'hooks/redux'
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

import { openBlastModal } from './reducers/blast_search_modal'
import { openSamplesMapModal } from './reducers/samples_map_modal'
import { openSamplesGraphModal } from './reducers/samples_graph_modal'
import { openSamplesComparisonModal } from './reducers/samples_comparison_modal'
import { search } from './reducers/search'
import { clearSearchResults } from './reducers/search'

const SearchPage = (props) => {
  const dispatch = useAppDispatch()
  const isSearchInProgress = useAppSelector((state) => state.searchPage.results.isLoading)
  const isBlastSearchRunning = useAppSelector((state) => state.searchPage.blastSearchModal.isSubmitting)
  const isBlastSearchFinished = useAppSelector((state) => state.searchPage.blastSearchModal.isFinished)
  const isComparisonRunning = useAppSelector((state) => state.searchPage.samplesComparisonModal.isLoading)
  const isComparisonFinished = useAppSelector((state) => state.searchPage.samplesComparisonModal.isFinished)
  const errors = useAppSelector((state) => state.searchPage.results.errors)
  const auth = useAppSelector((state) => state.auth)
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

  const clearSearchResultsAction = () => dispatch(clearSearchResults())
  const searchAction = (trackValue) => dispatch(search(trackValue))
  const openBlastModalAction = () => dispatch(openBlastModal())
  const openSamplesMapModalAction = () => dispatch(openSamplesMapModal())
  const openSamplesGraphModalAction = () => dispatch(openSamplesGraphModal())
  const openSamplesComparisonModalAction = () => dispatch(openSamplesComparisonModal())

  const newSearch = () => {
    clearSearchResultsAction()
    searchAction(track)
  }
  const blastSearch = () => {
    openBlastModalAction()
  }
  const interactiveMapSearch = () => {
    openSamplesMapModalAction()
  }
  const interactiveGraphSearch = () => {
    openSamplesGraphModalAction()
  }
  const interactiveSampleComparison = () => {
    openSamplesComparisonModalAction()
  }

  const children = React.Children.toArray(props.children)

  // this is here so we can access the auth state
  // it will trigger on both Amplicon and Metagenome search pages
  // but that is not an issue
  triggerHashedIdentify(identify, auth.email)

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
          <SearchErrors errors={errors} />
        </Col>
      </Row>

      <Row className="mt-4 mb-4">
        {isSearchInProgress ? (
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
              {isBlastSearchRunning && <SearchRunningIcon />}
              {isBlastSearchFinished && <SearchFinishedIcon />}
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
                octicon="git-compare"
                text="Sample comparison"
                onClick={interactiveSampleComparison}
              />
              {isComparisonRunning && <SearchRunningIcon />}
              {isComparisonFinished && <SearchFinishedIcon />}
            </Col>
          </>
        )}
      </Row>

      <Row className="space-above">{children[2]}</Row>
    </Container>
  )
}

const ConnectedSearchPage = withAnalytics(SearchPage)

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
