import { map, get as _get, partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { executeMagsQuery, executeMagsSitesMetadata } from 'api'
import { handleSimpleAPIResponse } from 'reducers/utils'
import { EmptyOTUQuery } from 'search'
import { ErrorList } from 'pages/search_page/reducers/types'

export const {
  changeMagsTableProperties,
  magsFetchRecordsStarted,
  magsFetchRecordsEnded,
  magsFetchSamplesStarted,
  magsFetchSamplesEnded,
} = createActions(
  'CHANGE_MAGS_TABLE_PROPERTIES',
  'MAGS_FETCH_RECORDS_STARTED',
  'MAGS_FETCH_RECORDS_ENDED',
  'MAGS_FETCH_SAMPLES_STARTED',
  'MAGS_FETCH_SAMPLES_ENDED'
)

interface MagsPageState {
  selected: string | null
  results: {
    cleared: boolean
    isLoading: boolean
    errors: string[]
    data: MagRecord[]
    page: number
    pages: number
    pageSize: number
    rowsCount: number
    sorted: any[]
  }
  samples: {
    isLoading: boolean
    data: any[]
    otus: string[]
  }
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

// genome: string
// domain: string
// phylum: string
// class: string
// order: string
// family: string
// genus: string
// species: string
// motu4: string
// sample: string
// study: string
// q: string
// completeness: string
// contamination: string
// n50: string
// scaffolds: string
// mag: string
// isrep: string
// representative: string

// const example: MagRecord = {
//   genome: 'ACIN21-1_SAMN05421555_MAG_00000001',
//   domain: 'Bacteria',
//   phylum: 'Actinomycetota',
//   class: 'Actinomycetes',
//   order: 'Mycobacteriales',
//   family: 'Mycobacteriaceae',
//   genus: 'Mycobacterium',
//   species: 'Mycobacterium poriferae',
//   motu4: 'mOTUv4.0_002490',
//   sample: '7031', //'ACIN21-1_SAMN05421555_METAG',
//   study: 'ACIN21-1',
//   q: '69.00',
//   completeness: '83.10',
//   contamination: '2.82',
//   n50: '4,933',
//   scaffolds: '969',
//   mag: 'True',
//   isrep: 'False',
//   representative: 'RSGB23-1_GCF-009363295-V1_GENO_10000001',
// }

const initialState: MagsPageState = {
  selected: null,
  results: {
    cleared: true,
    isLoading: false,
    errors: [],
    data: [],
    page: 0,
    pages: 0,
    pageSize: 10,
    rowsCount: 0,
    sorted: [],
  },
  samples: {
    isLoading: false,
    data: [],
    otus: [],
  },
}

export const fetchMagsRecords = () => (dispatch, getState) => {
  const state = getState()

  dispatch(magsFetchRecordsStarted())

  const options = {
    ...state.magsPage.results,
  }

  executeMagsQuery(options)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(magsFetchRecordsEnded(new ErrorList(...data.data.errors)))
        return
      }
      dispatch(magsFetchRecordsEnded(data))
    })
    .catch((error) => {
      dispatch(magsFetchRecordsEnded(new ErrorList('Unhandled server-side error!')))
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
    [changeMagsTableProperties as any]: (state, action: any) => {
      const { page, pageSize, sorted } = action.payload
      return {
        ...state,
        results: {
          ...state.results,
          page,
          pageSize,
          sorted,
        },
      }
    },
    [magsFetchRecordsStarted as any]: (state, action) => ({
      ...state,
      results: {
        ...state.results,
        isLoading: true,
        cleared: false,
      },
    }),
    [magsFetchRecordsEnded as any]: (state, action: any) => {
      const rowsCount = action.payload.data.rowsCount
      const pages = Math.ceil(rowsCount / state.results.pageSize)
      const newPage = Math.min(pages - 1 < 0 ? 0 : pages - 1, state.results.page)

      return {
        ...state,
        results: {
          ...state.results,
          cleared: false,
          isLoading: false,
          data: action.payload.data.data,
          rowsCount,
          pages,
          page: newPage,
        },
      }
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
  initialState
)
