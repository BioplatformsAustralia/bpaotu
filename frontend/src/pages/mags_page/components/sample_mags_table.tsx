import React from 'react'

import { SearchResultsTable } from 'pages/mags_page/components'

const SampleMagsTable = ({ sampleId }: { sampleId: string }) => {
  return <SearchResultsTable sampleId={sampleId} />
}

export default SampleMagsTable
