import { find, map, reject } from 'lodash'
import { createActions, handleActions } from 'redux-actions'
import type { Reducer } from 'redux'
import type { AnyAction } from 'redux'

import { getContextualDataDefinitions } from 'api'
import { handleSimpleAPIResponse } from 'reducers/utils'

const { fetchContextualDataDefinitionsStarted, fetchContextualDataDefinitionsEnded } =
  createActions(
    'FETCH_CONTEXTUAL_DATA_DEFINITIONS_STARTED',
    'FETCH_CONTEXTUAL_DATA_DEFINITIONS_ENDED'
  )

export function fetchContextualDataDefinitions() {
  return (dispatch: any) => {
    dispatch(fetchContextualDataDefinitionsStarted())
    handleSimpleAPIResponse(
      dispatch,
      getContextualDataDefinitions,
      fetchContextualDataDefinitionsEnded
    )
  }
}

type Environment = {
  id: string
  name: string
}

export type ContextualDataDefinitionsState = {
  isLoading: boolean
  environment: Environment[]
  filters: any[]
  values: any[]
  sample_ids?: any[]
  definitions_url?: string
  scientific_manual_url?: string
}

const initialState: ContextualDataDefinitionsState = {
  isLoading: false,
  environment: [],
  filters: [],
  values: [],
}

const contextualDataDefinitionsReducer: Reducer<ContextualDataDefinitionsState, AnyAction> =
  handleActions<ContextualDataDefinitionsState, any>(
    {
      [fetchContextualDataDefinitionsStarted as any]: (state) => ({
        ...state,
        isLoading: true,
      }),

      [fetchContextualDataDefinitionsEnded as any]: (state, action: any) => {
        const definitions = action.payload.data.definitions

        const isSampleID = (definition) => definition.type === 'sample_id'
        const isEnvironment = (definition) => definition.name === 'am_environment_id'

        const environment = find(definitions, isEnvironment)
        const sample_id = find(definitions, isSampleID)
        const allButEnvironment = reject(definitions, isEnvironment)
        
        return {
          isLoading: false,
          environment: map(environment.values, ([id, name]) => ({ id, name })),
          filters: allButEnvironment,
          values: definitions,
          sample_ids: sample_id.values,
          definitions_url: action.payload.data.definitions_url,
          scientific_manual_url: action.payload.data.scientific_manual_url,
        }
      },
    },
    initialState
  )

export default contextualDataDefinitionsReducer
