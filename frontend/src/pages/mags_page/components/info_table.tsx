import React from 'react'

import './info_table.css'

const InfoTable = ({ columns, record }) => {
  if (!record) return null

  return (
    <table className="info-table">
      <tbody>
        {columns.map((f) => (
          <tr key={f.accessor}>
            <td className="info-label">{f.Header}</td>
            <td className="info-value">{record[f.accessor]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default InfoTable
