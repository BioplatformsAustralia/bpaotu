import React, { useEffect } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { find } from 'lodash'

import { Button, Card, CardBody, CardFooter, CardHeader } from 'reactstrap'

import { ContextualDropDown } from 'components/contextual_drop_down'

import { fetchContextualDataDefinitions } from 'reducers/contextual_data_definitions'

import { search } from '../reducers/search'
import { addColumn, clearColumns, removeColumn, selectColumn } from '../reducers/select_columns'

const SelectColumnsCard = (props) => {
  const {
    columns,
    dataDefinitions,
    optionsLoading,
    fetchContextualDataDefinitions,
    addColumn,
    removeColumn,
    selectColumn,
    clearColumns,
    search,
  } = props

  useEffect(() => {
    fetchContextualDataDefinitions()
  }, [fetchContextualDataDefinitions])

  const onRemoveColumn = (...args: any[]) => {
    removeColumn(...args)
    search()
  }

  const onSelectColumn = (...args: any[]) => {
    selectColumn(...args)
    search()
  }

  const onClearColumns = () => {
    clearColumns()
    search()
  }

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
        <Button color="success" onClick={addColumn}>
          Add
        </Button>
        <Button color="warning" onClick={onClearColumns}>
          Clear
        </Button>
      </CardFooter>
    </Card>
  )
}

const mapStateToProps = (state) => {
  return {
    columns: state.contextualPage.selectColumns.columns,
    dataDefinitions: state.contextualDataDefinitions.values,
    optionsLoading: state.contextualDataDefinitions.isLoading,
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators(
    {
      fetchContextualDataDefinitions,
      addColumn,
      removeColumn,
      selectColumn,
      clearColumns,
      search,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectColumnsCard)
