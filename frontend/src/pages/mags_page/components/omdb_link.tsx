import React from 'react'
import Octicon from 'components/octicon'

const OMDBLink = ({ result }) => {
  if (!result) return null

  const { biosample, omdb_count } = result
  if (omdb_count === 0) return null

  return (
    <div>
      There are {omdb_count} additional MAGs for this sample available at the{' '}
      <a
        href={`https://omdb.microbiomics.io/repository/ocean/genomes-by-sample?search_term=BPAM22-1_${biosample}_METAG&search_column=sample`}
        target="_blank"
      >
        OceanMicrobiomicsDB
        <span style={{ marginLeft: 4 }}>
          <Octicon name="link-external" />
        </span>
      </a>
    </div>
  )
}

export default OMDBLink
