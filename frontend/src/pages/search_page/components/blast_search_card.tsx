import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  FormGroup,
  Col,
  Input,
  Label,
  UncontrolledTooltip,
} from 'reactstrap'
import Octicon from 'components/octicon'

import AnimateHelix from 'components/animate_helix'

import {
  clearBlastAlert,
  handleBlastSequence,
  handleBlastParameters,
  runBlast,
} from '../reducers/blast_search'
import { getAmpliconFilter } from '../reducers/amplicon'

export class BlastSearchCard extends React.Component<any> {
  public render() {
    const wrapText = (text) => ({ __html: text })
    const parentContainerStyle = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      width: '100%',
    } as React.CSSProperties
    const imageContainerStyle = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      maxHeight: '500px',
      // width: '50%', // don't restrict width as map can be wide for a large area
    } as React.CSSProperties
    const imageStyle = {
      maxWidth: '100%',
      maxHeight: '500px',
    } as React.CSSProperties

    return (
      <Card>
        <CardHeader tag="h5">Search Parameters</CardHeader>
        <CardBody className="blast">
          <FormGroup row={true}>
            <Label sm={3}>
              qcov_hsp_perc{' '}
              <span id="blastTipQcov">
                <Octicon name="info" />
              </span>
              <UncontrolledTooltip target="blastTipQcov" placement="auto">
                Percent query coverage per hsp
              </UncontrolledTooltip>
            </Label>
            <Col sm={1}>
              <Input
                type="select"
                name="qcov_hsp_perc"
                value={this.props.blastParams['qcov_hsp_perc']}
                onChange={(evt) =>
                  this.props.handleBlastParameters({
                    param: 'qcov_hsp_perc',
                    value: evt.target.value,
                  })
                }
              >
                <option value="50">50</option>
                <option value="60">60</option>
                <option value="90">90</option>
              </Input>
            </Col>
          </FormGroup>
          <FormGroup row={true}>
            <Label sm={3}>
              perc_ident{' '}
              <span id="blastTipPercIdent">
                <Octicon name="info" />
              </span>
              <UncontrolledTooltip target="blastTipPercIdent" placement="auto">
                Percent identity
              </UncontrolledTooltip>
            </Label>
            <Col sm={1}>
              <Input
                type="select"
                name="perc_identity"
                value={this.props.blastParams['perc_identity']}
                onChange={(evt) =>
                  this.props.handleBlastParameters({
                    param: 'perc_identity',
                    value: evt.target.value,
                  })
                }
              >
                <option value="90">90</option>
                <option value="91">91</option>
                <option value="92">92</option>
                <option value="93">93</option>
                <option value="94">94</option>
                <option value="95">95</option>
                <option value="96">96</option>
                <option value="97">97</option>
                <option value="98">98</option>
                <option value="99">99</option>
              </Input>
            </Col>
          </FormGroup>
          <Input
            type="textarea"
            name="sequence"
            id="sequence"
            placeholder="Enter sequence here to run BLAST search against the selected amplicon and taxonomy/contextual filters"
            value={this.props.sequenceValue}
            disabled={!this.props.isAmpliconSelected}
            onChange={(evt) => this.props.handleBlastSequence(evt.target.value)}
            style={{ height: '110px' }}
          />
          <div className="pt-2">
            {this.props.alerts.map((alert, idx) => (
              <Alert
                key={idx}
                color={alert.color}
                className="text-center"
                toggle={() => this.props.clearBlastAlert(idx)}
              >
                <div dangerouslySetInnerHTML={wrapText(alert.text)} />
              </Alert>
            ))}
          </div>
          <div className="pt-2">
            <div style={parentContainerStyle}>
              <div style={imageContainerStyle}>
                {this.props.imageSrc ? (
                  <img
                    src={this.props.imageSrc}
                    alt="Location of BLAST results"
                    style={imageStyle}
                  />
                ) : (
                  this.props.imageSrc === null && <p>No results to display</p>
                )}
              </div>
            </div>
          </div>
          <div className="text-center">
            {this.props.isSubmitting && <AnimateHelix scale={0.2} />}
          </div>
        </CardBody>
        <CardFooter className="text-center">
          <Button
            color="warning"
            disabled={this.props.isSearchDisabled}
            onClick={this.props.runBlast}
          >
            Run BLAST
          </Button>
        </CardFooter>
      </Card>
    )
  }
}

function mapStateToProps(state, props) {
  const selectedAmplicon = getAmpliconFilter(state)
  return {
    isAmpliconSelected: selectedAmplicon.value,
    sequenceValue: state.searchPage.blastSearch.sequenceValue,
    blastParams: state.searchPage.blastSearch.blastParams,
    isSubmitting: state.searchPage.blastSearch.isSubmitting,
    isSearchDisabled:
      selectedAmplicon.value === '' ||
      state.searchPage.blastSearch.sequenceValue === '' ||
      state.searchPage.blastSearch.isSubmitting,
    alerts: state.searchPage.blastSearch.alerts,
    imageSrc: state.searchPage.blastSearch.imageSrc,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      handleBlastSequence,
      handleBlastParameters,
      runBlast,
      clearBlastAlert,
    },
    dispatch
  )
}
export default connect(mapStateToProps, mapDispatchToProps)(BlastSearchCard)
