import React from 'react'
import { Button } from 'reactstrap'
import Octicon from 'components/octicon'

export const ExportDataButton = (props) => {
  const id = props.id
  const dataTut = id ? `reactour__${id}` : null

  return (
    <Button
      id={id}
      data-tut={dataTut}
      size={props.size}
      style={{ marginRight: 10 }}
      outline={true}
      color="primary"
      disabled={props.disabled}
      onClick={props.onClick}
      title={props.disabled ? 'Select Amplicon to ' + props.text : ''}
    >
      {props.octicon ? (
        <span>
          <Octicon name={props.octicon} />
          &nbsp;
        </span>
      ) : (
        ''
      )}
      {props.text}
    </Button>
  )
}
