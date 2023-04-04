import { isEmpty, noop } from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import analytics from 'app/analytics'
import SamplesMap from '../../components/samples_map'
import { fetchSampleMapSamples } from './reducers'

const MapPage = (props) => {
  analytics.page()

  const mapContainerHeight = window.innerHeight - 220 * 2 + 'px'
  const fetchSamples = isEmpty(props.markers) ? props.fetchSamples : noop

  return (
    <div style={{ height: mapContainerHeight }}>
      <SamplesMap
        fetchSamples={fetchSamples}
        isLoading={props.isLoading}
        markers={props.markers}
        sample_otus={props.sample_otus}
      />
    </div>
  )
}

function mapStateToProps(state) {
  return {
    isLoading: state.mapPage.isLoading,
    markers: state.mapPage.samples,
    sample_otus: state.mapPage.sample_otus,
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
