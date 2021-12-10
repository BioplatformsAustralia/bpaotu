import { createActions, handleActions } from 'redux-actions'

export const EmptyValue = { value: ''}
export const { selectTaxonomySource } = createActions('SELECT_TAXONOMY_SOURCE')

export default handleActions(
  {
    [selectTaxonomySource as any]: (state, action: any) => ({
      ...state,
      value: action.payload
    })
  },
  EmptyValue
)
