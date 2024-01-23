import React, { useEffect } from 'react'
import { isEmpty, noop } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { useAnalytics } from 'use-analytics'
import SamplesMap from 'components/samples_map'
import { fetchSampleMapSamples } from './reducers'

const MapPage = (props) => {
  const { page } = useAnalytics()

  // track page visit only on first render
  useEffect(() => {
    page()
  }, [page])

  const mapContainerHeight = window.innerHeight - 220 * 2 + 'px'
  const fetchSamples = isEmpty(props.markers) ? props.fetchSamples : noop

  return (
    <div style={{ height: mapContainerHeight }}>
      <SamplesMap
        fetchSamples={fetchSamples}
        isLoading={props.isLoading}
        markers={props.markers}
        sample_otus={props.sample_otus}
        abundance_matrix={props.abundance_matrix}
      />
    </div>
  )
}

function mapStateToProps(state) {
  return {
    isLoading: state.mapPage.isLoading,
    markers: state.mapPage.samples,
    sample_otus: state.mapPage.sample_otus,
    abundance_matrix: state.mapPage.abundance_matrix,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchSamples: fetchSampleMapSamples,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(MapPage)
