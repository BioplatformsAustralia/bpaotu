import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { NavLink as RRNavLink } from 'react-router-dom'
import { NavLink } from 'reactstrap'
import { Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap'

import { searchMags } from 'pages/mags_page/reducers/mags'
import { fetchMagsSamples } from 'pages/mags_page/reducers/samples'

import {
  DownloadsTable,
  InfoTable,
  LoadingSpinner,
  MagsMap,
  MagsPageContainer,
} from 'pages/mags_page/components'
import { searchColumns } from 'pages/mags_page/definitions/search_columns'

import './styles.css'

const GenomeInformation = ({ record }) => {
  return (
    <Card>
      <CardHeader tag="h5">Genome Information</CardHeader>
      <CardBody>
        <InfoTable columns={searchColumns} record={record} />
      </CardBody>
    </Card>
  )
}

export const InspectMagPage = (props) => {
  // from router
  const { mag_id: magId } = props.match.params

  const dispatch = useDispatch()
  const { results, samples } = useSelector((state: any) => {
    return {
      results: state.magsPage.results,
      samples: state.magsPage.samples,
    }
  })

  // if loading this page directly (i.e. refresh with url params) sample metadata won't be present
  // so check it exist in the state and load if not
  // we want these to run on first mount, not when resultsData/samplesData change

  useEffect(() => {
    if (!results.data.length) dispatch(searchMags(magId))
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

  // TEMP: using unique_id for the actual matching, still keep the naming as mag_id
  const resultRecord = results.data.find((x) => x.unique_id === magId)

  if (!resultRecord) {
    return (
      <MagsPageContainer>
        <div>
          <p>Could not find result record for mag_id: {magId}</p>
        </div>
      </MagsPageContainer>
    )
  }

  const sampleId = resultRecord.sample_id.toString()
  const sampleRecord = samples.data.find((x) => Object.keys(x.bpadata).includes(sampleId))

  if (!sampleRecord) {
    return (
      <MagsPageContainer>
        <div>
          <p>
            Could not find result sample for mag_id: {magId} and sample_id: {sampleId}
          </p>
        </div>
      </MagsPageContainer>
    )
  }

  return (
    <MagsPageContainer>
      <Row>
        <Col sm={7}>
          <GenomeInformation record={resultRecord} />
        </Col>

        <Col sm={5}>
          <MagsMap item={sampleRecord} />
        </Col>
      </Row>

      <Row style={{ marginTop: '20px' }}>
        <Col sm={7}>
          <DownloadsTable magId={magId} />
        </Col>
      </Row>
    </MagsPageContainer>
  )
}

export default InspectMagPage
