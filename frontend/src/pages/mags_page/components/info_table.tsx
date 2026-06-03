import React, { useState } from 'react'
import md5 from 'blueimp-md5'
import { Button, UncontrolledTooltip } from 'reactstrap'
import Octicon from 'components/octicon'

import { searchColumnsLookup } from 'pages/mags_page/definitions/search_columns'
import { sampleColumnsLookup } from 'pages/mags_page/definitions/sample_columns'

import './info_table.css'

const TaxGTDBToggle = ({ expanded, setExpanded }) => {
  return (
    <span className="tax-gtdb-controls">
      <Button
        size="sm"
        outline={true}
        className="tax-gtdb-button"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? 'Ranks' : 'Raw'}
        <span style={{ fontSize: 13 }}></span>
      </Button>
    </span>
  )
}

const TaxGTDBValue = ({ expanded, value }) => {
  if (!value) return null

  const ranks = value.split(';')

  return (
    <div className="tax-gtdb-value">
      <div className="tax-gtdb-content">
        {expanded ? (
          <ul className="tax-gtdb-list">
            {ranks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        ) : (
          <span>{value}</span>
        )}
      </div>
    </div>
  )
}

const InfoTable = ({ columns, record, mag = false }) => {
  const [expanded, setExpanded] = useState(true)
  if (!record) return null

  // use different lookups for mags / sample mags
  const lookup = mag ? searchColumnsLookup : sampleColumnsLookup

  return (
    <table className="info-table">
      <tbody>
        {columns.map((f) => {
          const { label, units, infoText } = lookup[f.accessor]
          const tipId = `table-header-tooltip-${md5(label)}`

          let secondary = units && <span className="info-units">{units}</span>
          let value = record[f.accessor]

          if (f.accessor === 'tax_gtdb') {
            secondary = <TaxGTDBToggle expanded={expanded} setExpanded={setExpanded} />
            value = <TaxGTDBValue expanded={expanded} value={value} />
          }

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
                <span className="info-label-text">{label}</span>
                {secondary}
              </td>
              <td className="info-value">{value}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default InfoTable
