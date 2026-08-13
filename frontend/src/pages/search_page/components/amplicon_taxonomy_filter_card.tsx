import React, { useEffect, useRef } from 'react'
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
import { useAppDispatch, useAppSelector } from 'hooks/redux'

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
import { type OperatorAndValue } from 'search'

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

const TaxonomyFilterCard = ({ metagenomeMode }: { metagenomeMode: boolean }) => {
  const dispatch = useAppDispatch()

  const prevAmplicon = useRef<OperatorAndValue>({ ...EmptyOperatorAndValue })

  const amplicons = useAppSelector((state) => state.referenceData.amplicons)

  const selectedAmplicon = useAppSelector(getAmpliconFilter)

  const mismatchState = useAppSelector((state) => {
    let mismatch = false
    let valueAmplicon
    let valueR1
    let nameR1

    try {
      const optionsAmplicons = state.referenceData.amplicons.values
      const optionsTaxonomyR1 = state.searchPage.filters.taxonomy.r1

      const textAmplicon = optionsAmplicons.find((x) => x.id === selectedAmplicon.value)

      const textR1 = optionsTaxonomyR1.options.find(
        (x) => x.id === optionsTaxonomyR1.selected.value,
      )

      if (textAmplicon && textR1) {
        valueAmplicon = textAmplicon.value
        valueR1 = textR1.value
        nameR1 = state.referenceData.ranks.rankLabels.r1

        const matchAmplicon = valueAmplicon.split('_').map((x) => x.toLowerCase().substring(0, 4))

        const matchR1 = valueR1.split('__')[1].toLowerCase().substring(0, 4)

        mismatch = matchAmplicon.indexOf(matchR1) === -1
      }
    } catch {
      mismatch = false
    }

    return {
      mismatch,
      valueAmplicon,
      valueR1,
      nameR1,
    }
  })

  useEffect(() => {
    prevAmplicon.current = { ...EmptyOperatorAndValue }

    dispatch(setMetagenomeMode(metagenomeMode))
    dispatch(clearSearchResults())
    dispatch(fetchReferenceData())
  }, [dispatch, metagenomeMode])

  // (re)fetch taxonomy and traits when the amplicon selection becomes available or changes
  useEffect(() => {
    if (
      amplicons.values.length > 0 &&
      selectedAmplicon.value !== '' &&
      (prevAmplicon.current.value !== selectedAmplicon.value ||
        prevAmplicon.current.operator !== selectedAmplicon.operator)
    ) {
      prevAmplicon.current = { ...selectedAmplicon }

      dispatch(fetchTraits())
      dispatch(selectTrait(''))
      dispatch(updateTaxonomyDropDowns(''))
    }
  }, [dispatch, amplicons.values, selectedAmplicon])

  const clearFilters = () => {
    dispatch(clearAllTaxonomyFilters())
    prevAmplicon.current = { ...EmptyOperatorAndValue }
  }

  return (
    <Card>
      <CardHeader tag="h5">
        <span style={{ lineHeight: '2rem' }}>Filter by amplicon, taxonomy and traits</span>
      </CardHeader>
      <CardBody className="filters">
        <AmpliconFilter />
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
                  paddingLeft: '0.45rem',
                  paddingRight: '0.45rem',
                  paddingTop: '0.15rem',
                  paddingBottom: '0.15rem',
                }}
                onClick={() => dispatch(openTaxonomySearchModal())}
              >
                search for a taxonomy
              </Button>
            </p>
            {mismatchState.mismatch && (
              <p className="text-center" style={{ fontSize: '13px' }}>
                Note: potential mismatch between Amplicon ({mismatchState.valueAmplicon}) and{' '}
                {mismatchState.nameR1} ({mismatchState.valueR1})
              </p>
            )}
          </Col>
        </Row>

        {selectedAmplicon.value !== '' && (
          <>
            <TaxonomySelector info={TaxonomySourceInfo} />
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

export const AmpliconTaxonomyFilterCard = TaxonomyFilterCard
