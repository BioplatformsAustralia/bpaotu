import { map, get as _get, partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { executeMagsSearch, executeMagsSitesMetadata } from 'api'
import { handleSimpleAPIResponse } from 'reducers/utils'
import { EmptyOTUQuery } from 'search'
import { ErrorList } from 'pages/search_page/reducers/types'

export const {
  changeTablePropertiesMags,
  searchMagsStarted,
  searchMagsEnded,
  magsFetchSamplesStarted,
  magsFetchSamplesEnded,
} = createActions(
  'CHANGE_TABLE_PROPERTIES_MAGS',
  'SEARCH_MAGS_STARTED',
  'SEARCH_MAGS_ENDED',
  'MAGS_FETCH_SAMPLES_STARTED',
  'MAGS_FETCH_SAMPLES_ENDED'
)

interface MagsPageState {
  // selected: string | null
  results: {
    cleared: boolean
    isLoading: boolean
    errors: string[]
    data: MagRecord[]
    page: number
    pages: number
    pageSize: number
    rowsCount: number
    filtered: any[]
    sorted: any[]
  }
  // samples: {
  //   isLoading: boolean
  //   data: any[]
  //   otus: string[]
  // }
}

interface MagRecord {
  id: number
  sample_id: number
  bin_id: string
  method: string
  tax: string
  tax_16s: string
  length: number
  gc_perc: number
  num_contigs: number
  disparity: number
  completeness: number
  contamination: number
  strain_het: number
  coverage: number
  tpm: number
  quality: number
}

// const initialState: MagsPageState = {
//   results: {
//     cleared: true,
//     isLoading: true,
//     errors: [],
//     data: [],
//     page: 0,
//     pages: 0,
//     pageSize: 10,
//     rowsCount: 0,
//     filtered: [],
//     sorted: [],
//   },
//   // samples: {
//   //   isLoading: false,
//   //   data: [],
//   //   otus: [],
//   // },
// }

const resultsInitialState = {
  cleared: false,
  isLoading: false,
  errors: [],
  data: [],
  page: 0,
  pageSize: 10,
  rowsCount: 0,
  filtered: [],
  sorted: [],
}

export const searchMags = () => (dispatch, getState) => {
  const state = getState()

  dispatch(searchMagsStarted())

  const options = state.magsPage.results

  executeMagsSearch(options)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(searchMagsEnded(new ErrorList(...data.data.errors)))
        return
      }
      dispatch(searchMagsEnded(data))
    })
    .catch((error) => {
      dispatch(searchMagsEnded(new ErrorList('Unhandled server-side error!')))
    })
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
    [changeTablePropertiesMags as any]: (state, action: any) => {
      const { page, pageSize, filtered, sorted } = action.payload
      return {
        ...state,
        page,
        pageSize,
        sorted,
        filtered,
      }

      // console.log('changeTablePropertiesMags', 'state', state)
      // console.log('changeTablePropertiesMags', 'action.payload', action.payload)

      // return {
      //   ...state,
      //   results: {
      //     ...state.results,
      //     ...(page !== undefined && { page }),
      //     ...(pageSize !== undefined && { pageSize }),
      //     ...(filtered !== undefined && { filtered }),
      //     ...(sorted !== undefined && { sorted }),
      //   },
      // }
    },
    [searchMagsStarted as any]: (state, action) => {
      return {
        ...state,
        errors: [],
        isLoading: true,
      }
    },
    [searchMagsEnded as any]: {
      next: (state, action: any) => {
        const rowsCount = action.payload.data.rowsCount
        const pages = Math.ceil(rowsCount / state.pageSize)
        const newPage = Math.min(pages - 1 < 0 ? 0 : pages - 1, state.page)
        return {
          ...state,
          isLoading: false,
          data: action.payload.data.data,
          rowsCount,
          pages,
          page: newPage,
        }
      },
      throw: (state, action: any) => ({
        ...state,
        isLoading: false,
        errors: action.payload.msgs,
      }),
    },
    [magsFetchSamplesStarted as any]: (state, action) => ({
      ...state,
      samples: {
        isLoading: true,
        data: [],
        otus: [],
      },
    }),
    [magsFetchSamplesEnded as any]: (state, action: any) => ({
      ...state,
      samples: {
        isLoading: false,
        data: map(action.payload.data.data, (sample) => ({
          bpadata: sample.bpa_data,
          abundance: sample.sample_otus_abundance,
          lat: sample.latitude,
          lng: sample.longitude,
        })),
        otus: action.payload.data.sample_otus,
      },
    }),
  },
  resultsInitialState
)
