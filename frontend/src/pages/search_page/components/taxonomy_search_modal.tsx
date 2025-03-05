import { find } from 'lodash'
import * as React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createAction } from 'redux-actions'

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Col,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Input,
  Row,
  Table,
  Label,
  UncontrolledTooltip,
  Badge,
  Alert,
} from 'reactstrap'

import { selectAmplicon, selectAmpliconOperator } from '../reducers/amplicon'
import { updateTaxonomyDropDowns } from '../reducers/taxonomy'
import {
  handleTaxonomySearchString,
  runTaxonomySearch,
  // setTaxonomy,
  closeTaxonomySearchModal,
} from '../reducers/taxonomy_search_modal'

const TaxonomySearchModal = (props) => {
  // console.log('TaxonomySearchModal', 'props', props)

  const { isOpen, isLoading, searchString, results, closeTaxonomySearchModal } = props

  function groupByHighestCommonRank(taxonomies) {
    const groups = {}
    taxonomies.forEach(({ taxonomy }) => {
      let key

      if (taxonomy.r8.value) {
        key = [
          taxonomy.amplicon.value,
          taxonomy.taxonomy_source.value,
          taxonomy.r1.value,
          taxonomy.r2.value,
          taxonomy.r3.value,
          taxonomy.r4.value,
          taxonomy.r5.value,
          taxonomy.r6.value,
          taxonomy.r7.value,
        ].join(',')
      } else if (taxonomy.r7.value) {
        key = [
          taxonomy.amplicon.value,
          taxonomy.taxonomy_source.value,
          taxonomy.r1.value,
          taxonomy.r2.value,
          taxonomy.r3.value,
          taxonomy.r4.value,
          taxonomy.r5.value,
          taxonomy.r6.value,
        ].join(',')
      } else if (taxonomy.r6.value) {
        key = [
          taxonomy.amplicon.value,
          taxonomy.taxonomy_source.value,
          taxonomy.r1.value,
          taxonomy.r2.value,
          taxonomy.r3.value,
          taxonomy.r4.value,
          taxonomy.r5.value,
        ].join(',')
      }

      if (!groups[key]) {
        groups[key] = []
      }

      groups[key].push({ taxonomy })
    })

    // if a group only has one element, then unwind the key by one element
    // (since the matched string only occurs once, and it may be at the top level)
    const unwindGroups = (groups) => {
      const newGroups = {}
      for (const key in groups) {
        if (groups[key].length === 1) {
          const newKey = key.split(',').slice(0, -1).join(',')
          if (!newGroups[newKey]) {
            newGroups[newKey] = []
          }
          newGroups[newKey].push(...groups[key])
        } else {
          newGroups[key] = groups[key]
        }
      }
      return newGroups
    }

    let currentGroups = groups
    let previousGroups
    do {
      previousGroups = currentGroups
      currentGroups = unwindGroups(currentGroups)
    } while (Object.keys(currentGroups).length !== Object.keys(previousGroups).length)

    return currentGroups
  }

  function findCommonValuesR7(groups) {
    const commonValues = {}
    for (const key in groups) {
      const group = groups[key]
      const r7Values = new Set(group.map((taxonomy) => taxonomy.r7.value))
      // const r8Values = new Set(group.map((taxonomy) => taxonomy.r8.value))
      commonValues[key] = {
        commonR7: r7Values.size === 1 ? Array.from(r7Values)[0] : null,
        // commonR8: r8Values.size === 1 ? Array.from(r8Values)[0] : null,
      }
    }
    return commonValues
  }

  function findCommonValuesR6(groups) {
    const commonValues = {}
    for (const key in groups) {
      const group = groups[key]
      const r6Values = new Set(group.map((taxonomy) => taxonomy.r6.value))
      commonValues[key] = {
        commonR6: r6Values.size === 1 ? Array.from(r6Values)[0] : null,
      }
    }
    return commonValues
  }

  let resultsAdjusted
  if (results.length) {
    const groups = groupByHighestCommonRank(results)
    // console.log('groups', groups)

    // TODO, the object values includes everything, and needs to instead
    // filter out the dupes (deermine HCR when making the key and store elsewhere?)
    resultsAdjusted = Object.values(groups).flat()
  } else {
    resultsAdjusted = []
  }

  // console.log('resultsAdjusted', resultsAdjusted)

  // need to use the same mechanism when clicking on a slice of the taxonomy pie chart in Interactive Graph Search
  const setTaxonomy = (taxonomy) => {
    console.log('setTaxonomy', 'taxonomy', taxonomy)
    console.log('setTaxonomy', 'props', props)
    console.log('setTaxonomy', 'props.taxonomy', props.taxonomy)

    // todo, only as deep as the taxonomy goes if it is truncated to fewer levels
    props.selectAmplicon(taxonomy.amplicon.id)

    console.log('START setTaxonomy')
    props.selectTaxonomyValue('taxonomy_source', taxonomy.taxonomy_source.id)
    props.updateTaxonomyDropDown('taxonomy_source')
    props.selectTaxonomyValue('r1', taxonomy.r1.id)
    props.selectTaxonomyValue('r2', taxonomy.r2.id)
    props.selectTaxonomyValue('r3', taxonomy.r3.id)
    props.selectTaxonomyValue('r4', taxonomy.r4.id)
    props.selectTaxonomyValue('r5', taxonomy.r5.id)
    props.selectTaxonomyValue('r6', taxonomy.r6.id)
    props.selectTaxonomyValue('r7', taxonomy.r7.id)
    props.selectTaxonomyValue('r8', taxonomy.r8.id)

    // props.selectTaxonomyValueMultiple(taxonomy)
    // props.updateTaxonomyDropDown('r1')
    // props.updateTaxonomyDropDown('r2')
    // props.updateTaxonomyDropDown('r3')
    // props.updateTaxonomyDropDown('r4')
    // props.updateTaxonomyDropDown('r5')
    // props.updateTaxonomyDropDown('r6')
    // props.updateTaxonomyDropDown('r7')
    // props.updateTaxonomyDropDown('r8')

    console.log('FINISH setTaxonomy')

    // const taxa_id = find(
    //   props.taxonomy[taxa].options,
    //   (obj) => String(obj.value) === String(value)
    // ).id
    // props.selectTaxonomyValue('r2', 'p__Apicomplexa')
    // props.updateTaxonomyDropDown(taxa)
  }

  // onSelectTaxonomy taxa r2
  // onSelectTaxonomy value p__Apicomplexa

  /*
  public onSelectTaxonomy = (taxa, value) => {
    const taxa_id = find(
      this.props.taxonomy[taxa].options,
      (obj) => String(obj.value) === String(value)
    ).id
    this.props.selectTaxonomyValue(taxa, taxa_id)
    this.props.updateTaxonomyDropDown(taxa)
    this.props.fetchContextualDataForGraph()
    this.props.fetchTaxonomyDataForGraph()
  }
*/

  return (
    <Modal
      isOpen={isOpen}
      data-tut="reactour__TaxonomySearchModal"
      id="reactour__TaxonomySearchModal"
      contentClassName="modalContentStyle"
    >
      <ModalHeader
        toggle={closeTaxonomySearchModal}
        data-tut="reactour__CloseTaxonomySearchModal"
        id="CloseTaxonomySearchModal"
      >
        Taxonomy Search
      </ModalHeader>
      <ModalBody>
        <p>The taxonomy search tool ...</p>
        <Row>
          <Col>
            <Input
              name="searchString"
              id="searchString"
              value={props.searchString}
              disabled={props.isLoading}
              onChange={(evt) => props.handleTaxonomySearchString(evt.target.value)}
            />
          </Col>
          <Col>
            <Button color="warning" disabled={props.isLoading} onClick={props.runTaxonomySearch}>
              Taxonomy Search
            </Button>
          </Col>
        </Row>
        {isLoading && <p>SEARCHING</p>}
        <Col>
          {resultsAdjusted.length ? (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <thead>
                  <tr>
                    <th></th>
                    {resultsAdjusted.map(({ taxonomy }) => (
                      <th key={taxonomy.id}>
                        <Button onClick={() => setTaxonomy(taxonomy)}>Select</Button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Amplicon</th>
                    {resultsAdjusted.map(({ taxonomy }) => (
                      <td key={taxonomy.id}>{taxonomy.amplicon.value}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Taxonomy Source</th>
                    {resultsAdjusted.map(({ taxonomy }) => (
                      <td key={taxonomy.id}>{taxonomy.taxonomy_source.value}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">r1_id</th>
                    {resultsAdjusted.map(({ taxonomy }) => (
                      <td key={taxonomy.id}>{taxonomy.r1.value}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">r2_id</th>
                    {resultsAdjusted.map(({ taxonomy }) => (
                      <td key={taxonomy.id}>{taxonomy.r2.value}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">r3_id</th>
                    {resultsAdjusted.map(({ taxonomy }) => (
                      <td key={taxonomy.id}>{taxonomy.r3.value}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">r4_id</th>
                    {resultsAdjusted.map(({ taxonomy }) => (
                      <td key={taxonomy.id}>{taxonomy.r4.value}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">r5_id</th>
                    {resultsAdjusted.map(({ taxonomy }) => (
                      <td key={taxonomy.id}>{taxonomy.r5.value}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">r6_id</th>
                    {resultsAdjusted.map(({ taxonomy }) => (
                      <td key={taxonomy.id}>{taxonomy.r6.value}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">r7_id</th>
                    {resultsAdjusted.map(({ taxonomy }) => (
                      <td key={taxonomy.id}>{taxonomy.r7.value}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">r8_id</th>
                    {resultsAdjusted.map(({ taxonomy }) => (
                      <td key={taxonomy.id}>{taxonomy.r8.value}</td>
                    ))}
                  </tr>
                </tbody>
              </Table>
            </div>
          ) : (
            !isLoading && <Row>No results</Row>
          )}
        </Col>
      </ModalBody>
    </Modal>
  )
}

function mapStateToProps(state) {
  const { isOpen, isLoading, searchString, results } = state.searchPage.taxonomySearchModal
  return {
    isOpen,
    isLoading,
    searchString,
    results,
    taxonomy: state.searchPage.filters.taxonomy,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      handleTaxonomySearchString,
      // setTaxonomy,
      runTaxonomySearch,
      closeTaxonomySearchModal,
      selectAmplicon,
      selectTaxonomyValue: (taxa, id) => createAction('SELECT_' + taxa.toUpperCase())(id),
      selectTaxonomyValueMultiple: (taxonomy) => createAction('SELECT_TAXONOMY_MULTIPLE')(taxonomy),
      updateTaxonomyDropDown: (taxa) => updateTaxonomyDropDowns(taxa)(),
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(TaxonomySearchModal)
