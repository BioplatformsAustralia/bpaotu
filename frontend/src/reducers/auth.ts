import axios from 'axios'

import { createActions, handleActions } from 'redux-actions'
import type { ThunkAction } from 'redux-thunk'
import type { Reducer } from 'redux'
import type { AnyAction } from 'redux'

import { oauthCheckAuth } from 'api'

import { handleSimpleAPIResponse } from 'reducers/utils'
import { RootState } from 'app/store'

const { oauthCheckAuthStarted, oauthCheckAuthEnded } = createActions(
  'OAUTH_CHECK_AUTH_STARTED',
  'OAUTH_CHECK_AUTH_ENDED',
)

export { oauthCheckAuthStarted, oauthCheckAuthEnded }

export const doOauthCheckAuth =
  (): ThunkAction<void, RootState, unknown, AnyAction> => (dispatch) => {
    dispatch(oauthCheckAuthStarted())
    handleSimpleAPIResponse(dispatch, oauthCheckAuth, oauthCheckAuthEnded)
  }

export type AuthenticationState = {
  isAuthenticated: boolean
  isLoginInProgress: boolean
  email: string | null
  organisations: string[] | null
}

const initialState: AuthenticationState = {
  isAuthenticated: false,
  isLoginInProgress: true,
  email: null,
  organisations: null, // even if authenticated, need to check if user has access to this data product
}

const authReducer: Reducer<AuthenticationState, AnyAction> = handleActions<
  AuthenticationState,
  any
>(
  {
    [oauthCheckAuthStarted as any]: (state, action) => {
      return {
        ...state,
        isLoginInProgress: true,
      }
    },
    [oauthCheckAuthEnded as any]: {
      next: (state: any, action: any) => {
        const authData = action.payload.data

        // Check if user is authenticated via OAuth
        if (!authData.authenticated) {
          return {
            ...initialState,
            isLoginInProgress: false,
          }
        }

        // Set default headers for authenticated requests
        axios.defaults.headers.common['X-BPAOTU-Auth'] = 'oauth'

        return {
          isAuthenticated: true,
          isLoginInProgress: false,
          email: authData.email,
          organisations: authData.organisations || [],
        }
      },
      throw: () => {
        return {
          ...initialState,
          isLoginInProgress: false,
        }
      },
    },
  },
  initialState,
)

export default authReducer
