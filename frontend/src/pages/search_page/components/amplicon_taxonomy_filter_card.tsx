import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Button, Card, CardBody, CardFooter, CardHeader, Row, Col, UncontrolledTooltip } from 'reactstrap'

import { fetchReferenceData } from '../../../reducers/reference_data/reference_data'
import { selectTrait } from '../reducers/trait'
import { preselectAmplicon, getAmpliconFilter } from '../reducers/amplicon'
import { clearSearchResults } from  '../reducers/search'
import { EmptyOperatorAndValue } from '../reducers/types'
import { fetchTraits } from '../../../reducers/reference_data/traits'
import { clearAllTaxonomyFilters, updateTaxonomyDropDowns } from '../reducers/taxonomy'
import Octicon from '../../../components/octicon'
import TraitFilter from './trait_filter'
import AmpliconFilter from './amplicon_filter'
import {
  TaxonomySelector,
  TaxonomyDropDowns
} from './taxonomy_filters'

export const AmpliconFilterInfo =
  'Abundance matrices are derived from sequencing using one of 5 amplicons targeting Bacteria, Archaea, ' +
  'Eukaryotes (v4 and v9) and Fungi. To filter data from a single amplicon select that amplicon here. ' +
  'Note that selecting an amplicon with no further taxonomy selection will return all sequences ' +
  'resulting from that assay, including non-target. Selecting, for example, "Kingdom = Bacteria" will ' +
  'remove non-target sequences.'
export const TaxonomyFilterInfo =
  'Taxonomy is assigned according to the currently selected taxonomy database and method. ' +
  'NN=nearest neighbour (without consensus), Sklearn=sklearn bayesian, wang = rdp_bayesian.'
  export const TraitFilterInfo =
  'Traits are assigned using FAPROTAX [v1.2.4] based on SILVA [v132] taxonomy for Bacteria and Archaea 16S. ' +
  'Traits are assigned based on Guild field from FUNGuild [v1.2] using UNITE_SH [v8] taxonomy for ITS regions.'
export const TaxonomyNoAmpliconInfo =
  'Select Amplicon to filter taxonomy'
const TaxonomySourceInfo = "Selects the database and method used for taxonomy classification"


class TaxonomyFilterCard extends React.Component<any> {

  prevAmplicon = {...EmptyOperatorAndValue}

  constructor(props) {
    super(props)
    this.clearFilters = this.clearFilters.bind(this)
  }

  componentDidMount() {
    this.prevAmplicon = {...EmptyOperatorAndValue}
    this.props.preselectAmplicon(this.props.metagenomeAmplicon)
    this.props.clearSearchResults()
    this.props.fetchReferenceData()
  }

  componentDidUpdate() {
    // (re)fetch taxonomy and traits when the amplicon selection becomes available or changes
    if (this.props.amplicons.values.length > 0 &&
      this.props.selectedAmplicon.value !== '' &&
      (this.prevAmplicon.value !== this.props.selectedAmplicon.value ||
        this.prevAmplicon.operator !== this.props.selectedAmplicon.operator)) {
      this.prevAmplicon = { ...this.props.selectedAmplicon }
      this.props.fetchTraits()
      this.props.selectTrait('')
      this.props.updateTaxonomy()
    }
  }

  public render() {
    const children = React.Children.toArray(this.props.children)
    return (
      <Card>
        <CardHeader tag="h5">
          { this.props.cardHeader }
        </CardHeader>
        <CardBody className="filters">
          { children.length? children[0] : null }
          <h5 className="text-center">Taxonomy <span id="taxonomyTip1">
            <Octicon name="info" />
          </span></h5>
          <UncontrolledTooltip target="taxonomyTip1" placement="auto">
            {TaxonomyFilterInfo}
          </UncontrolledTooltip>

          { children.length? children[1] : null}

          <TaxonomySelector info={TaxonomySourceInfo} placeholder="Select database and method&hellip;" />
          {TaxonomyDropDowns}
          <hr />
          <TraitFilter info={TraitFilterInfo} />
        </CardBody>
        <CardFooter className="text-center">
          <Button color="warning" onClick={this.clearFilters}>
            Clear
          </Button>
        </CardFooter>
      </Card>
    )
  }

  public clearFilters() {
    this.props.clearAllTaxonomyFilters()
    this.prevAmplicon = { ...EmptyOperatorAndValue }
  }
}


function mapStateToProps(state, ownProps) {
  return {
    amplicons: state.referenceData.amplicons,
    traits: state.referenceData.traits,
    selectedAmplicon:  getAmpliconFilter(state),
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      fetchReferenceData,
      updateTaxonomy: updateTaxonomyDropDowns(''),
      fetchTraits,
      preselectAmplicon,
      clearSearchResults,
      selectTrait,
      clearAllTaxonomyFilters
    },
    dispatch
  )
}

const ConnectedTaxonomyFilterCard =  connect(
  mapStateToProps,
  mapDispatchToProps
)(TaxonomyFilterCard)


export function AmpliconTaxonomyFilterCard() {
  return (
    <ConnectedTaxonomyFilterCard
      metagenomeAmplicon=''
      cardHeader='Filter by amplicon, taxonomy and traits'>

      <React.Fragment>
        <AmpliconFilter info={AmpliconFilterInfo} />
        <hr />
      </React.Fragment>

      <Row>
        <Col>
          <p className="text-center">
            {TaxonomyNoAmpliconInfo}
          </p>
        </Col>
      </Row>
    </ConnectedTaxonomyFilterCard>
  )
}

export function MetagenomeTaxonomyFilterCard() {
  return (
    <ConnectedTaxonomyFilterCard
      metagenomeAmplicon={window.otu_search_config.metagenome_amplicon}
      cardHeader='Filter by taxonomy and traits' />
  )
}
