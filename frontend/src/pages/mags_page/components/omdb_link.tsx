import React from 'react'
import Octicon from 'components/octicon'
import { UncontrolledTooltip } from 'reactstrap'

export const OMDBLink = ({ result }) => {
  if (!result) return null
  const { biosample, omdb_count } = result

  if (!biosample || omdb_count === 0) {
    return (
      <div>
        <em>None</em>
      </div>
    )
  }

  const tipId = 'omdb-link'

  return (
    <>
      <span id={tipId}>
        <a
          href={`https://omdb.microbiomics.io/repository/ocean/genomes-by-sample?search_term=BPAM22-1_${biosample}_METAG&search_column=sample`}
          target="_blank"
        >
          <span style={{ marginLeft: 6 }}>
            <Octicon name="link-external" />
          </span>
        </a>
      </span>
      <UncontrolledTooltip target={tipId} autohide={false} placement="right">
        There are additional MAGs for this sample available at the OceanMicrobiomicsDB
      </UncontrolledTooltip>
    </>
  )
}

export const OMDBCount = ({ result }) => {
  if (!result) return null
  const { biosample, omdb_count } = result

  if (!biosample || omdb_count === 0) {
    return (
      <div>
        <em>None</em>
      </div>
    )
  }

  return <div>{omdb_count}</div>
}
