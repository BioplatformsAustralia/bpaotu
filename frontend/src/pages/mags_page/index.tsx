import React, { useEffect } from 'react'
import { Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap'
import { useAnalytics } from 'use-analytics'
import { useDispatch, useSelector } from 'react-redux'

import { changeTablePropertiesMags, searchMags } from 'pages/mags_page/reducers/mags'

import { SearchResultsTable } from 'pages/mags_page/components/'

export const MagsPage = () => {
  const { page } = useAnalytics()
  const dispatch = useDispatch()

  const { results } = useSelector((state: any) => {
    return {
      results: state.magsPage.results,
    }
  })

  // track page visit only on first render
  useEffect(() => {
    page()
  }, [page])

  // reset page and filters and search once on initial mount
  // (run the reset ONLY if we don't already have usable state)
  useEffect(() => {
    const hasLoaded = results && results.hasLoaded === true
    const hasFilters = results && Array.isArray(results.filtered) && results.filtered.length > 0
    const hasData = results && Array.isArray(results.data) && results.data.length > 0
    const alreadyInitialised = hasLoaded || hasFilters || hasData

    const nonSampleFiltered = (results.filtered || []).filter((f) => f.id !== 'sample_id')

    // on mount: don't change filters if data exists or they have been set (but do reset to page 0)
    // but always remove any transient sample_id filter left behind by a sample route.
    let args = { ...results, page: 0, filtered: nonSampleFiltered }
    if (!alreadyInitialised) {
      args = { ...args, filtered: [] }
    }

    // console.log('[MagsPage] mount/init', {
    //   alreadyInitialised,
    //   incomingFiltered: results.filtered,
    //   outgoingFiltered: args.filtered,
    //   results,
    // })

    // on mount: always update/refetch data
    dispatch(changeTablePropertiesMags(args))
    dispatch(searchMags())

    // on mount:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Container fluid={true}>
      <Row className="space-above">
        <Col sm={12}>
          <div>
            <Card>
              <CardHeader tag="h5">Metagenome-Assembled Genomes</CardHeader>
              <CardBody>
                <SearchResultsTable />
              </CardBody>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  )
}

export default MagsPage
