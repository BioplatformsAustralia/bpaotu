import React from 'react'
import classnames from 'classnames'
import { UncontrolledTooltip } from 'reactstrap'

import Octicon from 'components/octicon'

import './graph.css'

interface GraphTabButtonProps {
  id: string
  dataTut: string
  tabId: string
  label: string
  selectedTab: string
  selectTab: (tab: string) => void
  tooltip?: React.ReactNode
}

const GraphTabButton = ({
  id,
  dataTut,
  tabId,
  label,
  selectedTab,
  selectTab,
  tooltip,
}: GraphTabButtonProps) => (
  <>
    <button
      type="button"
      data-tut={dataTut}
      id={id}
      className={classnames('graph-tab', {
        active: selectedTab === tabId,
      })}
      onClick={() => selectTab(tabId)}
    >
      {label}{' '}
      {tooltip && (
        <span id={`${id}-tooltip`}>
          <Octicon name="info" align="top" />
        </span>
      )}
    </button>

    {tooltip && (
      <UncontrolledTooltip target={`${id}-tooltip`} placement="auto">
        {tooltip}
      </UncontrolledTooltip>
    )}
  </>
)

export default GraphTabButton
