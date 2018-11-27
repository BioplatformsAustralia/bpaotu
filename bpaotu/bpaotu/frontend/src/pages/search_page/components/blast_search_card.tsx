import { last } from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { Alert, Button, Card, CardBody, CardFooter, CardHeader, Input } from 'reactstrap'

import Octicon from '../../../components/octicon'
import { clearBlastAlert, handleBlastSequence, runBlast } from '../reducers/blast_search'

export class BlastSearchCard extends React.Component<any> {
  public render() {
    const wrapText = text => ({ __html: text })
    return (
      <Card>
        <CardHeader tag="h5">BLAST Search</CardHeader>
        <CardBody className="blast">
          <Input
            type="textarea"
            name="sequence"
            id="sequence"
            placeholder="Select Amplicon and enter sequence here to run BLAST"
            value={this.props.sequenceValue}
            disabled={!this.props.isAmpliconSelected}
            onChange={evt => this.props.handleBlastSequence(evt.target.value)}
          />
          <div>
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
        </CardBody>
        <CardFooter className="text-center">
          aaa
          {this.props.isSubmitting}
          <Button color="warning" disabled={!this.props.sequenceValue} onClick={this.props.runBlast}>
            Run BLAST
          </Button>
        </CardFooter>
      </Card>
    )
  }
}
// public isGalaxySubmissionDisabled() {
//   if (this.props.galaxy.isSubmitting) {
//     return true
//   }
//   const lastSubmission: GalaxySubmission = last(this.props.galaxy.submissions)
//   return lastSubmission && !lastSubmission.finished
// }
function mapStateToProps(state, props) {
  return {
    isAmpliconSelected: state.searchPage.filters.selectedAmplicon.value,
    sequenceValue: state.searchPage.blastSearch.sequenceValue,
    isSubmitting: state.searchPage.blastSearch.isSubmitting,
    //isSequenceProvided: state.searchPage.blastSearch.sequenceValue.length > 0 ? true : false,
    alerts: state.searchPage.blastSearch.alerts
    //lastSubmission: last(state.searchPage.blastSerach.submissions)
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      handleBlastSequence,
      runBlast
    },
    dispatch
  )
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BlastSearchCard)
