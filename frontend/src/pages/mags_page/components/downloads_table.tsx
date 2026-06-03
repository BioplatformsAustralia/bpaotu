import React from 'react'
import { Button, Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap'
import Octicon from 'components/octicon'

import './downloads_table.css'

const magFileTypesLookup = [
  {
    downloadType: 'antismash',
    fileType: 'zip',
    description: 'Antismash analysis of the MAG',
  },
  {
    downloadType: 'cog',
    fileType: 'tsv',
    description: 'COG functional assignment for each ORF in the MAG',
  },
  {
    downloadType: 'fa',
    fileType: 'FASTA',
    description: 'Fasta file containing the contigs from the MAG',
  },
  {
    downloadType: 'gff',
    fileType: 'genome feature format version3',
    description: 'Features and position in contigs for each of the predicted genes in the MAG',
  },
  {
    downloadType: 'kegg',
    fileType: 'tsv',
    description: 'KEGG functional assignment for each ORF in the MAG',
  },
  {
    downloadType: 'orf.faa',
    fileType: 'FASTA',
    description: 'Amino acid sequences for predicted ORFs in the MAG',
  },
  {
    downloadType: 'orf.fa',
    fileType: 'FASTA',
    description: 'Nucleotide sequences for predicted ORF in the MAG',
  },
  {
    downloadType: 'orftable',
    fileType: 'tsv',
    description: 'Several measures regarding ORF characteristics of the MAG',
  },
  {
    downloadType: 'pfam',
    fileType: 'tsv',
    description: 'PFAM functional assignment for each ORF in the MAG',
  },
  {
    downloadType: 'gtdbtk',
    fileType: 'tsv',
    description: 'GTDB-Tk taxonomy assignment of the MAG',
  },
]

const DownloadsTable = ({ magId }) => {
  const openDownloadInNewTab = (downloadType: string) => {
    // open the download URL in a new tab via script - browsers will then allow window.close() from that tab
    const url = `/ext/mags/download?magId=${encodeURIComponent(magId)}&downloadType=${encodeURIComponent(downloadType)}`
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
            {magFileTypesLookup.map(({ downloadType, fileType, description }) => {
              return (
                <tr key={downloadType}>
                  <td className="downloads-type">{downloadType}</td>
                  <td className="downloads-download">
                    <Button
                      size="sm"
                      style={{ border: 'none' }}
                      outline={true}
                      color="primary"
                      aria-label="Download"
                      onClick={() => openDownloadInNewTab(downloadType)}
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
