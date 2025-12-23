import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { useAnalytics } from 'use-analytics'
import { Card, CardBody, CardHeader, Container } from 'reactstrap'

import { fetchMagsRecords, fetchMagsSamples } from './reducers/'

import MagsTable from './components/mags_table'

import './styles.css'

export const MagsPage = (props) => {
  const { page } = useAnalytics()

  // track page visit only on first render
  useEffect(() => {
    page()
  }, [page])

  const { data: resultsData } = props.results
  const { data: samplesData } = props.samples
  const { fetchMagsRecords, fetchMagsSamples } = props

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

  const MagsTableCard = () => {
    return (
      <div>
        <Card>
          <CardHeader>Metagenome Assembled Genomes</CardHeader>
          <CardBody>
            <MagsTable />
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <Container fluid={true}>
      <MagsTableCard />
    </Container>
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

export default connect(mapStateToProps, mapDispatchToProps)(MagsPage)
