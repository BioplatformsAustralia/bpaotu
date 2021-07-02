import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { fetchAmplicons} from '../../../reducers/reference_data/amplicons'
import { selectAmplicon } from '../reducers/amplicon'

import { Button, Card, CardBody, CardFooter, CardHeader, Row, Col, UncontrolledTooltip } from 'reactstrap'
import { clearAllTaxonomyFilters, fetchKingdoms } from '../reducers/taxonomy'

import { find } from 'lodash'
import Octicon from '../../../components/octicon'
import AmpliconFilter from './amplicon_filter'
import {
  ClassFilter,
  FamilyFilter,
  GenusFilter,
  KingdomFilter,
  OrderFilter,
  PhylumFilter,
  SpeciesFilter
} from './taxonomy_filters'

export const AmpliconFilterInfo =
  'Abundance matrices are derived from sequencing using one of 5 amplicons targeting Bacteria, Archaea, Eukaryotes (v4 and v9) and Fungi.  To filter data from a single amplicon select that amplicon here.  To search all amplicons for a taxa select "all".  Note the "all" search will return non-target sequences as well as target, for example searching "Amplicon = all" + "Kingdom = Bacteria" will return all sequences classified as bacteria in all assays.'
export const TaxonomyFilterInfo =
  'Taxonomy is assigned with bayesian classifier using SILVA v138 for rRNA genes and UNITE_SH v8 for ITS regions.'
export const TaxonomyNoAmpliconInfo = 
  'Select Amplicon to filter taxonomy'

export class AmpliconTaxonomyFilterCard extends React.Component<any> {
  constructor(props) {
    super(props)
    this.clearFilters = this.clearFilters.bind(this)
  }

  initAmplicon() {
    const defaultAmplicon = find(this.props.amplicons.values, amplicon => amplicon.value === window.otu_search_config.default_amplicon)
    if(defaultAmplicon)
      this.props.selectAmplicon(defaultAmplicon.id)
  }
  
  componentDidMount() {
    this.props.fetchAmplicons()
  }

  componentDidUpdate() {
    this.initAmplicon()
    this.props.fetchKingdoms()
  }

  public render() {
    return (
      <Card>
        <CardHeader>
          Filter by Amplicon{' '}
          <span id="ampliconTip">
            <Octicon name="info" />
          </span>
          <UncontrolledTooltip target="ampliconTip" placement="auto">
            {AmpliconFilterInfo}
          </UncontrolledTooltip>{' '}
          and Taxonomy{' '}
          <span id="taxonomyTip">
            <Octicon name="info" />
          </span>
          <UncontrolledTooltip target="taxonomyTip" placement="auto">
            {TaxonomyFilterInfo}
          </UncontrolledTooltip>
        </CardHeader>
        <CardBody className="filters">
          <AmpliconFilter />

          <hr />
          <h5 className="text-center">Taxonomy</h5>
          <Row>
            <Col>
              <p className="text-center">
              {TaxonomyNoAmpliconInfo}
              </p>
            </Col>
          </Row>

          <KingdomFilter />
          <PhylumFilter />
          <ClassFilter />
          <OrderFilter />
          <FamilyFilter />
          <GenusFilter />
          <SpeciesFilter />
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
    this.props.fetchAmplicons()
    this.initAmplicon()
    this.props.fetchKingdoms()
  }
}

function mapStateToProps(state) {
  return {
    amplicons: state.referenceData.amplicons,
  }
}

function mapDispatchToProps(dispatch: any) {
  return bindActionCreators(
    {
      fetchAmplicons,
      fetchKingdoms,
      selectAmplicon,
      clearAllTaxonomyFilters
    },
    dispatch
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AmpliconTaxonomyFilterCard)
