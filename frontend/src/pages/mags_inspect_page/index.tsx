import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { NavLink as RRNavLink } from 'react-router-dom'
import { NavLink } from 'reactstrap'
import { Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap'

import AnimateHelix from 'components/animate_helix'

// import { fetchMagsRecords, fetchMagsSamples } from '../mags_page/reducers/'

import MagsMap from './components/mags_map'
import { columns } from '../mags_page/definitions/columns'

import './styles.css'

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
  return <p>hi</p>
}

export default MagsInspectPage

/*
export const MagsInspectPage = (props) => {
  const { data: resultsData } = props.results
  const { data: samplesData } = props.samples

  const { fetchMagsRecords, fetchMagsSamples } = props

  // if loading this page directly then sample metadata won't be present (it loads on /mags)
  // so check it exist in the state and load if not
  // we want these to run on first mount, not when resultsData/samplesData change
  // (they will not change if fetchMagsRecords/fetchMagsSamples never run again)

  useEffect(() => {
    if (!resultsData.length) fetchMagsRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!samplesData.length) fetchMagsSamples()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const noResultsData = !resultsData.length || props.results.isLoading
  const noSampleData = !samplesData.length || props.samples.isLoading

  if (noResultsData || noSampleData) {
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

  // from router
  const { bin_id: binId } = props.match.params

  // TEMP: using unique_id for the actual matching, still keep the naming as bin_id
  const resultRecord = resultsData.find((x) => x.unique_id === binId)

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
  const sampleRecord = samplesData.find((x) => Object.keys(x.bpadata).includes(sampleId))

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

  // const { page } = useAnalytics()

  // // track page visit only on first render
  // useEffect(() => {
  //   page()
  // }, [page])

  const GenomeInformation = () => {
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
          <GenomeInformation />
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

function mapStateToProps(state) {
  return {
    ...state.magsPage,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchMagsRecords,
      fetchMagsSamples,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(MagsInspectPage)
*/
