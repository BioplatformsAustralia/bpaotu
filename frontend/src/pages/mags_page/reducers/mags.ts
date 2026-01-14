import { map, get as _get, partial } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { executeMagsSearch, executeMagsSitesMetadata } from 'api'
import { handleSimpleAPIResponse } from 'reducers/utils'
import { EmptyOTUQuery } from 'search'
import { ErrorList } from 'pages/search_page/reducers/types'

export const { changeTablePropertiesMags, searchMagsStarted, searchMagsEnded } = createActions(
  'CHANGE_TABLE_PROPERTIES_MAGS',
  'SEARCH_MAGS_STARTED',
  'SEARCH_MAGS_ENDED'
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
  hasLoaded: false,
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
          hasLoaded: true,
          data: action.payload.data.data,
          rowsCount,
          pages,
          page: newPage,
        }
      },
      throw: (state, action: any) => ({
        ...state,
        isLoading: false,
        hasLoaded: true,
        errors: action.payload.msgs,
      }),
    },
  },
  resultsInitialState
)
