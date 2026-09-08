import React from 'react'
import { Button } from 'reactstrap'
import Octicon from 'components/octicon'

type ExportDataButtonProps = {
  id?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick: () => void
  octicon?: string
  text: string
}

export const ExportDataButton = ({
  id,
  size,
  disabled,
  onClick,
  text,
  octicon,
}: ExportDataButtonProps) => {
  const dataTut = id ? `reactour__${id}` : null

  return (
    <Button
      id={id}
      data-tut={dataTut}
      size={size}
      style={{ marginLeft: 6, marginRight: 6 }}
      outline={true}
      color="primary"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? `Select Amplicon to ${text}` : ''}
    >
      {octicon && (
        <span>
          <Octicon name={octicon} />
          &nbsp;
        </span>
      )}
      {text}
    </Button>
  )
}
