import React, { useCallback, useEffect } from 'react'
import { isEmpty, noop } from 'lodash'

import { useAppDispatch, useAppSelector } from 'hooks/redux'

import { useAnalytics } from 'use-analytics'
import type { RootState } from 'app/store'
import SamplesMap from 'components/samples_map'
import { fetchSampleMapSamples } from './reducers'

const MapPage = () => {
  const { page } = useAnalytics()
  const dispatch = useAppDispatch()
  const { isLoading, markers, sample_otus, abundance_matrix } = useAppSelector(
    (state: RootState) => ({
      isLoading: state.mapPage.isLoading,
      markers: state.mapPage.samples,
      sample_otus: state.mapPage.sample_otus,
      abundance_matrix: state.mapPage.abundance_matrix,
    })
  )

  // track page visit only on first render
  useEffect(() => {
    page()
  }, [page])

  const fetchSamples = useCallback(() => dispatch(fetchSampleMapSamples()), [dispatch])
  const handleFetchSamples = isEmpty(markers) ? fetchSamples : noop
  const mapContainerHeight = window.innerHeight - 220 * 2 + 'px'

  return (
    <div style={{ height: mapContainerHeight }}>
      <SamplesMap
        fetchSamples={handleFetchSamples}
        isLoading={isLoading}
        markers={markers}
        sample_otus={sample_otus}
        abundance_matrix={abundance_matrix}
      />
    </div>
  )
}

export default MapPage
