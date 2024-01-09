import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Alert, Button, Card, CardBody, CardFooter, CardHeader, Input } from 'reactstrap'

import AnimateHelix from 'components/animate_helix'

import { clearBlastAlert, handleBlastSequence, runBlast } from '../reducers/blast_search'
import { getAmpliconFilter } from '../reducers/amplicon'

const BlastSearchCard = (props) => {
  const wrapText = (text) => ({ __html: text })

  return (
    <Card>
      <CardHeader tag="h5">BLAST Search</CardHeader>
      <CardBody className="blast">
        <Input
          type="textarea"
          name="sequence"
          id="sequence"
          placeholder="Select Amplicon and enter sequence here to run BLAST"
          value={props.sequenceValue}
          disabled={!props.isAmpliconSelected}
          onChange={(evt) => props.handleBlastSequence(evt.target.value)}
        />
        <div className="pt-2">
          {props.alerts.map((alert, idx) => (
            <Alert
              key={idx}
              color={alert.color}
              className="text-center"
              toggle={() => props.clearBlastAlert(idx)}
            >
              <div dangerouslySetInnerHTML={wrapText(alert.text)} />
            </Alert>
          ))}
        </div>
        <div className="text-center">{props.isSubmitting && <AnimateHelix scale={0.2} />}</div>
      </CardBody>
      <CardFooter className="text-center">
        <Button color="warning" disabled={props.isSearchDisabled} onClick={props.runBlast}>
          Run BLAST
        </Button>
      </CardFooter>
    </Card>
  )
}

const mapStateToProps = (state, props) => {
  const selectedAmplicon = getAmpliconFilter(state)
  return {
    isAmpliconSelected: selectedAmplicon.value,
    sequenceValue: state.searchPage.blastSearch.sequenceValue,
    isSubmitting: state.searchPage.blastSearch.isSubmitting,
    isSearchDisabled:
      selectedAmplicon.value === '' ||
      state.searchPage.blastSearch.sequenceValue === '' ||
      state.searchPage.blastSearch.isSubmitting,
    alerts: state.searchPage.blastSearch.alerts,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      handleBlastSequence,
      runBlast,
      clearBlastAlert,
    },
    dispatch
  )
}
export default connect(mapStateToProps, mapDispatchToProps)(BlastSearchCard)
