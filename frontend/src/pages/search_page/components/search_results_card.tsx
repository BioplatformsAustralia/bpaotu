import React, { useRef, useEffect, useState } from 'react'
import { last } from 'lodash'
import { useAppDispatch, useAppSelector } from 'hooks/redux'
import { Alert, Button, Card, CardBody, CardHeader } from 'reactstrap'

import { ExportDataButton } from 'components/export_data_button'

import { describeSearch } from '../reducers/search'
import { clearGalaxyAlert, submitToGalaxy, workflowOnGalaxy } from '../reducers/submit_to_galaxy'
import { clearTips, showPhinchTip } from '../reducers/tips'
import { openKronaModal } from '../reducers/krona_modal'
import { openMetagenomeModal, openMetagenomeModalSearch } from '../reducers/metagenome_modal'
import { GalaxySubmission } from '../reducers/types'

import { clearOtuExportAlert, runOtuExport } from '../reducers/otu_export'

import { metaxaAmpliconStringMatch } from 'app/constants'

import BlastModal from './blast_search_modal'
import SamplesMapModal from './samples_map_modal'
import SamplesGraphModal from './samples_graph_modal'
import SamplesComparisonModal from './samples_comparison_modal'
import MetagenomeModal from './metagenome_modal'
import KronaModal from './krona_modal'
import ConnectedSearchResultsTable from './search_results_table'

const wrapText = (text) => ({ __html: text })

type AlertBox = {
  color: string
  text: string
}

const AlertBoxes = ({
  alerts,
  clearAlerts,
}: {
  alerts: AlertBox[]
  clearAlerts: (index: number) => void
}) => (
  <div>
    {alerts.map((alert, idx) => (
      <Alert
        key={idx}
        color={alert.color}
        fade={false}
        className="text-center"
        toggle={() => clearAlerts(idx)}
      >
        <div dangerouslySetInnerHTML={wrapText(alert.text)} />
      </Alert>
    ))}
  </div>
)

const cell_button = (cell_props, openMetagenomeModal) => (
  <Button
    onClick={() => {
      openMetagenomeModal(cell_props.row.sample_id)
    }}
  >
    {cell_props.value}
  </Button>
)

const krona_button = (cell_props, openKronaModal) => (
  <Button
    onClick={() => {
      openKronaModal(cell_props.row.sample_id)
    }}
  >
    {cell_props.value}
  </Button>
)

const download = (baseURL, props, onlyContextual = false) => {
  const params = new URLSearchParams()
  params.set('q', JSON.stringify(props.describeSearch()))
  params.set('only_contextual', onlyContextual ? 't' : 'f')

  const url = `${baseURL}?${params.toString()}`
  window.open(url)
}

type PopupProps = {
  children: React.ReactNode
  onClose: () => void
}

const Popup = ({ children, onClose }: PopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose() // close on click outside
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={popupRef}
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)', // center align (with left: 50%)
        marginTop: '8px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
        padding: '12px 0px',
        zIndex: 10,
        minWidth: '250px', // so buttons are side by side
      }}
    >
      {children}
      <div style={{ marginTop: 8, paddingLeft: 8, paddingRight: 8 }}>
        <p>
          <small>
            <em>Stream</em> will download directly through your browser. Use for small datasets.
          </small>
        </p>
        <p style={{ marginBottom: 0 }}>
          <small>
            <em>Packet</em> will generate a download packet and provide a link below and via email.
            Use for large datasets.
          </small>
        </p>
      </div>
    </div>
  )
}

