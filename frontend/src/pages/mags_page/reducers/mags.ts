import { get as _get } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import { executeMagsSearch } from 'api'
import { ErrorList } from 'pages/search_page/reducers/types'
import { type MagsPageState, magsPageInitialState } from './types'
import { AnyAction, Reducer } from 'redux'

type MagsResultsState = MagsPageState['results']

export const { changeTablePropertiesMags, searchMagsStarted, searchMagsEnded } = createActions(
  'CHANGE_TABLE_PROPERTIES_MAGS',
  'SEARCH_MAGS_STARTED',
  'SEARCH_MAGS_ENDED',
)

export const searchMags =
  (magId = null) =>
  (dispatch, getState) => {
    const state = getState()

    dispatch(searchMagsStarted())

    const options = state.magsPage.results

    executeMagsSearch(options, magId)
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

const magsReducer: Reducer<MagsResultsState, AnyAction> = handleActions<MagsResultsState, any>(
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
  magsPageInitialState.results,
)

export default magsReducer
