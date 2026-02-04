import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { NavLink as RRNavLink } from 'react-router-dom'
import { NavLink } from 'reactstrap'
import { Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap'

import { changeTablePropertiesMags, searchMags } from 'pages/mags_page/reducers/mags'
import { fetchMagsSamples } from 'pages/mags_page/reducers/samples'

import {
  InfoTable,
  LoadingSpinner,
  MagsPageContainer,
  MagsMap,
  OMDBLink,
  SampleMagsTable,
} from 'pages/mags_page/components'
import { sampleColumns } from 'pages/mags_page/definitions/sample_columns'

const SampleInformation = ({ record }) => {
  return (
    <Card>
      <CardHeader>Sample Information</CardHeader>
      <CardBody>
        <InfoTable columns={sampleColumns} record={record} />
      </CardBody>
    </Card>
  )
}

export const SampleMagsPage = (props) => {
  // from router
  const { sample_id: sampleId } = props.match.params

  const dispatch = useDispatch()
  const { results, samples } = useSelector((state: any) => {
    return {
      results: state.magsPage.results,
      samples: state.magsPage.samples,
    }
  })

  useEffect(() => {
    // reset filter to just sample id and reset to page 0
    const filtered = [{ id: 'sample_id', value: sampleId }]
    const args = {
      ...results,
      filtered,
      page: 0,
    }

    dispatch(changeTablePropertiesMags(args))
    dispatch(searchMags())
  }, [sampleId])

  // if loading this page directly or for the first then sample metadata won't be present
  // (we may get it to fetch sample data /mags)
  // so check it exist in the state and load if not
  // we want these to run on first mount, not when resultsData/samplesData change
  // (they will not change if fetchMagsRecords/fetchMagsSamples never run again)

  useEffect(() => {
    if (!results.data.length) dispatch(searchMags())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!samples.data.length) dispatch(fetchMagsSamples())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loading =
    (results.isLoading && !results.hasLoaded) ||
    (samples.isLoading && !samples.hasLoaded) ||
    (!results.isLoading && !results.hasLoaded && !samples.isLoading && !samples.hasLoaded)

  if (loading) {
    return <LoadingSpinner text="Loading Sample data" />
  }

  console.log('results', results)

  const siteRecord = samples.data.find((x) => Object.keys(x.bpadata).includes(sampleId))
  if (!siteRecord) {
    return (
      <MagsPageContainer>
        <div>
          <p>Could not find result for sample_id: {sampleId}</p>
        </div>
      </MagsPageContainer>
    )
  }

  const sampleRecord = siteRecord.bpadata[sampleId]
  if (!sampleRecord) {
    return (
      <MagsPageContainer>
        <div>
          <p>Could not find result for sample_id: {sampleId}</p>
        </div>
      </MagsPageContainer>
    )
  }

  const firstResult = results && results.data && results.data[0]

  return (
    <MagsPageContainer>
      <Row>
        <Col sm={7}>
          <SampleInformation record={sampleRecord} />
        </Col>

        <Col sm={5}>
          <MagsMap item={siteRecord} />
        </Col>
      </Row>

      <Row style={{ marginTop: '20px' }}>
        <Col>
          <SampleMagsTable sampleId={sampleId} />
        </Col>
      </Row>
      <Row style={{ marginTop: '20px' }}>
        <Col>
          <OMDBLink result={firstResult} />
        </Col>
      </Row>
    </MagsPageContainer>
  )
}

export default SampleMagsPage
