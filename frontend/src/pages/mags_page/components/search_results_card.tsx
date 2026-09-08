import React from 'react'
import { Card, CardBody, CardHeader } from 'reactstrap'

import { SearchResultsTable } from 'pages/mags_page/components'

const SearchResultsCard = () => {
  return (
    <div>
      <Card>
        <CardHeader tag="h1">Metagenome-Assembled Genomes</CardHeader>
        <CardBody>
          <SearchResultsTable />
        </CardBody>
      </Card>
    </div>
  )
}

export default SearchResultsCard
