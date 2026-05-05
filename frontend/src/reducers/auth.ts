import axios from 'axios'
import { createActions, handleActions } from 'redux-actions'

import { oauthCheckAuth } from 'api'

import { handleSimpleAPIResponse } from 'reducers/utils'

const { oauthCheckAuthStarted, oauthCheckAuthEnded } = createActions(
  'OAUTH_CHECK_AUTH_STARTED',
  'OAUTH_CHECK_AUTH_ENDED'
)

export { oauthCheckAuthStarted, oauthCheckAuthEnded }

export const doOauthCheckAuth = () => (dispatch, getState) => {
  dispatch(oauthCheckAuthStarted())
  handleSimpleAPIResponse(dispatch, oauthCheckAuth, oauthCheckAuthEnded)
}

const initialState: any = {
  isLoginInProgress: false,
  isLoggedIn: false,
  email: null,
  organisations: [],
}

export default handleActions(
  {
    [oauthCheckAuthStarted as any]: (state: any, action: any) => {
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
          return initialState
        }

        const email = authData.email
        const organisations = authData.organisations || []

        // Set default headers for authenticated requests
        axios.defaults.headers = {
          'X-BPAOTU-Auth': 'oauth',
        }

        return {
          isLoginInProgress: false,
          isLoggedIn: true,
          email,
          organisations,
        }
      },
      throw: (state, action) => {
        return initialState
      },
    },
  },
  initialState
)
