import React from 'react'
import { Button, Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap'
import Octicon from 'components/octicon'

import './downloads_table.css'

const magFileTypes = [
  {
    type: 'antismash',
    description: 'antismash TODO description',
  },
  {
    type: 'cog',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore ' +
      'et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut ' +
      'aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum ' +
      'dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui ' +
      'officia deserunt mollit anim id est laborum.',
  },
  { type: 'fa', description: 'fa TODO description' },
  { type: 'gff', description: 'gff TODO description' },
  { type: 'kegg', description: 'kegg TODO description' },
  { type: 'orf.faa', description: 'orf.faa TODO description' },
  { type: 'orf.fa', description: 'orf.fa TODO description' },
  { type: 'orftable', description: 'orftable TODO description' },
  { type: 'pfam', description: 'pfam TODO description' },
  { type: 'gtdbtk', description: 'gtdbtk TODO description' },
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
              <th className="downloads-type">Type</th>
              <th className="downloads-download">Download</th>
              <th className="downloads-description">Description</th>
            </tr>
          </thead>

          <tbody>
            {magFileTypes.map(({ type: fileType, description }) => {
              return (
                <tr key={fileType}>
                  <td className="downloads-type">{fileType}</td>
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
