import * as _ from 'lodash';
import * as React from 'react';
import {
    Col,
    FormGroup,
    Input,
    Label
} from 'reactstrap';
import { OperatorAndValue } from '../reducers/search_page/index';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { selectEnvironmentOperator, selectEnvironment } from '../actions';
import Octicon from '../components/octicon';

const EnvironmentInfo = 'Data may be filtered on environment to restrict samples to either soil or marine environment sources.  Marine environment includes pelagic, coastal, sediment and host associated samples.  Within marine environment, samples may be further filtered by adding another filter and selecting the "Sample Type" filter.';

class EnvironmentFilter extends React.Component<any> {
    render() {
        return (
            <FormGroup row>
                <Label sm={3}>
                    Environment <span title={EnvironmentInfo}><Octicon name="info" /></span>
                </Label>
                <Col sm={3}>
                    <Input
                        type="select"
                        name="operator"
                        value={this.props.selected.operator}
                        onChange={evt => this.props.selectEnvironmentOperator(evt.target.value)} >
                            <option value="is">is</option>
                            <option value="isnot">isn't</option>
                    </Input>
                </Col>
                <Col sm={6}>
                    <Input
                        type="select"
                        name="value"
                        value={this.props.selected.value}
                        onChange={evt => this.props.selectEnvironment(evt.target.value)}>
                            {this.renderOptions()}
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
        return <option key={option.id} value={option.id}>{option.name}</option>;
    }
}

function mapStateToProps(state) {
    return {
        selected: state.searchPage.filters.contextual.selectedEnvironment,
        optionsLoading: state.searchPage.filters.contextual.dataDefinitions.isLoading,
        options: state.searchPage.filters.contextual.dataDefinitions.environment,
    }
}

function mapDispatchToProps(dispatch: any) {
    return bindActionCreators({
        selectEnvironment,
        selectEnvironmentOperator,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EnvironmentFilter);