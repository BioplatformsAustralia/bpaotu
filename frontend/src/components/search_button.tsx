import * as React from 'react'
import { Button } from 'reactstrap'
import Octicon from './octicon'

export default props => (
  <Button id={props.text} block={true} color="primary" size="lg" disabled={props.isDisabled} onClick={props.onClick} data-tut={props.text}> 
    {props.octicon ? (
      <span>
        <Octicon name={props.octicon} />
        &nbsp;
      </span>
    ) : (
      ''
    )} &nbsp; {props.text} 
  </Button>
)
