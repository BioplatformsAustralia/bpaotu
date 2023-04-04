import * as React from 'react'
import { connect } from 'react-redux'
import { filter as _filter } from 'lodash'
import { bindActionCreators } from 'redux'
import { fetchContextualDataDefinitions } from '../reducers/contextual_data_definitions'
import { fetchReferenceData } from '../reducers/reference_data/reference_data'

import analytics from 'app/analytics'
import {
  Form,
  FormGroup,
  FormFeedback,
  Col,
  Container,
  Row,
  Input,
  Label,
  Button,
} from 'reactstrap'
import { nondenoisedDataRequest } from '../api'

class NonDenoisedPage extends React.Component<any> {
  state = {
    submitted: false,
    selectedAmplicon: '',
    selectedSamples: [],
    matchSequence: '',
    taxonomyString: '',
  }

  constructor(props: any) {
    super(props)
    this.submit = this.submit.bind(this)
  }

  public componentDidMount() {
    this.props.fetchContextualDataDefinitions()
    this.props.fetchReferenceData()
  }

  submit() {
    analytics.track('otu_nondenoised_data_request')

    nondenoisedDataRequest(
      this.state.selectedAmplicon,
      this.state.selectedSamples,
      this.state.matchSequence,
      this.state.taxonomyString
    ).then((data) => {
      this.setState({ submitted: true })
    })
  }

  validate(state) {
    return (
      state['selectedAmplicon'] !== '' &&
      state['selectedSamples'] &&
      state['selectedSamples'].length > 0 &&
      !(state['matchSequence'].length > 0 && state['taxonomyString'].length > 0)
    )
  }

  disabled() {
    return this.validate(this.state)
  }

  public render() {
    analytics.page()

    const sampleIDs = (this.props.sample_ids || []).map((sample_id, idx) => (
      <option value={sample_id} key={idx}>
        102.100.100/{sample_id}
      </option>
    ))
    const amplicons = (this.props.amplicons || []).map((amplicon, idx) => (
      <option value={amplicon.id} key={idx}>
        {amplicon.value}
      </option>
    ))
    const onSampleIDChange = (evt) => {
      const values = _filter(evt.target.options, (o) => o.selected).map((o: any) => o.value)
      this.setState({ selectedSamples: values })
    }
    const onAmpliconChange = (evt) => {
      const value = evt.target.options[evt.target.selectedIndex].value
      this.setState({ selectedAmplicon: value })
    }
    const onMatchSequenceChange = (evt) => {
      const value = evt.target.value
      this.setState({ matchSequence: value })
    }
    const onTaxonomyStringChange = (evt) => {
      const value = evt.target.value
      this.setState({ taxonomyString: value })
    }
    const validateMatchSequenceTaxonomy = () => {
      return !(this.state['matchSequence'].length > 0 && this.state['taxonomyString'].length > 0)
    }

    if (this.state['submitted'] === true) {
      return (
        <Container>
          <Row className="space-above">
            <Col>
              <h2>Non-denoised data request</h2>
              <p>
                Your request for non-denoised data has been submitted. You will hear back from us
                when the data is available for download. Should you need to get in touch, contact us
                at <a href="mailto:help@bioplatforms.com">help@bioplatforms.com</a>.
              </p>
            </Col>
          </Row>
        </Container>
      )
    }

    return (
      <Container>
        <Row className="space-above">
          <Col>
            <h2>Non-denoised data request</h2>
          </Col>
        </Row>

        <Form>
          <FormGroup>
            <Label for="sample_ids">Amplicon</Label>
            <Input
              name="sample_ids"
              id="amplicon"
              type="select"
              value={this.state['selectedAmplicon']}
              onChange={onAmpliconChange}
            >
              <option value="">--</option>
              {amplicons}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for="sample_ids">Sample IDs for export</Label>
            <Input
              name="sample_ids"
              id="sample_ids"
              type="select"
              multiple={true}
              value={this.state['selectedSamples']}
              onChange={onSampleIDChange}
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
              onChange={onMatchSequenceChange}
              invalid={!validateMatchSequenceTaxonomy()}
            />
            <FormFeedback>
              Either add a sequence OR a taxonomy to search for, but not both!
            </FormFeedback>
          </FormGroup>
          <FormGroup>
            <Label for="taxonomyString">
              Match taxonomy (Use the following taxonomy: 16S and 18S: SILVA132, ITS: UNITE SH v8..
              Use only at level of interest [e.g. a family name]):
            </Label>
            <Input
              name="taxonomyString"
              type="textarea"
              value={this.state['taxonomyString']}
              onChange={onTaxonomyStringChange}
              invalid={!validateMatchSequenceTaxonomy()}
            />
            <FormFeedback>
              Either add a sequence OR a taxonomy to search for, but not both!
            </FormFeedback>
          </FormGroup>
        </Form>
        <Button disabled={!this.disabled()} onClick={this.submit} type="submit" color="primary">
          Submit request
        </Button>
      </Container>
    )
  }
}

function mapStateToProps(state) {
  // Note: metaxa is filtered out from this form. It would be nicer to have
  // some higher-level description of relevant form fields.
  return {
    sample_ids: state.contextualDataDefinitions.sample_ids,
    amplicons: state.referenceData.amplicons.values.filter(
      (amplicon) => amplicon.value !== window.otu_search_config.metaxa_amplicon
    ),
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchReferenceData,
      fetchContextualDataDefinitions,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(NonDenoisedPage)
