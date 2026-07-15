import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { NavLink as RRNavLink } from 'react-router-dom'
import { NavLink } from 'reactstrap'
import { Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap'

import { changeTablePropertiesMags, searchMags } from 'pages/mags_page/reducers/mags'
import { fetchMagsSamples, fetchSampleMagsCount } from 'pages/mags_page/reducers/samples'

import {
  InfoTable,
  LoadingSpinner,
  MagsPageContainer,
  MagsMap,
  OMDBCount,
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

const SampleMagsInformation = ({ sampleId, omdbResult }) => {
  const dispatch = useDispatch()
  const { isLoading, hasLoaded, sample_id, sample_mags_count } = useSelector(
    (state: any) => state.magsPage.samples.sampleMagsCount
  )

  useEffect(() => {
    dispatch(fetchSampleMagsCount(sampleId))
  }, [sampleId])

  const SampleMagsCount = () => {
    if (isLoading) return <em>Loading</em>
    if (hasLoaded) return <>{sample_mags_count}</>

    return null
  }

  return (
    <Card style={{ marginTop: 14 }}>
      <CardHeader>Total MAGs Identified</CardHeader>
      <CardBody>
        <table className="info-table">
          <tbody>
            <tr>
              <td className="info-label">Australian Microbiome</td>
              <td className="info-value">
                <SampleMagsCount />
              </td>
            </tr>
            <tr>
              <td className="info-label">
                OMDB
                <OMDBLink result={omdbResult} />
              </td>
              <td className="info-value">
                <OMDBCount result={omdbResult} />
              </td>
            </tr>
          </tbody>
        </table>
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

  // this sample_id filter will also be applied if the page is refreshed / loaded with url params
  // so there's no need to worry about results not being present as for refreshing inspect page
  // (other filters will be lost though)
  useEffect(() => {
    const existingFiltered = results.filtered || []
    const hasSampleIdFilter = existingFiltered.some((f) => f.id === 'sample_id')

    // if sample_id filter already present, do nothing
    // TODO: or maybe not... what if there was a partial sample_id filter?!?
    if (hasSampleIdFilter) return

    // add sample_id filter
    const sampleIdFilter = { id: 'sample_id', value: sampleId }
    const filtered = [...existingFiltered, sampleIdFilter]

    const args = {
      ...results,
      filtered,
      page: 0,
    }

    dispatch(changeTablePropertiesMags(args))
    dispatch(searchMags())

    // cleanup:
    // remove only the sample_id filter we added
    return () => {
      const updatedFiltered = (results.filtered || []).filter((f) => f.id !== 'sample_id')

      dispatch(
        changeTablePropertiesMags({
          ...results,
          filtered: updatedFiltered,
        })
      )
    }
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

  const loadingSamples = Boolean(samples.isLoading || !samples.hasLoaded)
  if (loadingSamples) {
    return <LoadingSpinner text="Loading Sample data" />
  }

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
          <SampleMagsInformation sampleId={sampleId} omdbResult={firstResult} />
        </Col>

        <Col sm={5}>
          <MagsMap sampleId={sampleId} />
        </Col>
      </Row>

      <Row style={{ marginTop: '20px' }}>
        <Col>
          <SampleMagsTable sampleId={sampleId} />
        </Col>
      </Row>
    </MagsPageContainer>
  )
}

export default SampleMagsPage
