import React from 'react'
import md5 from 'blueimp-md5'
import { UncontrolledTooltip } from 'reactstrap'
import Octicon from 'components/octicon'

import { searchColumnsLookup } from 'pages/mags_page/definitions/search_columns'
import { sampleColumnsLookup } from 'pages/mags_page/definitions/sample_columns'

import './info_table.css'

const InfoTable = ({ columns, record, mag = false }) => {
  if (!record) return null

  // use different lookups for mags / sample mags
  const lookup = mag ? searchColumnsLookup : sampleColumnsLookup

  return (
    <table className="info-table">
      <tbody>
        {columns.map((f) => {
          const { label, units, infoText } = lookup[f.accessor]
          const tipId = `table-header-tooltip-${md5(label)}`

          return (
            <tr key={f.accessor}>
              <td className="info-label">
                {infoText && (
                  <>
                    <span id={tipId} className="info-tooltip">
                      <Octicon name="info" />
                    </span>
                    <UncontrolledTooltip target={tipId} autohide={false} placement="bottom">
                      {infoText}
                    </UncontrolledTooltip>
                  </>
                )}
                <span>{label}</span>
                {units && <span className="info-units">{units}</span>}
              </td>
              <td className="info-value">{record[f.accessor]}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default InfoTable
