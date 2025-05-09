import { last } from 'lodash'
import * as React from 'react'
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

import { metaxaAmpliconStringMatch } from 'app/constants'

import BlastModal from './blast_modal'
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
      console.log('cell_button', 'cell_props', cell_props)
      console.log('cell_button', 'openMetagenomeModal', openMetagenomeModal)
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

const _SearchResultsCard = (props) => {
  const isGalaxySubmissionDisabled = () => {
    if (props.galaxy.isSubmitting) {
      return true
    }

    const lastSubmission: GalaxySubmission = last(props.galaxy.submissions)
    return lastSubmission && !lastSubmission.finished
  }

  const exportBIOM = () => {
    props.showPhinchTip()
    download(window.otu_search_config.export_biom_endpoint, props)
  }

  const exportCSV = () => {
    download(window.otu_search_config.export_endpoint, props)
  }

  const exportCSVOnlyContextual = () => {
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
            metagenome={true}
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
