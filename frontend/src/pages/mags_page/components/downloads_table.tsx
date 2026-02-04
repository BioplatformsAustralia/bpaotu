import React from 'react'
import { Button, Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap'
import Octicon from 'components/octicon'

const DownloadsTable = () => {
  // this would also come from the main object
  const files = [
    { field: 'GENOME_FILE', label: 'Genome', filename: '', link: '' },
    { field: 'GENES_NT_FILE', label: 'Genes NT', filename: '', link: '' },
    { field: 'GENES_AA_FILE', label: 'Genes AA', filename: '', link: '' },
    { field: 'GENES_GFF_FILE', label: 'Genes GFF', filename: '', link: '' },
    { field: 'ANTISMASH_FILE', label: 'AntiSmash', filename: '', link: '' },
  ]

  const handleDownloadLink = (link) => {
    console.log('handleDownloadLink', 'link', link)
  }

  return (
    <Card>
      <CardHeader>Downloads</CardHeader>
      <CardBody>
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Filename</th>
              <th>Download</th>
            </tr>
          </thead>

          <tbody>
            {files.map((f) => (
              <tr key={f.label}>
                <td>{f.label}</td>
                <td>{f.filename}</td>
                <td>
                  <Button
                    size="sm"
                    style={{
                      marginLeft: 6,
                      marginRight: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                    }}
                    outline={true}
                    color="primary"
                    onClick={() => handleDownloadLink(f.link)}
                    aria-label="Download"
                  >
                    <Octicon name="desktop-download" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  )
}

export default DownloadsTable
