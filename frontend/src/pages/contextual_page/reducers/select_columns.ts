import { combineReducers } from 'redux'

import { createActions, handleActions } from 'redux-actions'

import { changeElementAtIndex, removeElementAtIndex } from 'reducers/utils'

export const {
  selectColumn,

  addColumn,
  removeColumn,
  clearColumns,
} = createActions(
  {
    SELECT_COLUMN: (index, value) => ({ index, value }),
  },
  'ADD_COLUMN',
  'REMOVE_COLUMN',
  'CLEAR_COLUMNS',
)

const EmptyColumn = {
  name: '',
  value: '',
}

export type Column = {
  name: string
  value: string
}

export type ColumnsState = Column[]

const columnsReducer = handleActions<ColumnsState>(
  {
    [addColumn as any]: (state) => [...state, EmptyColumn],

    [removeColumn as any]: (state, action: any) => removeElementAtIndex(state, action.payload),

    [clearColumns as any]: () => [],

    [selectColumn as any]: (state, action: any) =>
      changeElementAtIndex(state, action.payload.index, () => ({
        ...EmptyColumn,
        name: action.payload.value,
      })),
  },
  [],
)

export type SelectColumnsState = {
  columns: ColumnsState
}

export default combineReducers<SelectColumnsState>({
  columns: columnsReducer,
})
