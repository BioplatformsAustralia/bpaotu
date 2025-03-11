import React, { useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Row,
  Col,
  UncontrolledTooltip,
} from 'reactstrap'

import Octicon from 'components/octicon'
import { fetchReferenceData } from 'reducers/reference_data/reference_data'
import { fetchTraits } from 'reducers/reference_data/traits'

import { setMetagenomeMode, getAmpliconFilter } from '../reducers/amplicon'
import { clearSearchResults } from '../reducers/search'
import { clearAllTaxonomyFilters, updateTaxonomyDropDowns } from '../reducers/taxonomy'
import { openTaxonomySearchModal } from '../reducers/taxonomy_search_modal'

import { selectTrait } from '../reducers/trait'
import { EmptyOperatorAndValue } from '../reducers/types'

import TraitFilter from './trait_filter'
import AmpliconFilter from './amplicon_filter'
import TaxonomySearchModal from './taxonomy_search_modal'
import { TaxonomySelector, TaxonomyDropDowns } from './taxonomy_filters'

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

export const TaxonomyNoAmpliconInfo = 'Select Amplicon to filter taxonomy'

const TaxonomySourceInfo =
  'Selects the database and method used for taxonomy classification. Methods may ' +
  'include: NN=nearest neighbour (without consensus), SKlearn=sklearn bayesian, ' +
  'wang=rdp_bayesian. Further information on taxonomy assignment can be found ' +
  'at: https://github.com/AusMicrobiome/amplicon/tree/master/docs'

const TaxonomyFilterCard = (props) => {
  const prevAmplicon = useRef({ ...EmptyOperatorAndValue })

  useEffect(() => {
    prevAmplicon.current = { ...EmptyOperatorAndValue }
    props.setMetagenomeMode(props.metagenomeMode)
    props.clearSearchResults()
    props.fetchReferenceData()
  }, [])

  // (re)fetch taxonomy and traits when the amplicon selection becomes available or changes
  useEffect(() => {
    if (
      props.amplicons.values.length > 0 &&
      props.selectedAmplicon.value !== '' &&
      (prevAmplicon.current.value !== props.selectedAmplicon.value ||
        prevAmplicon.current.operator !== props.selectedAmplicon.operator)
    ) {
      prevAmplicon.current = { ...props.selectedAmplicon }
      props.fetchTraits()
      props.selectTrait('')
      props.updateTaxonomy()
    }
  }, [props.selectedAmplicon, props.amplicons.values])

  const clearFilters = () => {
    props.clearAllTaxonomyFilters()
    prevAmplicon.current = { ...EmptyOperatorAndValue }
  }

  return (
    <Card>
      <CardHeader tag="h5">Filter by amplicon, taxonomy and traits</CardHeader>
      <CardBody className="filters">
        <AmpliconFilter info={AmpliconFilterInfo} metagenomeMode={props.metagenomeMode} />
        <hr />
        <h5 className="text-center">
          Taxonomy{' '}
          <span id="taxonomyTip1">
            <Octicon name="info" />
          </span>
        </h5>
        <UncontrolledTooltip target="taxonomyTip1" placement="auto">
          {TaxonomyFilterInfo}
        </UncontrolledTooltip>
        <Row>
          <Col>
            <p className="text-center">
              {TaxonomyNoAmpliconInfo}, or{' '}
              <Button
                style={{
                  marginTop: -4,
                  marginLeft: 2,
                  paddingLeft: '0.5rem',
                  paddingRight: '0.5rem',
                  paddingTop: '0.3rem',
                  paddingBottom: '0.3rem',
                }}
                onClick={props.openTaxonomySearchModal}
              >
                search for a taxonomy
              </Button>
            </p>
          </Col>
        </Row>

        {props.selectedAmplicon.value !== '' && (
          <>
            <TaxonomySelector
              info={TaxonomySourceInfo}
              placeholder="Select database and method&hellip;"
            />
            {TaxonomyDropDowns}
            <hr />
            <TraitFilter info={TraitFilterInfo} />
          </>
        )}
      </CardBody>
      <CardFooter className="text-center">
        <Button color="warning" onClick={clearFilters}>
          Clear
        </Button>
      </CardFooter>
      <TaxonomySearchModal />
    </Card>
  )
}

function mapStateToProps(state, ownProps) {
  return {
    amplicons: state.referenceData.amplicons,
    traits: state.referenceData.traits,
    selectedAmplicon: getAmpliconFilter(state),
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      fetchReferenceData,
      updateTaxonomy: updateTaxonomyDropDowns(''),
      fetchTraits,
      setMetagenomeMode,
      clearSearchResults,
      selectTrait,
      clearAllTaxonomyFilters,
      openTaxonomySearchModal,
    },
    dispatch
  )
}

export const AmpliconTaxonomyFilterCard = connect(
  mapStateToProps,
  mapDispatchToProps
)(TaxonomyFilterCard)
