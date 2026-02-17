import React, { useEffect } from 'react'
import { Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap'
import { useAnalytics } from 'use-analytics'
import { useDispatch, useSelector } from 'react-redux'

import { changeTablePropertiesMags, searchMags } from 'pages/mags_page/reducers/mags'

import { SearchResultsTable } from 'pages/mags_page/components/'

export const MagsPage = (props) => {
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
  useEffect(() => {
    const args = {
      ...results,
      filtered: [],
      page: 0,
    }

    dispatch(changeTablePropertiesMags(args))
    dispatch(searchMags())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Container fluid={true}>
      <Row className="space-above">
        <Col sm={12}>
          <div>
            <Card>
              <CardHeader>Metagenome-Assembled Genomes</CardHeader>
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
