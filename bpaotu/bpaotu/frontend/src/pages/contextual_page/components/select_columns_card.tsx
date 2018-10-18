import { find, partial } from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { Button, Card, CardBody, CardFooter, CardHeader } from 'reactstrap'

import { ContextualDropDown } from '../../../components/contextual_drop_down'

import { fetchColumnsDataDefinitions } from '../reducers/columns_data_definitions'
import { search } from '../reducers/search'
import { addColumn, clearColumns, removeColumn, selectColumn } from '../reducers/select_columns'

class SelectColumnsCard extends React.Component<any> {
  constructor(props) {
    super(props)
    this.doThenSearch.bind(this)
  }

  public componentDidMount() {
    this.props.fetchColumnsDataDefinitions()
  }

  public doThenSearch(action, ...args) {
    action(...args)
    this.props.search()
  }

  public render() {
    return (
      <Card>
        <CardHeader>Select Columns</CardHeader>
        <CardBody className="filters">
          {this.props.columns.map((column, index) => (
            <ContextualDropDown
              key={`${column.name}-${index}`}
              index={index}
              filter={column}
              dataDefinition={find(this.props.dataDefinitions, dd => dd.name === column.name)}
              options={this.props.dataDefinitions}
              optionsLoading={this.props.optionsLoading}
              remove={partial(this.doThenSearch, this.props.removeColumn)}
              select={partial(this.doThenSearch, this.props.selectColumn)}
            />
          ))}
        </CardBody>
        <CardFooter className="text-center">
          <Button color="success" onClick={partial(this.doThenSearch, this.props.addColumn)}>
            Add
          </Button>
          <Button color="warning" onClick={partial(this.doThenSearch, this.props.clearColumns)}>
            Clear
          </Button>
        </CardFooter>
      </Card>
    )
  }
}

function mapStateToProps(state) {
  return {
    columns: state.contextualPage.selectColumns.columns,
    dataDefinitions: state.contextualPage.selectColumns.dataDefinitions.values,
    optionsLoading: state.contextualPage.selectColumns.dataDefinitions.isLoading
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      fetchColumnsDataDefinitions,
      addColumn,
      removeColumn,
      selectColumn,
      clearColumns,
      search
    },
    dispatch
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectColumnsCard)
