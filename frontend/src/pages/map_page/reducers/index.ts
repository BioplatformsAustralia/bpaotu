import { map, partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { executeSampleSitesSearch } from '../../../api'
import { handleSimpleAPIResponse } from '../../../reducers/utils'
import { EmptyOTUQuery } from '../../../search'

export const { samplesMapFetchSamplesStarted, samplesMapFetchSamplesEnded } = createActions(
  'SAMPLES_MAP_FETCH_SAMPLES_STARTED',
  'SAMPLES_MAP_FETCH_SAMPLES_ENDED'
)

export const fetchSampleMapSamples = () => dispatch => {
  const fetchAllSamples = partial(executeSampleSitesSearch, EmptyOTUQuery)

  dispatch(samplesMapFetchSamplesStarted())
  handleSimpleAPIResponse(dispatch, fetchAllSamples, samplesMapFetchSamplesEnded)
}

const initialState = {
  isLoading: false,
  samples: [],
  sample_otus: []
}

export default handleActions(
  {
    [samplesMapFetchSamplesStarted as any]: (state, action) => ({
      ...state,
      isLoading: true,
      samples: []
    }),
    [samplesMapFetchSamplesEnded as any]: (state, action: any) => ({
      ...state,
      isLoading: false,
      samples: map(action.payload.data.data, sample => ({
        bpadata: sample.bpa_data,
        abundance: sample.sample_otus_abundance,
        lat: sample.latitude,
        lng: sample.longitude,
        site_images: sample.site_images
      })),
      sample_otus: action.payload.data.sample_otus
    })
  },
  initialState
)
