import * as _ from 'lodash';
import * as React from 'react';
import {
    Col,
    FormGroup,
    Input,
    Label
} from 'reactstrap';
import { OperatorAndValue } from '../reducers/search_page';

interface Props {
    label: string,
    selected: OperatorAndValue,
    optionsLoading: boolean,
    options: OperatorAndValue[],
    selectValue: (id: string) => void,
    selectOperator: (id: string) => void,
    onChange: (id: string) => void
} 

export default class DropDownFilter extends React.Component<any> {
    render() {
        return (
            <FormGroup row>
                <Label sm={3}>{this.props.label}</Label>
                <Col sm={3}>
                    <Input type="select"
                        name="operator"
                        disabled={this.props.isDisabled}
                        value={this.props.selected.operator}
                        onChange={this.onOperatorChange.bind(this)}>
                            <option value="is">is</option>
                            <option value="isnot">isn't</option>
                    </Input>
                </Col>
                <Col sm={6}>
                    <Input type="select"
                        name="value"
                        disabled={this.props.isDisabled}
                        value={this.props.selected.value}
                        onChange={this.onValueChange.bind(this)}>
                            { this.renderOptions() }
                    </Input>
                </Col>
            </FormGroup>
        );
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
        return <option key={option.id} value={option.id}>{option.value}</option>;
    }

    onValueChange(evt) {
        const id = evt.target.value;
        this.props.selectValue(id);
        if (this.props.onChange)
            this.props.onChange();
    }

    onOperatorChange(evt: any) { 
        const value = evt.target.value;
        this.props.selectOperator(value);
        if (this.props.onChange)
            this.props.onChange();
    }

}