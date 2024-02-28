import React from 'react'
import Plot from 'react-plotly.js'
import { plotly_chart_config } from './plotly_chart'
import { connect } from 'react-redux'
import { startCase, fromPairs, unzip } from 'lodash'
import numeric from 'numeric'

import { getAmpliconFilter } from '../../reducers/amplicon'

import {
  Container,
  Col,
  Row,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ButtonGroup,
  Button,
  UncontrolledTooltip,
} from 'reactstrap'

import AnimateHelix from 'components/animate_helix'

// import {
//   closeSamplesComparisonModal,
//   fetchSampleComparisonModalSamples,
//   processSampleComparisonModalSamples,
//   setSelectedMethod,
//   clearPlotData,
// } from '../reducers/samples_comparison_modal'

// import {
//   sparseToJaccardMatrix,
//   sparseToDense,
//   getJaccardDistanceMatrix,
//   getBrayCurtisDistanceMatrix,
//   classicMDS,
// } from './util/ordination'

// const MdsChartTaxonomy = () => {
class MdsChartTaxonomy extends React.Component<any> {
  render() {
    console.log('MdsChartTaxonomy', 'this.props', this.props)

    let graphData = this.props.taxonomyGraphdata
    if (!graphData) {
      return null
    }
    const title = startCase(this.props.filter) + ' Plot'
    const ampliconsById = fromPairs(this.props.options.map((kv) => [kv.id, kv.value]))

    const [labels, values] = unzip(
      Object.entries(graphData).map(([id, sum]) => [ampliconsById[id], sum])
    )

    let chart_data = [
      {
        values: values,
        labels: labels,
        textinfo: 'label+value+percent',
        automargin: true,
        opacity: 0.8,
        type: 'pie',
        insidetextorientation: 'radial',
        textposition: 'inside',
        marker: {
          line: {
            width: 2,
            color: 'white',
          },
        },
      },
    ]

    const LoadingSpinnerOverlay = () => {
      const loadingstyle = {
        display: 'flex',
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        left: 0,
        top: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 99999,
      } as React.CSSProperties

      return (
        <div style={loadingstyle}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <AnimateHelix />
            <div
              style={{
                display: 'inline-block',
                textAlign: 'center',
                margin: 12,
                padding: 6,
                background: 'white',
                width: '100%',
              }}
            >
              {/*{isLoading && <>Fetching Sample Information</>}
            {isProcessing && <>Calculating MDS Plot</>}*/}
            </div>
          </div>
        </div>
      )
    }

    return (
      <>
        {/*{isLoading && <LoadingSpinnerOverlay />}
      {isProcessing && <LoadingSpinnerOverlay />}*/}
        <Container>
          <Row>
            <Col xs="auto">Dissimilarity method:</Col>
            <Col xs="auto" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <select
                placeholder={'Select a method'}
                // value={selectedMethod}
                onChange={(e) => {
                  // setSelectedMethod(e.target.value)
                }}
              >
                <option value="jaccard">Jaccard</option>
                <option value="braycurtis">Bray-Curtis</option>
              </select>
            </Col>
          </Row>
        </Container>
        <Container>
          <Plot
            // data={plotDataTransformed}
            onClick={(e) => {
              const { points } = e
              // handlePointClick(points)
            }}
            layout={{ width: 640, height: 480, title: 'MDS Plot' }}
            config={{ displayLogo: false, scrollZoom: false }}
          />
        </Container>
        {/*<Container>
        {selectedSample.id && (
          <>
            <p>Sample Id: {selectedSample.id}</p>
            <p>x: {selectedSample.x}</p>
            <p>y: {selectedSample.y}</p>
            <p>Env: {contextual[selectedSample.id]['Am Environment']}</p>
          </>
        )}
      </Container>*/}
      </>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    options: state.referenceData.amplicons.values,
    selected: getAmpliconFilter(state),
  }
}

export default connect(mapStateToProps)(MdsChartTaxonomy)
