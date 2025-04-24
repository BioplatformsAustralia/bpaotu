import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { filter as _filter } from 'lodash'
import { bindActionCreators } from 'redux'
import { fetchContextualDataDefinitions } from 'reducers/contextual_data_definitions'
import { fetchReferenceData } from 'reducers/reference_data/reference_data'

import { useAnalytics } from 'use-analytics'
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
import { nondenoisedDataRequest } from 'api'

import { useState } from 'react'

const NonDenoisedPage = (props) => {
  const [submitted, setSubmitted] = useState(false)
  const [selectedAmplicon, setSelectedAmplicon] = useState('')
  const [selectedSamples, setSelectedSamples] = useState([])
  const [matchSequence, setMatchSequence] = useState('')
  const [taxonomyString, setTaxonomyString] = useState('')

  const { page } = useAnalytics()

  // track page visit only on first render
  useEffect(() => {
    page()
  }, [page])

  const submit = () => {
    nondenoisedDataRequest(selectedAmplicon, selectedSamples, matchSequence, taxonomyString).then(
      (data) => {
        setSubmitted(true)
      }
    )
  }

  const validate = (state) => {
    return (
      selectedAmplicon !== '' &&
      selectedSamples &&
      selectedSamples.length > 0 &&
      !(matchSequence.length > 0 && taxonomyString.length > 0)
    )
  }

  const disabled = () => {
    return validate({
      selectedAmplicon,
      selectedSamples,
      matchSequence,
      taxonomyString,
    })
  }

  const sampleIDs = (props.sample_ids || []).map((sample_id, idx) => (
    <option value={sample_id} key={idx}>
      102.100.100/{sample_id}
    </option>
  ))

  const amplicons = (props.amplicons || []).map((amplicon, idx) => (
    <option value={amplicon.id} key={idx}>
      {amplicon.value}
    </option>
  ))

  const onSampleIDChange = (evt) => {
    const values = _filter(evt.target.options, (o) => o.selected).map((o: any) => o.value)
    setSelectedSamples(values)
  }

  const onAmpliconChange = (evt) => {
    const value = evt.target.options[evt.target.selectedIndex].value
    setSelectedAmplicon(value)
  }

  const onMatchSequenceChange = (evt) => {
    const value = evt.target.value
    setMatchSequence(value)
  }

  const onTaxonomyStringChange = (evt) => {
    const value = evt.target.value
    setTaxonomyString(value)
  }

  const validateMatchSequenceTaxonomy = () => {
    return !(matchSequence.length > 0 && taxonomyString.length > 0)
  }

  if (submitted === true) {
    return (
      <Container>
        <Row className="space-above">
          <Col>
            <h2>Non-denoised data request</h2>
            <p>
              Your request for non-denoised data has been submitted. You will hear back from us when
              the data is available for download. Should you need to get in touch, contact us at{' '}
              <a href="mailto:help@bioplatforms.com">help@bioplatforms.com</a>.
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
            value={selectedAmplicon}
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
            value={selectedSamples}
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
            value={matchSequence}
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
            value={taxonomyString}
            onChange={onTaxonomyStringChange}
            invalid={!validateMatchSequenceTaxonomy()}
          />
          <FormFeedback>
            Either add a sequence OR a taxonomy to search for, but not both!
          </FormFeedback>
        </FormGroup>
      </Form>
      <Button disabled={!disabled} onClick={submit} type="submit" color="primary">
        Submit request
      </Button>
    </Container>
  )
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
