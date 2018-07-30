import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchContextualDataDefinitions } from '../reducers/contextual_data_definitions';
import {
    selectContextualFiltersMode,
    addContextualFilter,
    removeContextualFilter,
    selectContextualFilter,
    changeContextualFilterOperator,
    changeContextualFilterValue,
    changeContextualFilterValue2,
    changeContextualFilterValues,
    clearContextualFilters,
    doesFilterMatchEnvironment,
} from '../reducers/contextual';
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Col,
    Input,
    Form,
    FormGroup,
    Label,
    Row,
} from 'reactstrap';

import Octicon from '../../../components/octicon';
import EnvironmentFilter from './environment_filter';
import ContextualFilter from '../../../components/contextual_filter';


const ContextualFilterInfo = 'Contextual filters allow data to be filtered on site specific chemical and physical data. More than one filter may be used and combined with "and/or" functions.';

class ContextualFilterCard extends React.Component<any> {
    componentDidMount() {
        this.props.fetchContextualDataDefinitions();
    }

    render() {
        return (
            <Card>
                <CardHeader><span title={ContextualFilterInfo}><Octicon name="info" /></span> Contextual Filters</CardHeader>
                <CardBody className="filters">
                    <EnvironmentFilter />

                    <hr />
                    <h5 className="text-center">Contextual Filters</h5>

                    { this.props.contextualFilters.length >= 2 && (
                        <Row>
                            <Col sm={12}>
                                <Form inline>
                                    Samples must match &nbsp;
                                    <Input
                                        type="select"
                                        bsSize="sm"
                                        value={this.props.contextualFiltersMode}
                                        onChange={evt => this.props.selectContextualFiltersMode(evt.target.value)}>
                                            <option value="and">all</option>
                                            <option value="or">any</option>
                                    </Input>
                                    &nbsp;
                                    of the following contextual filters.
                                </Form>
                            </Col>
                        </Row>
                    )}

                    <Row className="space-above">
                    </Row>

                    {this.props.contextualFilters.map((filter, index) =>
                        <ContextualFilter
                            key={`${filter.name}-${index}`}
                            index={index}
                            filter={filter}
                            dataDefinition={_.find(this.props.dataDefinitions, dd => dd.name === filter.name)}
                            options={this.props.contextualFilterOptions}
                            optionsLoading={this.props.optionsLoading}
                            remove={this.props.removeContextualFilter}
                            select={this.props.selectContextualFilter}
                            changeOperator={this.props.changeContextualFilterOperator}
                            changeValue={this.props.changeContextualFilterValue}
                            changeValue2={this.props.changeContextualFilterValue2}
                            changeValues={this.props.changeContextualFilterValues}
                            />)}

               </CardBody>
                <CardFooter className="text-center">
                    <Button color="success" onClick={this.props.addContextualFilter}>Add</Button>
                    <Button color="warning" onClick={this.props.clearContextualFilters}>Clear</Button>
                </CardFooter>
            </Card>
        );
    }
}

const getFilterOptions = (filters, selectedEnvironment) => _.filter(filters, doesFilterMatchEnvironment(selectedEnvironment));

function mapStateToProps(state) {
    return {
        contextualFilters: state.searchPage.filters.contextual.filters,
        contextualFiltersMode: state.searchPage.filters.contextual.filtersMode,
        dataDefinitions: state.searchPage.filters.contextual.dataDefinitions.filters,
        contextualFilterOptions: getFilterOptions(state.searchPage.filters.contextual.dataDefinitions.filters, state.searchPage.filters.contextual.selectedEnvironment),
        optionsLoading: state.searchPage.filters.contextual.dataDefinitions.isLoading,
    }
}

function mapDispatchToProps(dispatch: any) {
    return bindActionCreators({
        fetchContextualDataDefinitions,
        selectContextualFiltersMode,
        addContextualFilter,
        removeContextualFilter,
        selectContextualFilter,
        changeContextualFilterOperator,
        changeContextualFilterValue,
        changeContextualFilterValue2,
        changeContextualFilterValues,
        clearContextualFilters,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ContextualFilterCard);