import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { NavLink as RRNavLink } from 'react-router-dom'
import { NavLink } from 'reactstrap'
import { Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap'

import { searchMags } from '../mags_page/reducers/mags'
import { fetchMagsSamples } from '../mags_page/reducers/samples'

import AnimateHelix from 'components/animate_helix'

import MagsMap from './components/mags_map'
import { columns } from '../mags_page/definitions/columns'

import './styles.css'

const GenomeInformation = ({ columns, resultRecord }) => {
  return (
    <Card>
      <CardHeader>Genome Information</CardHeader>
      <CardBody>
        <table className="info-table">
          <tbody>
            {columns.map((f) => (
              <tr key={f.accessor}>
                <td className="info-label">{f.Header}</td>
                <td className="info-value">{resultRecord[f.accessor]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  )
}

const InspectContainer = ({ children }) => {
  return (
    <Container fluid={true}>
      <Row>
        <div>
          <NavLink to="/mags" tag={RRNavLink}>
            Back
          </NavLink>
        </div>
      </Row>

      {children}
    </Container>
  )
}

export const MagsInspectPage = (props) => {
  // from router
  const { bin_id: binId } = props.match.params

  const dispatch = useDispatch()

  const { results, samples } = useSelector((state: any) => {
    return {
      results: state.magsPage.results,
      samples: state.magsPage.samples,
    }
  })

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
    (results.isLoading && !results.hasLoaded) || (samples.isLoading && !samples.hasLoaded)
  if (loading) {
    return (
      <Container>
        <div
          style={{
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <p>Loading Sample data</p>
          <AnimateHelix />
        </div>
      </Container>
    )
  }

  // TEMP: using unique_id for the actual matching, still keep the naming as bin_id
  const resultRecord = results.data.find((x) => x.unique_id === binId)

  if (!resultRecord) {
    return (
      <InspectContainer>
        <div>
          <p>Could not find result record for bin_id: {binId}</p>
        </div>
      </InspectContainer>
    )
  }

  const sampleId = resultRecord.sample_id.toString()
  const sampleRecord = samples.data.find((x) => Object.keys(x.bpadata).includes(sampleId))

  if (!sampleRecord) {
    return (
      <InspectContainer>
        <div>
          <p>
            Could not find result sample for bin_id: {binId} and sample_id: {sampleId}
          </p>
        </div>
      </InspectContainer>
    )
  }

  const DownloadTable = () => {
    // this would also come from the main object
    const files = [{ label: 'Genome', filename: 'MAG_0001.fa.gz', link: '' }]

    return (
      <Card>
        <CardHeader>Downloads Table</CardHeader>
        <CardBody>
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Filename</th>
                <th>Download</th>
              </tr>
            </thead>

            <tbody>
              {files.map((f) => (
                <tr key={f.label}>
                  <td>{f.label}</td>
                  <td>{f.filename}</td>
                  <td>{f.link}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    )
  }

  return (
    <InspectContainer>
      <Row>
        <Col sm={7}>
          <GenomeInformation columns={columns} resultRecord={resultRecord} />
        </Col>

        <Col sm={5}>
          <MagsMap item={sampleRecord} />
        </Col>
      </Row>

      <Row style={{ marginTop: '20px' }}>
        <Col>
          <DownloadTable />
        </Col>
      </Row>
    </InspectContainer>
  )
}

export default MagsInspectPage
