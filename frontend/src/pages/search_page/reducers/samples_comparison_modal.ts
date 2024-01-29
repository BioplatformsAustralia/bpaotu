import { createActions, handleActions } from 'redux-actions'
import { searchPageInitialState } from './types'

import { map, partial } from 'lodash'
import { executeSampleSitesComparisonSearch } from 'api'
import { handleSimpleAPIResponse } from 'reducers/utils'
import { describeSearch } from './search'

export const {
  openSamplesComparisonModal,
  closeSamplesComparisonModal,

  samplesComparisonModalFetchSamplesStarted,
  samplesComparisonModalFetchSamplesEnded,
  samplesComparisonModalProcessingStarted,
  samplesComparisonModalProcessingEnded,
} = createActions(
  'OPEN_SAMPLES_Comparison_MODAL',
  'CLOSE_SAMPLES_Comparison_MODAL',

  'SAMPLES_COMPARISON_MODAL_FETCH_SAMPLES_STARTED',
  'SAMPLES_COMPARISON_MODAL_FETCH_SAMPLES_ENDED',
  'SAMPLES_COMPARISON_MODAL_PROCESSING_STARTED',
  'SAMPLES_COMPARISON_MODAL_PROCESSING_ENDED'
)

const executeSampleSitesComparisonProcessing = () => {
  console.log('hi')
}

export const fetchSampleComparisonModalSamples = () => (dispatch, getState) => {
  const state = getState()
  const filters = describeSearch(state)

  dispatch(samplesComparisonModalFetchSamplesStarted())
  handleSimpleAPIResponse(
    dispatch,
    partial(executeSampleSitesComparisonSearch, filters),
    samplesComparisonModalFetchSamplesEnded
  )
}

export const processSampleComparisonModalSamples = () => (dispatch, getState) => {
  const state = getState()
  const filters = describeSearch(state)

  // dispatch(samplesComparisonModalProcessingStarted())

  // executeSampleSitesComparisonProcessing()
  //   .then(() => {
  //     console.log('then')
  //   })
  //   .catch(() => {
  //     console.log('catch')
  //   })
  //   .finally(() => {
  //     samplesComparisonModalProcessingEnded()
  //   })
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
      abundance_matrix: [],
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
      abundance_matrix: action.payload.data.abundance_matrix,
    }),
    [samplesComparisonModalProcessingStarted as any]: (state, action) => ({
      ...state,
      isLoading: false,
      isProcessing: true,
    }),
    [samplesComparisonModalProcessingEnded as any]: (state, action: any) => ({
      ...state,
      isLoading: false,
      isProcessing: false,
    }),
  },
  searchPageInitialState.samplesComparisonModal
)