const OtuExportBox = ({ state, clear }) => {
  const { isLoading, isFinished, status, resultUrl } = state

  if (!isLoading && !isFinished) return null

  const statusTextMap = {
    init: 'Initialising download...',
    processing: (
      <>
        Your request is being processed. The download link for results will be sent via email and
        displayed below when it is complete.
        <br />
        You can close this window without interrupting the data export.
      </>
    ),
    cancelling: 'Cancelling...',
    complete: (
      <>
        Your search is complete.
        <br />
        Download the results from this link:
      </>
    ),
  }

  const text = statusTextMap[status]

  return (
    <div
      style={{
        marginTop: 12,
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Alert
        color="info"
        fade={false}
        className="text-center"
        toggle={clear}
        style={{ marginBottom: 0, width: '50%' }}
      >
        <span>{text}</span>
        {resultUrl && (
          <span>
            {' '}
            <a target="_blank" rel="noopener noreferrer" href={resultUrl} className="alert-link">
              here
            </a>
          </span>
        )}
      </Alert>
    </div>
  )
}

export const SearchResultsCard = () => {
  const dispatch = useAppDispatch()
  const galaxy = useAppSelector((state) => state.searchPage.galaxy)
  const tips = useAppSelector((state) => state.searchPage.tips)
  const otuExport = useAppSelector((state) => state.searchPage.otuExport)
  const describeSearchValue = useAppSelector((state) => describeSearch(state))
  const metaxaAmpliconSelected = useAppSelector((state) => {
    const selectedAmpliconId = state.searchPage.filters.selectedAmplicon.value
    const metaxaOption = state.referenceData.amplicons.values.find((x) =>
      x.value.startsWith(metaxaAmpliconStringMatch),
    )
    const metaxaOptionId = metaxaOption ? metaxaOption.id : undefined
    return metaxaOptionId === selectedAmpliconId
  })
  const submitToGalaxyAction = () => dispatch(submitToGalaxy())
  const workflowOnGalaxyAction = () => dispatch(workflowOnGalaxy())
  const clearGalaxyAlertAction = (idx) => dispatch(clearGalaxyAlert(idx))
  const clearTipsAction = () => dispatch(clearTips())
  const showPhinchTipAction = () => dispatch(showPhinchTip())
  const openKronaModalAction = (sampleId) => dispatch(openKronaModal(sampleId))
  const runOtuExportAction = () => dispatch(runOtuExport())
  const clearOtuExportAction = () => dispatch(clearOtuExportAlert())

  const [showExportTypeStandard, setShowExportTypeStandard] = useState(false)
  const [showExportTypeBIOM, setShowExportTypeBIOM] = useState(false)

  const isGalaxySubmissionDisabled = () => {
    if (galaxy.isSubmitting) {
      return true
    }

    const lastSubmission: GalaxySubmission = last(galaxy.submissions)
    return lastSubmission && !lastSubmission.finished
  }

  const exportBIOMPacket = () => {
    showPhinchTipAction()
    alert('runOtuExportBIOM')
    // runOtuExportBIOMAction()
  }

  const exportBIOM = () => {
    showPhinchTipAction()
    download(window.otu_search_config.export_biom_endpoint, {
      describeSearch: () => describeSearchValue,
    })
  }

  const exportCSVPacket = () => {
    setShowExportTypeStandard(false)
    runOtuExportAction()
  }

  const exportCSV = () => {
    setShowExportTypeStandard(false)
    download(window.otu_search_config.export_endpoint, {
      describeSearch: () => describeSearchValue,
    })
  }

  const exportCSVOnlyContextual = () => {
    download(
      window.otu_search_config.export_endpoint,
      {
        describeSearch: () => describeSearchValue,
      },
      true,
    )
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="text-center">
            <ExportDataButton
              id="ExportContextualOnly"
              size="sm"
              octicon="desktop-download"
              text="Download Contextual Data only (CSV)"
              onClick={exportCSVOnlyContextual}
            />
            <span style={{ position: 'relative' }}>
              <ExportDataButton
                id="ExportOtuContextual"
                size="sm"
                octicon="desktop-download"
                text="Download OTU and Contextual Data (CSV)"
                onClick={() => setShowExportTypeStandard(true)}
              />
              {showExportTypeStandard && (
                <Popup onClose={() => setShowExportTypeStandard(false)}>
                  <ExportDataButton
                    id="ExportOtuContextualStream"
                    size="sm"
                    octicon="desktop-download"
                    text="Stream"
                    onClick={exportCSV}
                  />
                  <ExportDataButton
                    id="ExportOtuContextualPacket"
                    size="sm"
                    octicon="desktop-download"
                    text="Packet"
                    onClick={exportCSVPacket}
                  />
                </Popup>
              )}
            </span>
            <span style={{ position: 'relative' }}>
              <ExportDataButton
                id="ExportBIOM"
                size="sm"
                octicon="desktop-download"
                text="Download BIOM format (Phinch compatible)"
                onClick={exportBIOM}
                // onClick={() => setShowExportTypeBIOM(true)}
              />
              {showExportTypeBIOM && (
                <Popup onClose={() => setShowExportTypeBIOM(false)}>
                  <ExportDataButton
                    id="ExportBIOMStream"
                    size="sm"
                    octicon="desktop-download"
                    text="Stream"
                    onClick={exportBIOM}
                  />
                  <ExportDataButton
                    id="ExportBIOMPacket"
                    size="sm"
                    octicon="desktop-download"
                    text="Packet"
                    onClick={exportBIOMPacket}
                  />
                </Popup>
              )}
            </span>

            {window.otu_search_config.galaxy_integration && (
              <ExportDataButton
                id="ExportGalaxy"
                size="sm"
                octicon="clippy"
                text="Export Data to Galaxy Australia for further analysis"
                disabled={isGalaxySubmissionDisabled()}
                onClick={submitToGalaxyAction}
              />
            )}
            {window.otu_search_config.galaxy_integration && (
              <ExportDataButton
                id="ExportKrona"
                size="sm"
                octicon="graph"
                text="Export Data to Galaxy Australia for Krona Taxonomic Abundance Graph"
                disabled={isGalaxySubmissionDisabled()}
                onClick={workflowOnGalaxyAction}
              />
            )}
          </div>
          <OtuExportBox state={otuExport} clear={clearOtuExportAction} />
        </CardHeader>
        <CardBody>
          <AlertBoxes alerts={galaxy.alerts} clearAlerts={clearGalaxyAlertAction} />
          <AlertBoxes alerts={tips.alerts} clearAlerts={clearTipsAction} />
          <ConnectedSearchResultsTable
            kronaFunc={(cell_props) => krona_button(cell_props, openKronaModalAction)}
            metagenome={metaxaAmpliconSelected}
          />
        </CardBody>
      </Card>

      <BlastModal />
      <SamplesMapModal />
      <SamplesGraphModal />
      <SamplesComparisonModal />
      <KronaModal />
    </div>
  )
}

export const MetagenomeSearchResultsCard = () => {
  const dispatch = useAppDispatch()
  const describeSearchValue = useAppSelector((state) => describeSearch(state))
  const tips = useAppSelector((state) => state.searchPage.tips)
  const clearTipsAction = () => dispatch(clearTips())
  // const showPhinchTipAction = () => dispatch(showPhinchTip())
  const openMetagenomeModalAction = (sampleId) => dispatch(openMetagenomeModal(sampleId))
  const openMetagenomeModalSearchAction = () => dispatch(openMetagenomeModalSearch())
  const openKronaModalAction = (sampleId) => dispatch(openKronaModal(sampleId))
  // const runOtuExportAction = () => dispatch(runOtuExport())

  const exportCSVOnlyContextualMetagenome = () => {
    download(
      window.otu_search_config.export_endpoint,
      {
        describeSearch: describeSearchValue,
      },
      true,
    )
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="text-center">
            <ExportDataButton
              id="RequestMetagenomeFiles"
              octicon="desktop-download"
              text={`Request metagenome files for all selected samples`}
              onClick={openMetagenomeModalSearchAction}
            />
            <ExportDataButton
              id="ExportContextualOnly"
              octicon="desktop-download"
              text="Download Contextual Data only (CSV)"
              onClick={exportCSVOnlyContextualMetagenome}
            />
          </div>
        </CardHeader>
        <CardBody>
          <AlertBoxes alerts={tips.alerts} clearAlerts={clearTipsAction} />
          <ConnectedSearchResultsTable
            cellFunc={(cell_props) => cell_button(cell_props, openMetagenomeModalAction)}
            kronaFunc={(cell_props) => krona_button(cell_props, openKronaModalAction)}
            metagenome
          />
        </CardBody>
      </Card>

      <BlastModal />
      <SamplesMapModal />
      <SamplesGraphModal />
      <SamplesComparisonModal />
      <KronaModal />
      <MetagenomeModal />
    </div>
  )
}
