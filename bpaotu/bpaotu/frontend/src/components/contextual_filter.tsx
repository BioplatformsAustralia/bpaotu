import * as _ from 'lodash';
import * as React from 'react';
import {
    Button,
    Col,
    Input,
    Row,
} from 'reactstrap';

import Octicon from '../components/octicon';

const TypeToOperatorAndValue = {
    'string': StringOperatorAndValue,
    'float': BetweenOperatorAndValue,
    'date': BetweenOperatorAndValue,
    'ontology': DropDownOperatorAndValue,
    'sample_id': DropDownOperatorAndValue,
}

export class ContextualDropDown extends React.Component<any> {
    dropDownSize = 11;

    render() {
        return (
            <Row>
                <Col sm={1} className="no-padding-right">
                    <Button
                        outline
                        color="warning"
                        size="sm"
                        className="form-control"
                        onClick={() => this.props.remove(this.props.index)}>
                        <Octicon name="dash" size="small" />
                    </Button>
                </Col>
                <Col sm={this.dropDownSize} className="no-padding-right">
                    <Input
                        type="select"
                        value={this.props.filter.name}
                        onChange={evt => this.props.select(this.props.index, evt.target.value)}>
                        {this.renderOptions()}
                    </Input>
                </Col>
                {this.renderOperatorAndValue()}
            </Row>
        )
    }

    renderOptions() {
        if (this.props.optionsLoading) {
            return (<option key="loading" value="">Loading...</option>);
        }
        return (
            _.concat(
                [<option key="" value="">---</option>],
                _.map(this.props.options, this.renderOption)));
    }

    renderOption(option) {
        let displayName = option.display_name;
        if (option.units)
            displayName += ` [${option.units}]`;

        return <option key={option.name} value={option.name}>{displayName}</option>;
    }

    renderOperatorAndValue() {
    }
}

export default class ContextualFilter extends ContextualDropDown {
    dropDownSize = 3;

    renderOperatorAndValue() {
        const type = _.get(this.props, 'dataDefinition.type');
        const TypeBasedOperatorAndValue = TypeToOperatorAndValue[type];

        return (<Col sm={8}>
            {TypeBasedOperatorAndValue ?
                <TypeBasedOperatorAndValue
                    filter={this.props.filter}
                    dataDefinition={this.props.dataDefinition}
                    changeOperator={(op) => this.props.changeOperator(this.props.index, op)}
                    changeValue={(value) => this.props.changeValue(this.props.index, value)}
                    changeValue2={(value) => this.props.changeValue2(this.props.index, value)}
                    changeValues={(value) => this.props.changeValues(this.props.index, value)} />
                : ''}
        </Col>);
    }
}

function StringOperatorAndValue({ filter, dataDefinition, changeOperator, changeValue }) {
    return (
        <Row>
            <Col sm={4} className="no-padding-right">
                <Input
                    type="select"
                    value={filter.operator}
                    onChange={evt => changeOperator(evt.target.value)}>
                        <option value="">contains</option>
                        <option value="complement">doesn't contain</option>
                </Input>
            </Col>
            <Col sm={8} className="no-padding-right">
                <Input value={filter.value} onChange={evt => changeValue(evt.target.value)} />
            </Col>
        </Row>
    )
}

function BetweenOperatorAndValue ({ filter, dataDefinition, changeOperator, changeValue, changeValue2 }) {
    const valueType = dataDefinition.type === 'date' ? 'date' : 'number';
    const sizes = {
        'date': { op: 2, values: 5},
        'number': { op: 4, values: 4},
    }
    return (
        <Row>
            <Col sm={sizes[valueType].op} className="no-padding-right">
                <Input
                    type="select"
                    value={filter.operator}
                    onChange={evt => changeOperator(evt.target.value)}>
                        <option value="">between</option>
                        <option value="complement">not between</option>
                </Input>
            </Col>
            <Col sm={sizes[valueType].values} className="no-padding-right">
                <Input type={valueType} value={filter.value} onChange={evt => changeValue(evt.target.value)} />
            </Col>
            <Col sm={sizes[valueType].values} className="no-padding-right">
                <Input type={valueType} value={filter.value2} onChange={evt => changeValue2(evt.target.value)} />
            </Col>
        </Row>
    )
}

function DropDownOperatorAndValue({ filter, dataDefinition, changeOperator, changeValue, changeValues }) {
    const renderOptions = dataDefinition.values.map((value) => {
        let [id, text] = value;
        if (!id) {
            id = text = value;
        }
        return (<option key={id} value={id}>{text}</option>);
    });

    const isMultiSelect = dataDefinition.type === 'sample_id';

    const onChange = (evt) => {
        if (isMultiSelect) {
            const values = _.filter(evt.target.options, o => o.selected).map((o: any) => o.value);
            changeValues(values);
        } else {
            changeValue(evt.target.value);
        }
    }

    return (
        <Row>
            <Col sm={4} className="no-padding-right">
                <Input
                    type="select"
                    value={filter.operator}
                    onChange={evt => changeOperator(evt.target.value)}>
                        <option value="">is</option>
                        <option value="complement">isn't</option>
                </Input>
            </Col>
            <Col sm={8} className="no-padding-right">
                <Input
                    type="select"
                    multiple={isMultiSelect}
                    value={isMultiSelect ? filter.values : filter.value}
                    onChange={onChange.bind(this)}>
                        {renderOptions}
                </Input>
            </Col>
        </Row>
    )

}
