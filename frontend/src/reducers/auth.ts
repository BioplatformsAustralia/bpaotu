import axios from 'axios'
import { createActions, handleActions } from 'redux-actions'

import { ckanAuthInfo } from 'api'

import { handleSimpleAPIResponse } from 'reducers/utils'

const { ckanAuthInfoStarted, ckanAuthInfoEnded } = createActions(
  'CKAN_AUTH_INFO_STARTED',
  'CKAN_AUTH_INFO_ENDED'
)

export { ckanAuthInfoStarted, ckanAuthInfoEnded }

export const getCKANAuthInfo = () => (dispatch, getState) => {
  dispatch(ckanAuthInfoStarted())
  handleSimpleAPIResponse(dispatch, ckanAuthInfo, ckanAuthInfoEnded)
}

const initialState: any = {
  isLoginInProgress: false,
  isLoggedIn: false,
  email: null,
  organisations: [],
}

export default handleActions(
  {
    [ckanAuthInfoStarted as any]: (state: any, action: any) => {
      return {
        ...state,
        isLoginInProgress: true,
      }
    },
    [ckanAuthInfoEnded as any]: {
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
