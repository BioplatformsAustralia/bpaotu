import * as React from 'react'
import { Button, UncontrolledTooltip } from 'reactstrap'
import Octicon from 'components/octicon'

export default (props) => {
  const id = props.id
  const dataTut = id ? `reactour__${id}` : null

  return (
    <Button
      id={id}
      data-tut={dataTut}
      block={true}
      color="primary"
      size={props.size}
      disabled={props.isDisabled}
      onClick={props.onClick}
    >
      {props.octicon && (
        <span style={{ marginRight: 8 }}>
          <Octicon name={props.octicon} />
        </span>
      )}
      <span>{props.text}</span>
    </Button>
  )
}

export const DisabledButton = (props) => {
  const id = props.id

  return (
    <Button
      id={id}
      block={true}
      color="secondary"
      size={props.size}
      disabled={true}
      style={{ cursor: 'not-allowed' }}
      onClick={props.onClick}
    >
      {props.octicon && (
        <span style={{ marginRight: 8 }}>
          <Octicon name={props.octicon} />
        </span>
      )}
      <span>{props.text}</span>
    </Button>
  )
}
