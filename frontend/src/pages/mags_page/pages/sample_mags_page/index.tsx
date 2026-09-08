import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { Card, CardBody, CardHeader, Col, Row } from 'reactstrap'

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
  const { isLoading, hasLoaded, sample_mags_count } = useSelector(
    (state: any) => state.magsPage.samples.sampleMagsCount,
  )

  useEffect(() => {
    dispatch(fetchSampleMagsCount(sampleId))
  }, [dispatch, sampleId])

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

export const SampleMagsPage = () => {
  const { sample_id: sampleId } = useParams<{ sample_id: string }>()

  const dispatch = useDispatch()
  const { results, samples } = useSelector((state: any) => {
    return {
      results: state.magsPage.results,
      samples: state.magsPage.samples,
    }
  })

  // Capture the filter snapshot from the render that mounted this sample route.
  // This is the "previous filters before the sample_id filter was added" state,
  // and it is the value that must be restored on cleanup.
  const originalFiltered = (results.filtered || []).filter((f) => f.id !== 'sample_id')

  useEffect(() => {
    const filtered = [...originalFiltered, { id: 'sample_id', value: sampleId }]

    // console.log('[SampleMagsPage] EFFECT mount/update', {
    //   sampleId,
    //   beforeFiltered: originalFiltered,
    //   afterFiltered: filtered,
    //   results,
    // })

    dispatch(
      changeTablePropertiesMags({
        ...results,
        filtered,
        page: 0,
      }),
    )
    dispatch(searchMags())

    return () => {
      // console.log('[SampleMagsPage] CLEANUP', {
      //   sampleId,
      //   beforeFiltered: results.filtered,
      //   afterFiltered: originalFiltered,
      //   results,
      // })

      // Restore the filters that existed before entering the sample route, and do
      // not trigger another search here. The main MAG page mount effect is the
      // correct place to refresh the page once it has been re-entered.
      dispatch(
        changeTablePropertiesMags({
          ...results,
          filtered: originalFiltered,
          page: 0,
        }),
      )
    }
    // Intentionally only run when the route sampleId changes; the effect itself
    // updates Redux, so `results` is intentionally excluded from the dependency
    // array to avoid a re-render / effect feedback loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, sampleId])

  // if loading this page directly or for the first then sample metadata won't be present
  // (we may get it to fetch sample data /mags)
  // so check it exist in the state and load if not
  // we want these to run on first mount, not when resultsData/samplesData change
  // (they will not change if fetchMagsRecords/fetchMagsSamples never run again)

  // Removed mount-time unconditional `searchMags()` to avoid duplicate
  // searches: the sampleId effect above will perform the search when
  // required (including when loading this page directly).

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
