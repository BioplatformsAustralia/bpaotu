import React, { useRef, useEffect, useState } from 'react'
import { last } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Alert, Button, Card, CardBody, CardHeader } from 'reactstrap'

import { ExportDataButton } from 'components/export_data_button'

import { describeSearch } from '../reducers/search'
import { clearGalaxyAlert, submitToGalaxy, workflowOnGalaxy } from '../reducers/submit_to_galaxy'
import { clearTips, showPhinchTip } from '../reducers/tips'
import { openKronaModal } from '../reducers/krona_modal'
import { openMetagenomeModal, openMetagenomeModalSearch } from '../reducers/metagenome_modal'
import { GalaxySubmission } from '../reducers/types'

import { runOtuExport, cancelOtuExport } from '../reducers/otu_export'

import { metaxaAmpliconStringMatch } from 'app/constants'

import BlastModal from './blast_search_modal'
import SamplesMapModal from './samples_map_modal'
import SamplesGraphModal from './samples_graph_modal'
import SamplesComparisonModal from './samples_comparison_modal'
import MetagenomeModal from './metagenome_modal'
import KronaModal from './krona_modal'
import SearchResultsTable from './search_results_table'

const wrapText = (text) => ({ __html: text })

const AlertBoxes = (props) => (
  <div>
    {props.alerts.map((alert, idx) => (
      <Alert
        key={idx}
        color={alert.color}
        className="text-center"
        toggle={() => props.clearAlerts(idx)}
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
  params.set('token', props.ckanAuthToken)
  params.set('q', JSON.stringify(props.describeSearch()))
  params.set('only_contextual', onlyContextual ? 't' : 'f')

  const url = `${baseURL}?${params.toString()}`
  window.open(url)
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
        className="text-center"
        toggle={clear}
        style={{ marginBottom: 0, width: '50%' }}
      >
        <span>{text}</span>
        {resultUrl && (
          <span>
            {' '}
            <a target="_blank" href={resultUrl} className="alert-link">
              here
            </a>
          </span>
        )}
      </Alert>
    </div>
  )
}

const _SearchResultsCard = (props) => {
  const exportTypeStandardRef = useRef(null)
  const [showExportTypeStandard, setShowExportTypeStandard] = useState(false)
  const [showExportTypeBIOM, setShowExportTypeBIOM] = useState(false)

  const handleClick = (e) => {
    // if ref.current exists and the clicked target is NOT inside it
    if (exportTypeStandardRef.current && !exportTypeStandardRef.current.contains(e.target)) {
      setShowExportTypeStandard(false)
    }
  }

  const isGalaxySubmissionDisabled = () => {
    if (props.galaxy.isSubmitting) {
      return true
    }

    const lastSubmission: GalaxySubmission = last(props.galaxy.submissions)
    return lastSubmission && !lastSubmission.finished
  }

  const exportBIOMPacket = () => {
    props.showPhinchTip()
    alert('runOtuExportBIOM')
    // props.runOtuExportBIOM()
  }

  const exportBIOM = () => {
    props.showPhinchTip()
    download(window.otu_search_config.export_biom_endpoint, props)
  }

  const exportCSVPacket = () => {
    setShowExportTypeStandard(false)
    props.runOtuExport()
  }

  const exportCSV = () => {
    setShowExportTypeStandard(false)
    download(window.otu_search_config.export_endpoint, props)
  }

  const exportCSVOnlyContextual = () => {
    download(window.otu_search_config.export_endpoint, props, true)
  }

  const Popup = ({ children, onClose }) => {
    const popupRef = useRef(null)

    useEffect(() => {
      const handleClick = (event) => {
        if (popupRef.current && !popupRef.current.contains(event.target)) {
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
              <em>Packet</em> will generate a download packet and provide a link below and via
              email. Use for large datasets.
            </small>
          </p>
        </div>
      </div>
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
                onClick={props.submitToGalaxy}
              />
            )}
            {window.otu_search_config.galaxy_integration && (
              <ExportDataButton
                id="ExportKrona"
                size="sm"
                octicon="graph"
                text="Export Data to Galaxy Australia for Krona Taxonomic Abundance Graph"
                disabled={isGalaxySubmissionDisabled()}
                onClick={props.workflowOnGalaxy}
              />
            )}
          </div>
          <OtuExportBox state={props.otuExport} clear={props.clearOtuExport} />
        </CardHeader>
        <CardBody>
          <AlertBoxes alerts={props.galaxy.alerts} clearAlerts={props.clearGalaxyAlert} />
          <AlertBoxes alerts={props.tips.alerts} clearAlerts={props.clearTips} />
          <SearchResultsTable
            metagenome={props.metaxaAmpliconSelected}
            krona_func={(cell_props) => krona_button(cell_props, props.openKronaModal)}
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

const _MetagenomeSearchResultsCard = (props) => {
  const exportCSVOnlyContextualMetagenome = () => {
    download(window.otu_search_config.export_endpoint, props, true)
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
              onClick={props.openMetagenomeModalSearch}
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
          <AlertBoxes alerts={props.tips.alerts} clearAlerts={props.clearTips} />
          <SearchResultsTable
            cell_func={(cell_props) => cell_button(cell_props, props.openMetagenomeModal)}
            krona_func={(cell_props) => krona_button(cell_props, props.openKronaModal)}
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

function mapStateToProps(state) {
  const selectedAmpliconId = state.searchPage.filters.selectedAmplicon.value
  const metaxaOption = state.referenceData.amplicons.values.find((x) =>
    x.value.startsWith(metaxaAmpliconStringMatch)
  )
  const metaxaOptionId = !!metaxaOption ? metaxaOption.id : undefined

  return {
    ckanAuthToken: state.auth.ckanAuthToken,
    galaxy: state.searchPage.galaxy,
    tips: state.searchPage.tips,
    metaxaAmpliconSelected: metaxaOptionId === selectedAmpliconId,
    describeSearch: () => describeSearch(state),
    otuExport: state.searchPage.otuExport,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      submitToGalaxy,
      workflowOnGalaxy,
      clearGalaxyAlert,
      clearTips,
      showPhinchTip,
      openKronaModal,
      runOtuExport,
    },
    dispatch
  )
}

export const SearchResultsCard = connect(mapStateToProps, mapDispatchToProps)(_SearchResultsCard)

function mapMgDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      clearTips,
      showPhinchTip,
      openMetagenomeModalSearch,
      openMetagenomeModal,
      runOtuExport,
    },
    dispatch
  )
}

export const MetagenomeSearchResultsCard = connect(
  mapStateToProps,
  mapMgDispatchToProps
)(_MetagenomeSearchResultsCard)
