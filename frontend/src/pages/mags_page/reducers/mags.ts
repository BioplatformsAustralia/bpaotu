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
    const requestId = Date.now() + Math.random()

    // console.log('[searchMags] starting', {
    //   requestId,
    //   magId,
    //   filtered: state.magsPage.results.filtered,
    //   page: state.magsPage.results.page,
    // })

    dispatch(searchMagsStarted({ requestId }))

    const options = state.magsPage.results

    executeMagsSearch(options, magId)
      .then((data) => {
        const latestRequestId = getState().magsPage.results.searchRequestId
        // console.log('[searchMags] resolved', {
        //   requestId,
        //   latestRequestId,
        //   matches: latestRequestId === requestId,
        //   dataRows: _get(data, 'data.data.length', 0),
        //   filtered: getState().magsPage.results.filtered,
        // })

        if (latestRequestId !== requestId) {
          return
        }

        if (_get(data, 'data.errors', []).length > 0) {
          dispatch(searchMagsEnded({ requestId, payload: new ErrorList(...data.data.errors) }))
          return
        }
        dispatch(searchMagsEnded({ requestId, payload: data }))
      })
      .catch((error) => {
        const latestRequestId = getState().magsPage.results.searchRequestId
        // console.log('[searchMags] rejected', {
        //   requestId,
        //   latestRequestId,
        //   matches: latestRequestId === requestId,
        //   error,
        // })
        if (latestRequestId !== requestId) {
          return
        }
        dispatch(
          searchMagsEnded({ requestId, payload: new ErrorList('Unhandled server-side error!') }),
        )
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
        searchRequestId: action.payload?.requestId ?? state.searchRequestId,
      }
    },
    [searchMagsEnded as any]: {
      next: (state, action: any) => {
        const payload = action.payload?.payload ?? action.payload
        if (
          action.payload?.requestId != null &&
          state.searchRequestId !== action.payload.requestId
        ) {
          return state
        }
        const rowsCount = payload.data.rowsCount
        const pages = Math.ceil(rowsCount / state.pageSize)
        const newPage = Math.min(pages - 1 < 0 ? 0 : pages - 1, state.page)
        return {
          ...state,
          isLoading: false,
          hasLoaded: true,
          data: payload.data.data,
          rowsCount,
          pages,
          page: newPage,
          searchRequestId: null,
        }
      },
      throw: (state, action: any) => {
        const payload = action.payload?.payload ?? action.payload
        if (
          action.payload?.requestId != null &&
          state.searchRequestId !== action.payload.requestId
        ) {
          return state
        }
        return {
          ...state,
          isLoading: false,
          hasLoaded: true,
          errors: payload.msgs,
          searchRequestId: null,
        }
      },
    },
  },
  magsPageInitialState.results,
)

export default magsReducer
