import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { Button, Card, CardBody, CardFooter, CardHeader, Input } from 'reactstrap'

import Octicon from '../../../components/octicon'

export class BlastSearchCard extends React.Component<any> {
  public render() {
    return (
      <Card>
        <CardBody className="blast">
          <Input
            type="text"
            name="sequence"
            id="sequence"
            placeholder="Select Amplicon and enter sequence here to run BLAST"
            disabled={!this.props.isAmpliconSelected}
          />
        </CardBody>
        <CardFooter className="text-center">
          <Button color="warning">Run BLAST</Button>
        </CardFooter>
      </Card>
    )
  }
}

function mapStateToProps(state) {
  return {
    isAmpliconSelected: state.searchPage.filters.selectedAmplicon.value
  }
}

export default connect(mapStateToProps)(BlastSearchCard)
