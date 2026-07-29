import React, { useEffect, useCallback } from 'react'
import { Button, Card, CardBody, CardFooter, CardHeader } from 'reactstrap'
import { find } from 'lodash'

import { useAppSelector, useAppDispatch } from 'hooks/redux'

import { fetchContextualDataDefinitions } from 'reducers/contextual_data_definitions'
import { search } from '../reducers/search'
import { addColumn, clearColumns, removeColumn, selectColumn } from '../reducers/select_columns'

import { ContextualDropDown } from 'components/contextual_drop_down'

const SelectColumnsCard = () => {
  const dispatch = useAppDispatch()

  const { columns, dataDefinitions, optionsLoading } = useAppSelector((state) => ({
    columns: state.contextualPage.selectColumns.columns,
    dataDefinitions: state.contextualDataDefinitions.values,
    optionsLoading: state.contextualDataDefinitions.isLoading,
  }))
  
  // Fetch data definitions on mount
  useEffect(() => {
    dispatch(fetchContextualDataDefinitions())
  }, [dispatch])

  const onRemoveColumn = useCallback(
    (...args: any[]) => {
      dispatch(removeColumn(...args))
      dispatch(search())
    },
    [dispatch]
  )

  const onSelectColumn = useCallback(
    (...args: any[]) => {
      dispatch(selectColumn(...args))
      dispatch(search())
    },
    [dispatch]
  )

  const onClearColumns = useCallback(() => {
    dispatch(clearColumns())
    dispatch(search())
  }, [dispatch])

  const onAddColumn = useCallback(() => {
    dispatch(addColumn())
  }, [dispatch])

  return (
    <Card>
      <CardHeader>Select Columns</CardHeader>
      <CardBody className="filters">
        {columns.map((column, index) => (
          <ContextualDropDown
            key={`${column.name}-${index}`}
            index={index}
            filter={column}
            dataDefinition={find(dataDefinitions, (dd) => dd.name === column.name)}
            options={dataDefinitions}
            optionsLoading={optionsLoading}
            remove={onRemoveColumn}
            select={onSelectColumn}
          />
        ))}
      </CardBody>
      <CardFooter className="text-center">
        <Button color="success" onClick={onAddColumn}>
          Add
        </Button>
        <Button color="warning" onClick={onClearColumns}>
          Clear
        </Button>
      </CardFooter>
    </Card>
  )
}

export default SelectColumnsCard
