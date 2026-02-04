import React from 'react'
import { Card, CardBody, CardHeader } from 'reactstrap'

import { SearchResultsTable } from 'pages/mags_page/components'

const SearchResultsCard = (props) => {
  return (
    <div>
      <Card>
        <CardHeader>Metagenome Assembled Genomes</CardHeader>
        <CardBody>
          <SearchResultsTable />
        </CardBody>
      </Card>
    </div>
  )
}

export default SearchResultsCard
