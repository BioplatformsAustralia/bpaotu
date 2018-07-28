import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
} from 'reactstrap';

import { ContextualDropDown } from '../../../components/contextual_filter';

import { fetchColumnsDataDefinitions } from '../reducers/columns_data_definitions';
import { clearColumns, addColumn, selectColumn, removeColumn } from '../reducers/select_columns';
import { search } from '../reducers/search';

class SelectColumnsCard extends React.Component<any> {
    componentDidMount() {
        this.props.fetchColumnsDataDefinitions();
    }

    doThenSearch(action, ...args) {
        action(...args);
        this.props.search();
    }

    render() {
        return (
            <Card>
                <CardHeader>Select Columns</CardHeader>
                <CardBody className="filters">
                    {this.props.columns.map((column, index) =>
                        <ContextualDropDown
                            key={`${column.name}-${index}`}
                            index={index}
                            filter={column}
                            dataDefinition={_.find(this.props.dataDefinitions, dd => dd.name === column.name)}
                            options={this.props.dataDefinitions}
                            optionsLoading={this.props.optionsLoading}
                            remove={_.partial(this.doThenSearch, this.props.removeColumn).bind(this)}
                            select={_.partial(this.doThenSearch, this.props.selectColumn).bind(this)}
                            />)}

               </CardBody>
                <CardFooter className="text-center">
                    <Button color="success" onClick={_.partial(this.doThenSearch, this.props.addColumn).bind(this)}>Add</Button>
                    <Button color="warning" onClick={_.partial(this.doThenSearch, this.props.clearColumns).bind(this)}>Clear</Button>
                </CardFooter>
            </Card>
        );
    }
}

function mapStateToProps(state) {
    return {
        columns: state.contextualPage.selectColumns.columns,
        dataDefinitions: state.contextualPage.selectColumns.dataDefinitions.values,
        optionsLoading: state.contextualPage.selectColumns.dataDefinitions.isLoading,
    }
}

function mapDispatchToProps(dispatch: any) {
    return bindActionCreators({
        fetchColumnsDataDefinitions,
        addColumn,
        removeColumn,
        selectColumn,
        clearColumns,
        search,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectColumnsCard);
