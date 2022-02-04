import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { fetchAmplicons} from '../../../reducers/reference_data/amplicons'
import { selectAmplicon, getDefaultAmplicon } from '../reducers/amplicon'
import { selectTrait } from '../reducers/trait'

import { fetchTraits } from '../../../reducers/reference_data/traits'

import { Button, Card, CardBody, CardFooter, CardHeader, Row, Col, UncontrolledTooltip } from 'reactstrap'
import { clearAllTaxonomyFilters, fetchTaxonomySources } from '../reducers/taxonomy'

import Octicon from '../../../components/octicon'
import TraitFilter from './trait_filter'
import AmpliconFilter from './amplicon_filter'
import {
  TaxonomySelector,
  TaxonomyDropDowns
} from './taxonomy_filters'

export const AmpliconFilterInfo =
  'Abundance matrices are derived from sequencing using one of 5 amplicons targeting Bacteria, Archaea, Eukaryotes (v4 and v9) and Fungi. To filter data from a single amplicon select that amplicon here. Note that selecting an amplicon with no further taxonomy selection will return all sequences resulting from that assay, including non-target. Selecting, for example, "Kingdom = Bacteria" will remove non-target sequences.'
export const TaxonomyFilterInfo =
  'Taxonomy is assigned according to the currently selected taxonomy database and method'
  export const TraitFilterInfo =
  'Traits are assigned using FAPROTAX [v1.2.4] based on SILVA [v132] taxonomy for Bacteria and Archaea 16S. Traits are assigned based on Guild field from FUNGuild [v1.2] using UNITE_SH [v8] taxonomy for ITS regions.'
export const TaxonomyNoAmpliconInfo =
  'Select Amplicon to filter taxonomy'
const TaxonomySourceInfo = "Selects the database and method used for taxonomy classification"

export class AmpliconTaxonomyFilterCard extends React.Component<any> {
  constructor(props) {
    super(props)
    this.clearFilters = this.clearFilters.bind(this)
  }

  initAmplicon() {
    const defaultAmplicon = getDefaultAmplicon(this.props.amplicons.values)
    if(!this.props.selectedAmplicon.value && defaultAmplicon) {
      this.props.selectAmplicon(defaultAmplicon.id)
      this.props.fetchTraits()
      this.props.selectTrait('')
      this.props.fetchTaxonomySources()
    }
  }

  componentDidMount() {
    this.props.fetchAmplicons()
  }

  componentDidUpdate() {
    this.initAmplicon()
  }

  public render() {
    return (
      <Card>
        <CardHeader tag="h5">
          Filter by Amplicon, Taxonomy and Traits
        </CardHeader>
        <CardBody className="filters">
          <AmpliconFilter info={AmpliconFilterInfo} />

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
    this.initAmplicon()
  }
}

function mapStateToProps(state) {
  return {
    amplicons: state.referenceData.amplicons,
    traits: state.referenceData.traits,
    selectedAmplicon: state.searchPage.filters.selectedAmplicon
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      fetchAmplicons,
      fetchTaxonomySources,
      fetchTraits,
      selectAmplicon,
      selectTrait,
      clearAllTaxonomyFilters
    },
    dispatch
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AmpliconTaxonomyFilterCard)
