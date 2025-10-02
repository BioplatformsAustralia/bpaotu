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

export const DisabledButton = ({ id, size, octicon, text, tooltip, onClick }) => {
  return (
    <>
      <Button
        id={id}
        block={true}
        color="secondary"
        size={size}
        disabled={true}
        style={{ cursor: 'not-allowed' }}
        onClick={onClick}
      >
        {octicon && (
          <span style={{ marginRight: 8 }}>
            <Octicon name={octicon} />
          </span>
        )}
        <span>{text}</span>
      </Button>
      {tooltip && (
        <UncontrolledTooltip target={id} placement="auto">
          {tooltip}
        </UncontrolledTooltip>
      )}
    </>
  )
}
