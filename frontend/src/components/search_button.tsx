import * as React from 'react'
import { Button, UncontrolledTooltip } from 'reactstrap'
import Octicon from 'components/octicon'

type SearchButtonProps = {
  id?: string
  size?: 'sm' | 'md' | 'lg'
  isDisabled?: boolean
  onClick: () => void
  octicon?: string
  text: string
  tooltip?: string
}

export default ({ id, size, isDisabled, onClick, octicon, text }: SearchButtonProps) => {
  const dataTut = id ? `reactour__${id}` : null

  return (
    <Button
      id={id}
      data-tut={dataTut}
      block
      color="primary"
      size={size}
      disabled={isDisabled}
      onClick={onClick}
    >
      {octicon && (
        <span style={{ marginRight: 8 }}>
          <Octicon name={octicon} />
        </span>
      )}
      <span>{text}</span>
    </Button>
  )
}

export const DisabledButton = ({
  id,
  size,
  octicon,
  text,
  tooltip,
  onClick,
}: SearchButtonProps) => {
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
