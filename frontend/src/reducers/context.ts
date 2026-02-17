import { createActions, handleActions } from 'redux-actions'

export type PortalContext = 'am' | 'edna'

export const { setPortalContext } = createActions('SET_PORTAL_CONTEXT')

const initialContextState = {
  portalContext: 'am' as 'am' | 'edna',
}

const contextReducer = handleActions(
  {
    [setPortalContext as any]: (state, action: any) => ({
      ...state,
      portalContext: action.payload,
    }),
  },
  initialContextState
)

export default contextReducer
