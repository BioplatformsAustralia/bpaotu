import { createActions, handleActions } from 'redux-actions'
import { searchPageInitialState } from './types'

import { map, partial } from 'lodash'
import { executeSampleSitesComparisonSearch } from 'api'
import { executeSampleSitesComparisonProcessing } from '../components/util/ordination'
import { handleSimpleAPIResponse } from 'reducers/utils'
import { describeSearch } from './search'

export const {
  openSamplesComparisonModal,
  closeSamplesComparisonModal,

  samplesComparisonModalFetchSamplesStarted,
  samplesComparisonModalFetchSamplesEnded,
  samplesComparisonModalProcessingStarted,
  samplesComparisonModalProcessingEnded,
  samplesComparisonModalSetSelectedMethod,
  samplesComparisonModalClearPlotData,
} = createActions(
  'OPEN_SAMPLES_Comparison_MODAL',
  'CLOSE_SAMPLES_Comparison_MODAL',

  'SAMPLES_COMPARISON_MODAL_FETCH_SAMPLES_STARTED',
  'SAMPLES_COMPARISON_MODAL_FETCH_SAMPLES_ENDED',
  'SAMPLES_COMPARISON_MODAL_PROCESSING_STARTED',
  'SAMPLES_COMPARISON_MODAL_PROCESSING_ENDED',
  'SAMPLES_COMPARISON_MODAL_SET_SELECTED_METHOD',
  'SAMPLES_COMPARISON_MODAL_CLEAR_PLOT_DATA'
)

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
  // console.log('processSampleComparisonModalSamples')
  // const state = getState()
  // const { plotData, selectedMethod } = state.searchPage.samplesComparisonModal
  // const { abundanceMatrix, contextual } = state.searchPage.samplesComparisonSearch
  // const args = { abundanceMatrix, contextual, plotData, selectedMethod }
  // // not actually an API call, but we can use handleSimpleAPIResponse to yield values to the reducer
  // dispatch(samplesComparisonModalProcessingStarted())
  // handleSimpleAPIResponse(
  //   dispatch,
  //   partial(executeSampleSitesComparisonProcessing, args),
  //   samplesComparisonModalProcessingEnded
  // )
}

export const setSelectedMethod = (selectedMethod) => (dispatch, getState) => {
  dispatch(samplesComparisonModalSetSelectedMethod(selectedMethod))
}

export const clearPlotData = () => (dispatch, getState) => {
  dispatch(samplesComparisonModalClearPlotData())
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
    [samplesComparisonModalFetchSamplesStarted as any]: (state, action) => {
      return {
        ...state,
        isLoading: true,
        markers: [],
        sampleOtus: [],
        abundanceMatrix: {},
        contextual: {},
      }
    },
    [samplesComparisonModalFetchSamplesEnded as any]: (state, action: any) => {
      return {
        ...state,
        isLoading: false,
        markers: map(action.payload.data.data, (sample) => ({
          bpadata: sample.bpa_data,
          lat: sample.latitude,
          lng: sample.longitude,
          site_images: sample.site_images,
        })),
        sampleOtus: action.payload.data.sample_otus,
        abundanceMatrix: action.payload.data.abundance_matrix,
        contextual: action.payload.data.contextual,
      }
    },
    [samplesComparisonModalProcessingStarted as any]: (state, action) => {
      return {
        ...state,
        isProcessing: true,
      }
    },
    [samplesComparisonModalProcessingEnded as any]: (state, action: any) => {
      return {
        ...state,
        isProcessing: false,
        // plotData: action.payload,
      }
    },
    [samplesComparisonModalSetSelectedMethod as any]: (state, action: any) => ({
      ...state,
      selectedMethod: action.payload,
    }),
    [samplesComparisonModalClearPlotData as any]: (state, action: any) => ({
      ...state,
      plotData: searchPageInitialState.samplesComparisonModal.plotData,
    }),
  },
  searchPageInitialState.samplesComparisonModal
)
