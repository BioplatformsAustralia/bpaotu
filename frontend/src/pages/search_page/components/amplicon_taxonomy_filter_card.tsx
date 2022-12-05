import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Button, Card, CardBody, CardFooter, CardHeader, Row, Col, UncontrolledTooltip } from 'reactstrap'

import { fetchReferenceData } from '../../../reducers/reference_data/reference_data'
import { selectTrait } from '../reducers/trait'
import { setMetagenomeMode, getAmpliconFilter } from '../reducers/amplicon'
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
   'Taxonomy is assigned according to the currently selected taxonomy database ' +
   'and method. Methods may include: NN=nearest neighbour (without consensus), ' +
   'SKlearn=sklearn bayesian, wang=rdp_bayesian. Further information on ' +
   'taxonomy assignment can be found at: ' +
   'https://github.com/AusMicrobiome/amplicon/tree/master/docs'

export const TraitFilterInfo =
  'Traits are assigned using FAPROTAX [v1.2.4] based on SILVA [v132] taxonomy for Bacteria and Archaea 16S. ' +
  'Traits are assigned based on Guild field from FUNGuild [v1.2] using UNITE_SH [v8] taxonomy for ITS regions.'

export const TaxonomyNoAmpliconInfo =
  'Select Amplicon to filter taxonomy'

const TaxonomySourceInfo =
  'Selects the database and method used for taxonomy classification. Methods may ' +
  'include: NN=nearest neighbour (without consensus), SKlearn=sklearn bayesian, ' +
  'wang=rdp_bayesian. Further information on taxonomy assignment can be found ' +
  'at: https://github.com/AusMicrobiome/amplicon/tree/master/docs'

class TaxonomyFilterCard extends React.Component<any> {

  prevAmplicon = {...EmptyOperatorAndValue}

  constructor(props) {
    super(props)
    this.clearFilters = this.clearFilters.bind(this)
  }

  componentDidMount() {
    this.prevAmplicon = {...EmptyOperatorAndValue}
    this.props.setMetagenomeMode(this.props.metagenomeMode)
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
    return (
      <Card>
        <CardHeader tag="h5">
          Filter by amplicon, taxonomy and traits
        </CardHeader>
        <CardBody className="filters">
          <AmpliconFilter
            info={AmpliconFilterInfo}
            metagenomeMode={this.props.metagenomeMode}
          />
          <hr />
          <h5 className="text-center">Taxonomy <span id="taxonomyTip1">
            <Octicon name="info" />
          </span></h5>
          <UncontrolledTooltip target="taxonomyTip1" placement="auto">
            {TaxonomyFilterInfo}
          </UncontrolledTooltip>
          <Row>
            <Col>
              <p className="text-center">
                {TaxonomyNoAmpliconInfo}
              </p>
            </Col>
          </Row>
          {(this.props.selectedAmplicon.value !== '') &&
            <>
              <TaxonomySelector info={TaxonomySourceInfo} placeholder="Select database and method&hellip;" />
              {TaxonomyDropDowns}
              <hr />
              <TraitFilter info={TraitFilterInfo} />
            </>}
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
      setMetagenomeMode,
      clearSearchResults,
      selectTrait,
      clearAllTaxonomyFilters
    },
    dispatch
  )
}

export const AmpliconTaxonomyFilterCard =  connect(
  mapStateToProps,
  mapDispatchToProps
)(TaxonomyFilterCard)
