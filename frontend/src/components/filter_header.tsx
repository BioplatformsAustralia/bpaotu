import React from 'react'
import { Label, UncontrolledTooltip } from 'reactstrap'

import Octicon from 'components/octicon'

export const FilterHeader = ({ label, info }) => {
  const regex = /\W/g
  const elementId = label.replace(regex, '') + '-Tip'

  return (
    <Label sm={3}>
      {label}
      {info && (
        <>
          <span id={elementId} style={{ marginLeft: 8 }}>
            <Octicon name="info" />
          </span>
          <UncontrolledTooltip target={elementId} placement="auto">
            {info}
          </UncontrolledTooltip>
        </>
      )}
    </Label>
  )
}
