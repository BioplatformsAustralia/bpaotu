import { map, partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { executeSampleSitesSearch } from '../../../api'
import { handleSimpleAPIResponse } from '../../../reducers/utils'
import { describeSearch } from './search'
import { searchPageInitialState } from './types'

export const {
  openSamplesGraphModal,
  closeSamplesGraphModal,

  samplesGraphModalFetchSamplesStarted,
  samplesGraphModalFetchSamplesEnded
} = createActions(
  'OPEN_SAMPLES_Graph_MODAL',
  'CLOSE_SAMPLES_Graph_MODAL',

  'SAMPLES_Graph_MODAL_FETCH_SAMPLES_STARTED',
  'SAMPLES_Graph_MODAL_FETCH_SAMPLES_ENDED',
)

export const fetchSampleGraphModalSamples = () => (dispatch, getState) => {
  const state = getState();
  const filters = describeSearch(state.searchPage.filters, state.contextualDataDefinitions)

  dispatch(samplesGraphModalFetchSamplesStarted())
  handleSimpleAPIResponse(dispatch, partial(executeSampleSitesSearch, filters), samplesGraphModalFetchSamplesEnded)
}

export default handleActions(
  {
    [openSamplesGraphModal as any]: (state, action) => ({
      ...state,
      isOpen: true
    }),
    [closeSamplesGraphModal as any]: (state, action) => ({
      ...state,
      isOpen: false
    }),
    [samplesGraphModalFetchSamplesStarted as any]: (state, action) => ({
      ...state,
      isLoading: true,
      markers: [],
      sample_otus: []
    }),
    [samplesGraphModalFetchSamplesEnded as any]: (state, action: any) => ({
      ...state,
      isLoading: false,
      markers: map(action.payload.data.data, sample => ({
        bpadata: sample.bpa_data,
        abundance: sample.sample_otus_abundance,
        lat: sample.latitude,
        lng: sample.longitude,
        site_images: sample.site_images
      })),
      sample_otus: action.payload.data.sample_otus
    })
  },
  searchPageInitialState.samplesGraphModal
)
