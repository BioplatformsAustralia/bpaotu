import * as _ from 'lodash';
import * as React from 'react';
import {
    Col,
    FormGroup,
    Input,
    Label
} from 'reactstrap';
import { OperatorAndValue } from '../reducers/search_page';

export default class EnvironmentFilter extends React.Component<any> {
    render() {
        return (
            <FormGroup row>
                <Label sm={3}>Environment</Label>
                <Col sm={3}>
                    <Input type="select" name="operator">
                        <option value="is">is</option>
                        <option value="isnot">isn't</option>
                    </Input>
                </Col>
                <Col sm={6}>
                    <Input type="select" name="value">
                        {/* TODO 
                        This should be filled from the contextual data definitions where name === 'environment_id'
                        */}
                        <option value="">---</option>
                        <option value="2">Marine</option>
                        <option value="1">Soil</option>
                    </Input>
                </Col>
            </FormGroup>
        );
    }
}