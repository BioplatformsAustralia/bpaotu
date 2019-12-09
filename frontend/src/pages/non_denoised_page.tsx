import * as React from 'react'
import { connect } from 'react-redux'
import { filter as _filter } from 'lodash'
import { bindActionCreators } from 'redux'
import { fetchContextualDataDefinitions } from '../reducers/contextual_data_definitions'

import { Form, FormGroup, Col, Container, Row, Input, Label, Button } from 'reactstrap'
import { nondenoisedDataRequest } from '../api'

class NonDenoisedPage extends React.Component<any> {
    state = {
        submitted: false,
        selectedSamples: [],
        matchSequence: "",
        taxonomyString: "",
    };

    constructor(props: any) {
        super(props);
        this.submit = this.submit.bind(this);
    }

    public componentDidMount() {
        this.props.fetchContextualDataDefinitions()
    }

    submit() {
        nondenoisedDataRequest(
            this.state.selectedSamples,
            this.state.matchSequence,
            this.state.taxonomyString)
            .then(data => {
                this.setState({ "submitted": true })
            });
    }

    validate(state) {
        return state['selectedSamples'] && state['selectedSamples'].length > 0;
    }

    disabled() {
        return this.validate(this.state);
    }

    public render() {
        const sampleIDs = (this.props.sample_ids || []).map(
            (sample_id, idx) => <option value={sample_id} key={idx}>102.100.100/{sample_id}</option>
        );

        const onChange = evt => {
            const values = _filter(evt.target.options, o => o.selected).map((o: any) => o.value)
            this.setState({ selectedSamples: values })
        };

        if (this.state['submitted'] === true) {
            return <Container>
                <Row className="space-above">
                    <Col>
                        <h2>Non-denoised data request</h2>
                        <p>
                            Your request for non-denoised data has been submitted. You will hear back from us when the data is available for download. Should you need to get in touch, contact us at <a href="mailto:help@bioplatforms.com">help@bioplatforms.com</a>.
                        </p>
                    </Col>
                </Row>
                </Container>
        }

        return <Container>
            <Row className="space-above">
                <Col>
                    <h2>Non-denoised data request</h2>
                </Col>
            </Row>

            <Form>
                <FormGroup>
                    <Label for="sample_ids">Sample IDs for export</Label>
                    <Input
                        name="sample_ids"
                        id="sample_ids"
                        type="select"
                        multiple={true}
                        value={this.state['selectedSamples']}
                        onChange={onChange}
                    >
                        {sampleIDs}
                    </Input>
                </FormGroup>
                <FormGroup>
                    <Label for="matchSequence">Match sequence (unwrapped FASTA format):</Label>
                    <Input
                        name="matchSequence"
                        type="textarea"
                        value={this.state['matchSequence']}
                        onChange={e => this.setState({ matchSequence: e.target.value })}
                    />
                </FormGroup>
                <FormGroup>
                    <Label for="taxonomyString">Match sequence (SILVA132 taxonomy, only at level of interest [e.g. a family name]):</Label>
                    <Input
                        name="taxonomyString"
                        type="textarea"
                        value={this.state['taxonomyString']}
                        onChange={e => this.setState({ taxonomyString: e.target.value })}
                    />
                </FormGroup>
            </Form>
            <Button disabled={!this.disabled()} onClick={this.submit} type="submit" color="primary">Submit request</Button>
        </Container>
    }
}

function mapStateToProps(state) {
    return {
        sample_ids: state.contextualDataDefinitions.sample_ids
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(
        {
            fetchContextualDataDefinitions,
        },
        dispatch
    )
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(NonDenoisedPage)