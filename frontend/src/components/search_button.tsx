import * as React from 'react'
import { Button } from 'reactstrap'
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
