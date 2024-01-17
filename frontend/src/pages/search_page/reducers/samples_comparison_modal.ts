import { createActions, handleActions } from 'redux-actions'
import { searchPageInitialState } from './types'

import { map, partial } from 'lodash'
import { executeSampleSitesSearch } from 'api'
import { handleSimpleAPIResponse } from 'reducers/utils'
import { describeSearch } from './search'

export const {
  openSamplesComparisonModal,
  closeSamplesComparisonModal,

  samplesComparisonModalFetchSamplesStarted,
  samplesComparisonModalFetchSamplesEnded,
} = createActions(
  'OPEN_SAMPLES_Comparison_MODAL',
  'CLOSE_SAMPLES_Comparison_MODAL',

  'SAMPLES_COMPARISON_MODAL_FETCH_SAMPLES_STARTED',
  'SAMPLES_COMPARISON_MODAL_FETCH_SAMPLES_ENDED'
)

export const fetchSampleComparisonModalSamples = () => (dispatch, getState) => {
  const state = getState()
  const filters = describeSearch(state)

  dispatch(samplesComparisonModalFetchSamplesStarted())
  handleSimpleAPIResponse(
    dispatch,
    partial(executeSampleSitesSearch, filters),
    samplesComparisonModalFetchSamplesEnded
  )
}

export default handleActions(
  {
    [openSamplesComparisonModal as any]: (state, action) => ({
      ...state,
      isOpen: true,
    }),
    [closeSamplesComparisonModal as any]: (state, action) => ({
      ...state,
      isOpen: false,
    }),
    [samplesComparisonModalFetchSamplesStarted as any]: (state, action) => ({
      ...state,
      isLoading: true,
      markers: [],
      sample_otus: [],
    }),
    [samplesComparisonModalFetchSamplesEnded as any]: (state, action: any) => ({
      ...state,
      isLoading: false,
      markers: map(action.payload.data.data, (sample) => ({
        bpadata: sample.bpa_data,
        lat: sample.latitude,
        lng: sample.longitude,
        site_images: sample.site_images,
      })),
      sample_otus: action.payload.data.sample_otus,
    }),
  },
  searchPageInitialState.samplesComparisonModal
)
