import { map, get as _get, partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { executeMagsSearch, executeMagsSitesMetadata } from 'api'
import { handleSimpleAPIResponse } from 'reducers/utils'
import { EmptyOTUQuery } from 'search'
import { ErrorList } from 'pages/search_page/reducers/types'

export const { magsFetchSamplesStarted, magsFetchSamplesEnded } = createActions(
  'MAGS_FETCH_SAMPLES_STARTED',
  'MAGS_FETCH_SAMPLES_ENDED'
)

const resultsInitialState = {
  isLoading: false,
  hasLoaded: false,
  data: [],
  otus: [],
}

export const fetchMagsSamples = () => (dispatch) => {
  const fetchAllSamples = partial(
    executeMagsSitesMetadata,
    // NOTE: using EmptyOTUQuery.
    // In order to see all sites, we don't filter on amplicon. This means we
    // can't filter on taxonomy source either. This means richness and abundance
    // will probably be meaningless.
    // See https://github.com/BioplatformsAustralia/bpaotu/issues/214
    EmptyOTUQuery
  )

  dispatch(magsFetchSamplesStarted())
  handleSimpleAPIResponse(dispatch, fetchAllSamples, magsFetchSamplesEnded)
}

export default handleActions(
  {
    [magsFetchSamplesStarted as any]: (state, action) => ({
      ...state,
      isLoading: true,
      data: [],
      otus: [],
    }),
    [magsFetchSamplesEnded as any]: (state, action: any) => ({
      ...state,
      isLoading: false,
      hasLoaded: true,
      data: map(action.payload.data.data, (sample) => ({
        bpadata: sample.bpa_data,
        abundance: sample.sample_otus_abundance,
        lat: sample.latitude,
        lng: sample.longitude,
      })),
      otus: action.payload.data.sample_otus,
    }),
  },
  resultsInitialState
)
