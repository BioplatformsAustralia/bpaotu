import { last } from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Alert, Button, Card, CardBody, CardHeader } from 'reactstrap'

import { useAnalytics } from 'use-analytics'
import { ExportDataButton } from 'components/export_data_button'

import { describeSearch } from '../reducers/search'
import { clearGalaxyAlert, submitToGalaxy, workflowOnGalaxy } from '../reducers/submit_to_galaxy'
import { clearTips, showPhinchTip } from '../reducers/tips'
import { openMetagenomeModal, openMetagenomeModalSearch } from '../reducers/metagenome_modal'
import { GalaxySubmission } from '../reducers/types'

import BlastModal from './blast_modal'
import SamplesMapModal from './samples_map_modal'
import SamplesGraphModal from './samples_graph_modal'
import SamplesComparisonModal from './samples_comparison_modal'
import MetagenomeModal from './metagenome_modal'
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

const download = (baseURL, props, onlyContextual = false) => {
  const params = new URLSearchParams()
  params.set('token', props.ckanAuthToken)
  params.set('q', JSON.stringify(props.describeSearch()))
  params.set('only_contextual', onlyContextual ? 't' : 'f')

  const url = `${baseURL}?${params.toString()}`
  window.open(url)
}

const _SearchResultsCard = (props) => {
  const { track } = useAnalytics()

  const isGalaxySubmissionDisabled = () => {
    if (props.galaxy.isSubmitting) {
      return true
    }

    const lastSubmission: GalaxySubmission = last(props.galaxy.submissions)
    return lastSubmission && !lastSubmission.finished
  }

  const exportBIOM = () => {
    track('otu_export_BIOM')

    props.showPhinchTip()
    download(window.otu_search_config.export_biom_endpoint, props)
  }

  const exportCSV = () => {
    track('otu_export_CSV')

    download(window.otu_search_config.export_endpoint, props)
  }

  const exportCSVOnlyContextual = () => {
    track('otu_export_CSV_only_contextual')

    download(window.otu_search_config.export_endpoint, props, true)
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="text-center">
            <ExportDataButton
              id="ExportOtuContextual"
              size="sm"
              octicon="desktop-download"
              text="Download OTU and Contextual Data (CSV)"
              onClick={exportCSV}
            />
            <ExportDataButton
              id="ExportContextualOnly"
              size="sm"
              octicon="desktop-download"
              text="Download Contextual Data only (CSV)"
              onClick={exportCSVOnlyContextual}
            />
            <ExportDataButton
              id="ExportBIOM"
              size="sm"
              octicon="desktop-download"
              text="Download BIOM format (Phinch compatible)"
              onClick={exportBIOM}
            />
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
        </CardHeader>
        <CardBody>
          <AlertBoxes alerts={props.galaxy.alerts} clearAlerts={props.clearGalaxyAlert} />
          <AlertBoxes alerts={props.tips.alerts} clearAlerts={props.clearTips} />
          <SearchResultsTable />
        </CardBody>
      </Card>

      <BlastModal />
      <SamplesMapModal />
      <SamplesGraphModal />
      <SamplesComparisonModal />
    </div>
  )
}

const _MetagenomeSearchResultsCard = (props) => {
  const { track } = useAnalytics()

  const exportCSVOnlyContextualMetagenome = () => {
    track('otu_export_CSV_only_contextual_metagenome')

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
          />
        </CardBody>
      </Card>

      <BlastModal />
      <SamplesMapModal />
      <SamplesGraphModal />
      <SamplesComparisonModal />
      <MetagenomeModal />
    </div>
  )
}

function mapStateToProps(state) {
  return {
    ckanAuthToken: state.auth.ckanAuthToken,
    galaxy: state.searchPage.galaxy,
    tips: state.searchPage.tips,
    describeSearch: () => describeSearch(state),
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
    },
    dispatch
  )
}

export const MetagenomeSearchResultsCard = connect(
  mapStateToProps,
  mapMgDispatchToProps
)(_MetagenomeSearchResultsCard)
