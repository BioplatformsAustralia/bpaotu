import React from 'react'
import { Card, CardBody, CardHeader } from 'reactstrap'

import MagsSearchResultsTable from './mags_results_table'

const MagsResultsCard = (props) => {
  return (
    <div>
      <Card>
        <CardHeader>Metagenome Assembled Genomes</CardHeader>
        <CardBody>
          <MagsSearchResultsTable />
        </CardBody>
      </Card>
    </div>
  )
}

export default MagsResultsCard
