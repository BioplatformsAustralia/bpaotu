import React from 'react'
import { Button, Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap'
import Octicon from 'components/octicon'

import './downloads_table.css'

const magFileTypesLookup = [
  {
    type: 'antismash',
    fileType: 'zip',
    description: 'Antismash analysis of the MAG',
  },
  {
    type: 'cog',
    fileType: 'tsv',
    description: 'COG functional assignment for each ORF in the MAG',
  },
  { type: 'fa', fileType: 'FASTA', description: 'Fasta file containing the contigs from the MAG' },
  {
    type: 'gff',
    fileType: 'genome feature format version3',
    description: 'Features and position in contigs for each of the predicted genes in the MAG',
  },
  {
    type: 'kegg',
    fileType: 'tsv',
    description: 'KEGG functional assignment for each ORF in the MAG',
  },
  {
    type: 'orf.faa',
    fileType: 'FASTA',
    description: 'Amino acid sequences for predicted ORFs in the MAG',
  },
  {
    type: 'orf.fa',
    fileType: 'FASTA',
    description: 'Nucleotide sequences for predicted ORF in the MAG',
  },
  {
    type: 'orftable',
    fileType: 'tsv',
    description: 'Several measures regarding ORF characteristics of the MAG',
  },
  {
    type: 'pfam',
    fileType: 'tsv',
    description: 'PFAM functional assignment for each ORF in the MAG',
  },
  {
    type: 'gtdbtk',
    fileType: 'tsv',
    description: 'GTDB-Tk taxonomy assignment of the MAG',
  },
]

const DownloadsTable = ({ magId }) => {
  const openDownloadInNewTab = (fileType: string) => {
    // open the download URL in a new tab via script - browsers will then allow window.close() from that tab
    const url = `/ext/mags/download?magId=${encodeURIComponent(magId)}&fileType=${encodeURIComponent(fileType)}`
    window.open(url, '_blank', 'noopener')
  }

  return (
    <Card>
      <CardHeader tag="h5">Downloads</CardHeader>
      <CardBody>
        <table>
          <thead>
            <tr>
              <th className="downloads-type"></th>
              <th className="downloads-download">Download</th>
              <th className="downloads-filetype">File Type</th>
              <th className="downloads-description">Description</th>
            </tr>
          </thead>

          <tbody>
            {magFileTypesLookup.map(({ type, fileType, description }) => {
              return (
                <tr key={type}>
                  <td className="downloads-type">{type}</td>
                  <td className="downloads-download">
                    <Button
                      size="sm"
                      style={{ border: 'none' }}
                      outline={true}
                      color="primary"
                      aria-label="Download"
                      onClick={() => openDownloadInNewTab(fileType)}
                    >
                      <Octicon name="desktop-download" />
                    </Button>
                  </td>
                  <td className="downloads-filetype">{fileType}</td>
                  <td className="downloads-description">{description}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardBody>
    </Card>
  )
}

export default DownloadsTable
