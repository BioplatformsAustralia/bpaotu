import { last } from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { Alert, Button, Card, CardBody, CardHeader  } from 'reactstrap'
import Octicon from '../../../components/octicon'
import { describeSearch } from '../reducers/search'
import { clearGalaxyAlert, submitToGalaxy, workflowOnGalaxy } from '../reducers/submit_to_galaxy'
import { clearTips, showPhinchTip } from '../reducers/tips'
import { openMetagenomeModal, openBulkMetagenomeModal } from '../reducers/metagenome_modal'
import { GalaxySubmission } from '../reducers/types'
import SamplesMapModal from './samples_map_modal'
import SamplesGraphModal from './samples_graph_modal'
import MetagenomeModal from './metagenome_modal'
import SearchResultsTable from './search_results_table'

const HeaderButton = props => (
  <Button
    id={props.text}
    size="sm"
    style={{ marginRight: 10 }}
    outline={true}
    color="primary"
    disabled={props.disabled}
    onClick={props.onClick}
    data-tut={props.text}
    title={props.disabled?'Select Amplicon to '+props.text:''}
  >
    {props.octicon ? (
      <span>
        <Octicon name={props.octicon} />
        &nbsp;
      </span>
    ) : (
      ''
    )}
    {props.text}
  </Button>
)

const wrapText = text => ({ __html: text })

const AlertBoxes = props => (
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
  <Button onClick={() => {openMetagenomeModal(cell_props.row.sample_id)}}>{cell_props.value}</Button>
)

const download = (baseURL, props, onlyContextual=false) => {
  const params = new URLSearchParams()
  params.set('token', props.ckanAuthToken)
  params.set('q', JSON.stringify(props.describeSearch()))
  params.set('only_contextual', onlyContextual?'t':'f')

  const url = `${baseURL}?${params.toString()}`
  window.open(url)
}

class _SearchResultsCard extends React.Component<any, any> {

  constructor(props) {
    super(props)
    this.exportCSV = this.exportCSV.bind(this)
    this.exportCSVOnlyContextual = this.exportCSVOnlyContextual.bind(this)
    this.exportBIOM = this.exportBIOM.bind(this)
  }

  public render() {
    /*
        TODO
        The UI for the galaxy submission will probably change, so showing the history link inside the Alert box might not
        be necessary later on.
        In case, we keep this code, we should probably use something like sanitize-html to make sure we don't end up with
        anything dangerous in the text.
        */
    return (
      <div>
        <Card>
          <CardHeader>
            <div className="text-center">
              <HeaderButton octicon="desktop-download" text="Download OTU and Contextual Data (CSV)" onClick={this.exportCSV} />
              <HeaderButton octicon="desktop-download" text="Download Contextual Data only (CSV)" onClick={this.exportCSVOnlyContextual} />
              <HeaderButton octicon="desktop-download" text="Download BIOM format (Phinch compatible)" onClick={this.exportBIOM} />
              {window.otu_search_config.galaxy_integration && (
                <HeaderButton
                  octicon="clippy"
                  text="Export Data to Galaxy Australia for further analysis"
                  disabled={this.isGalaxySubmissionDisabled()}
                  onClick={this.props.submitToGalaxy}
                />
              )}
              {window.otu_search_config.galaxy_integration && (
                <HeaderButton
                  octicon="graph"
                  text="Export Data to Galaxy Australia for Krona Taxonomic Abundance Graph"
                  disabled={this.isGalaxySubmissionDisabled()}
                  onClick={this.props.workflowOnGalaxy}
                />
              )}
            </div>
          </CardHeader>
          <CardBody>
            <AlertBoxes alerts={this.props.galaxy.alerts} clearAlerts={this.props.clearGalaxyAlert} />
            <AlertBoxes alerts={this.props.tips.alerts} clearAlerts={this.props.clearTips} />
            <SearchResultsTable />
          </CardBody>
        </Card>

        <SamplesMapModal />
        <SamplesGraphModal />
      </div>
    )
  }

  public isGalaxySubmissionDisabled() {
    if (this.props.galaxy.isSubmitting) {
      return true
    }
    const lastSubmission: GalaxySubmission = last(this.props.galaxy.submissions)
    return lastSubmission && !lastSubmission.finished
  }

  public exportBIOM() {
    this.props.showPhinchTip();
    download(window.otu_search_config.export_biom_endpoint, this.props)
  }

  public exportCSV() {
    download(window.otu_search_config.export_endpoint, this.props)
  }

  public exportCSVOnlyContextual() {
    download(window.otu_search_config.export_endpoint, this.props, true)
  }
}

const _MetagenomeSearchResultsCard = (props) => (
  <div>
    <Card>
      <CardHeader>
        <div className="text-center">
          <HeaderButton octicon="desktop-download"
            text={`Download ZIP archive of selected metagenome files for selected samples`}
            onClick={() => { props.openBulkMetagenomeModal() }} />
          <HeaderButton octicon="desktop-download"
            text="Download Contextual Data only (CSV)"
            onClick={() => { download(window.otu_search_config.export_endpoint, props, true)}} />
        </div>
      </CardHeader>
      <CardBody>
        <AlertBoxes alerts={props.tips.alerts} clearAlerts={props.clearTips} />
        <SearchResultsTable cell_func={(cell_props) => cell_button(cell_props, props.openMetagenomeModal)} />
      </CardBody>
    </Card>

    <SamplesMapModal />
    <SamplesGraphModal />
    <MetagenomeModal />
  </div>
)

function mapStateToProps(state) {
  return {
    ckanAuthToken: state.auth.ckanAuthToken,
    galaxy: state.searchPage.galaxy,
    tips: state.searchPage.tips,
    describeSearch: () => describeSearch(state)
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      submitToGalaxy,
      workflowOnGalaxy,
      clearGalaxyAlert,
      clearTips,
      showPhinchTip
    },
    dispatch
  )
}

export const SearchResultsCard =  connect(
  mapStateToProps,
  mapDispatchToProps
)(_SearchResultsCard)

function mapMgDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      clearTips,
      showPhinchTip,
      openMetagenomeModal: (sample_id) => (openMetagenomeModal(sample_id)),
      openBulkMetagenomeModal
    },
    dispatch
  )
}

export const MetagenomeSearchResultsCard = connect(
  mapStateToProps,
  mapMgDispatchToProps
)(_MetagenomeSearchResultsCard)
