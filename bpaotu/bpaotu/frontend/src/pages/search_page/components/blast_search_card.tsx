import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { Button, Card, CardBody, CardFooter, CardHeader, Input } from 'reactstrap'

import Octicon from '../../../components/octicon'
import { handleBlastSequence } from '../reducers/blast_search'

export class BlastSearchCard extends React.Component<any> {
  public render() {
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
        </CardBody>
        <CardFooter className="text-center">
          <Button color="warning" disabled={!this.props.blastSearchEnabled}>
            Run BLAST
          </Button>
        </CardFooter>
      </Card>
    )
  }
}

function mapStateToProps(state, props) {
  return {
    isAmpliconSelected: state.searchPage.filters.selectedAmplicon.value,
    sequenceValue: state.searchPage.blastSearch.sequenceValue,
    blastSearchEnabled: state.searchPage.blastSearch.sequenceValue.length > 0 ? true : false
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      handleBlastSequence
    },
    dispatch
  )
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BlastSearchCard)
