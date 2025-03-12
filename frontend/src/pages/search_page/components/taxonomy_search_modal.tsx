import React, { useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createAction } from 'redux-actions'

import {
  Button,
  Col,
  Modal,
  ModalBody,
  ModalHeader,
  Input,
  Row,
  Table,
  UncontrolledTooltip,
} from 'reactstrap'

import AnimateHelix from 'components/animate_helix'
import { selectAmplicon } from '../reducers/amplicon'
import { updateTaxonomyDropDowns } from '../reducers/taxonomy'
import {
  handleTaxonomySearchString,
  runTaxonomySearch,
  closeTaxonomySearchModal,
} from '../reducers/taxonomy_search_modal'

const LowerRankList = ({ list }) => {
  const [show, setShow] = useState(false)
  const text = show ? 'hide' : 'show'

  if (list.length === 0) {
    return null
  }

  // list contains an array of the remaining taxonomy ranks
  const uniqueList = [...Array.from(new Set(list.map((text) => text[0])).values())]
  const numUniqueItems = uniqueList.length

  // need to have ghost content to preserve the horizontal space taken up by the list
  // but don't want it to reserve any vertical space so the scroll message is not pushed down
  return (
    <div>
      <p>
        <em>
          {numUniqueItems} items{' '}
          <span style={{ cursor: 'pointer' }} onClick={() => setShow(!show)}>
            (<u>{text}</u>)
          </span>
        </em>
      </p>

      {show && (
        <ul style={{ paddingLeft: '16px' }}>
          {uniqueList.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}

      <span
        style={{
          color: 'red',
          display: 'inline-block',
          height: 0,
          lineHeight: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          paddingLeft: '16px',
        }}
      >
        <ul style={{ margin: 0 }}>
          {uniqueList.map((item, i) => (
            <li key={`ghost-${i}`}>{item}</li>
          ))}
        </ul>
      </span>
    </div>
  )
}

const loadingStyle = {
  display: 'flex',
  height: '100%',
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
  top: '40px',
  zIndex: 99999,
} as React.CSSProperties

const stickyStyle = {
  position: 'sticky',
  left: 0,
  backgroundColor: '#eee',
} as React.CSSProperties

const TaxonomySearchModal = (props) => {
  const {
    isOpen,
    isLoading,
    searchStringInput,
    searchString,
    results,
    rankLabelsLookup,
    closeTaxonomySearchModal,
  } = props

  const rankOrder = ['amplicon', 'taxonomy_source', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8']
  const rankOrderLookup = Object.fromEntries(rankOrder.map((key, index) => [key, index]))

  const groupByRank = (taxonomies, searchString) => {
    let groups = {}
    for (const taxonomyObj of taxonomies) {
      const taxonomy = taxonomyObj.taxonomy
      const keyArray = [
        taxonomy.amplicon.value,
        taxonomy.taxonomy_source.value,
        taxonomy.r1.value,
        taxonomy.r2.value,
        taxonomy.r3.value,
        taxonomy.r4.value,
        taxonomy.r5.value,
        taxonomy.r6.value,
        taxonomy.r7.value,
        taxonomy.r8.value,
      ]

      let index = keyArray.findIndex((level) =>
        level.toLowerCase().includes(searchString.toLowerCase())
      )
      if (index !== -1) {
        let group = keyArray.slice(0, index + 1).join(',')

        if (!groups[group]) {
          groups[group] = {
            members: [],
            uniqueRanks: {},
            maxIndex: index,
          }
        }

        let lowerLevelRanks = keyArray.slice(index + 1).filter((rank) => rank !== '')

        groups[group].members.push({
          fullObject: taxonomyObj,
          lowerLevelRanks: lowerLevelRanks.length ? [lowerLevelRanks] : [],
        })
      }
    }

    for (let group in groups) {
      const fullObject = groups[group].members[0].fullObject.taxonomy
      const index = groups[group].maxIndex
      const allowedKeys = rankOrder.slice(0, index + 1)

      // start with the groupTaxonomy as keys up to the first sighting of the searchString
      let groupTaxonomy
      groupTaxonomy = Object.fromEntries(
        Object.entries(fullObject).filter(([key]) => allowedKeys.includes(key))
      )

      // if a group only has one member then absorb that into the group unique key
      if (groups[group].members.length === 1) {
        const member = groups[group].members[0]

        if (member.lowerLevelRanks.length === 0) {
          // it's already condensed because searchString was found at lowest rank
        } else {
          // remove the entry from lowerLevelRanks so show/hide not shown
          // promote the full version of the only taxonomy to populate table and Select button
          // (not the one grouped at earliest sighting of searchString)
          member.lowerLevelRanks = []
          groupTaxonomy = fullObject
        }
      }

      groups[group].uniqueRanks = groupTaxonomy
    }

    return groups
  }

  let resultsAdjusted
  if (results.length) {
    const groups = groupByRank(results, searchString)
    resultsAdjusted = Object.values(groups).map((group: any) => {
      return {
        taxonomy: group.uniqueRanks,
        list: group.members.map((m) => m.lowerLevelRanks).flat(),
        maxIndex: group.maxIndex,
      }
    })
  } else {
    resultsAdjusted = []
  }

  // uses the same mechanism when clicking on a slice of the taxonomy pie chart in Interactive Graph Search
  // TODO: move to a redux action so can close the window when it's done?
  const setTaxonomy = (taxonomy) => {
    const currentAmplicon = props.amplicon
    const currentTaxonomy = props.taxonomy

    // check to see if any ranks are present in the selected taxonomy before calling selectTaxonomyValue
    if (taxonomy.amplicon) {
      // if amplicon value is already the same, using selectAmplicon again messes with dropdowns
      if (currentAmplicon.value !== taxonomy.amplicon.id) {
        props.selectAmplicon(taxonomy.amplicon.id)
      }
    }
    if (taxonomy.taxonomy_source) {
      if (currentTaxonomy.taxonomy_source.selected.value !== taxonomy.taxonomy_source.id) {
        // need to use updateTaxonomyDropDown if taxonomy source has changed
        props.selectTaxonomyValue('taxonomy_source', taxonomy.taxonomy_source.id)
        props.updateTaxonomyDropDown('taxonomy_source')
      }
    }
    if (taxonomy.r1) {
      if (currentTaxonomy.r1.selected.value !== taxonomy.r1.id) {
        props.selectTaxonomyValue('r1', taxonomy.r1.id)
      }
    }
    if (taxonomy.r2) {
      if (currentTaxonomy.r2.selected.value !== taxonomy.r2.id) {
        props.selectTaxonomyValue('r2', taxonomy.r2.id)
      }
    }
    if (taxonomy.r3) {
      if (currentTaxonomy.r3.selected.value !== taxonomy.r3.id) {
        props.selectTaxonomyValue('r3', taxonomy.r3.id)
      }
    }
    if (taxonomy.r4) {
      if (currentTaxonomy.r4.selected.value !== taxonomy.r4.id) {
        props.selectTaxonomyValue('r4', taxonomy.r4.id)
      }
    }
    if (taxonomy.r5) {
      if (currentTaxonomy.r5.selected.value !== taxonomy.r5.id) {
        props.selectTaxonomyValue('r5', taxonomy.r5.id)
      }
    }
    if (taxonomy.r6) {
      if (currentTaxonomy.r6.selected.value !== taxonomy.r6.id) {
        props.selectTaxonomyValue('r6', taxonomy.r6.id)
      }
    }
    if (taxonomy.r7) {
      if (currentTaxonomy.r7.selected.value !== taxonomy.r7.id) {
        props.selectTaxonomyValue('r7', taxonomy.r7.id)
      }
    }
    if (taxonomy.r8) {
      if (currentTaxonomy.r7.selected.value !== taxonomy.r7.id) {
        props.selectTaxonomyValue('r8', taxonomy.r8.id)
      }
    }
  }

  const RankCell = ({ taxonomy, rank, list, maxIndex, index }) => {
    const id = `rankCell-${index}-${rank}`
    return (
      <>
        <span id={id}>{taxonomy[rank] && taxonomy[rank].value}</span>
        {maxIndex === rankOrderLookup[rank] - 1 && <LowerRankList list={list} />}
        <RankLabel {...{ id, taxonomy, rank }} />
      </>
    )
  }

  const RankLabel = ({ id, taxonomy, rank }) => {
    const thisRankOrder = rankOrderLookup[rank]
    const thisRankIndex = thisRankOrder - 2

    if (taxonomy[rank]) {
      return (
        <UncontrolledTooltip target={id} placement="auto">
          {rankLabelsLookup[taxonomy.taxonomy_source.id][thisRankIndex]}
        </UncontrolledTooltip>
      )
    } else {
      return null
    }
  }

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
      <ModalBody style={{ overflowY: 'scroll' }}>
        <Row style={{ margin: 4, width: '900px' }}>
          <p>
            The Taxonomy Search tool will search each taxonomy source in the Australian Microbiome
            database for occurances of a given search string. Use this tool if you are unsure which
            taxonomy source a particular taxonomic rank of interest belongs to.
          </p>
          <p>
            Results will be grouped at the lowest common rank containing the search string (case
            insensitive). Note that the rank labels change depending on the taxonomy source. The
            Australian Microbiome Project has a convention that preceedes each rank with the
            lowercase first letter of the label before the value, e.g. "p__" for Phylum. The rank
            label associated with a given taxonomy can be also seen by hovering over the value.
          </p>
          <p>
            When viewing the search results, click the "Select" button to set the taxonomy search
            filters for that taxonomy.
          </p>
        </Row>
        <Row style={{ margin: 1 }}>
          <Col>
            <Input
              name="searchStringInput"
              id="searchStringInput"
              width="250px"
              value={searchStringInput}
              placeholder="e.g. Skeletonema"
              disabled={isLoading}
              onChange={(evt) => props.handleTaxonomySearchString(evt.target.value)}
            />
          </Col>
          <Col>
            <Button color="warning" disabled={isLoading} onClick={props.runTaxonomySearch}>
              Taxonomy Search
            </Button>
          </Col>
        </Row>
        <Col style={{ marginTop: 10, marginBottom: 10 }}>
          {isLoading && (
            <div style={loadingStyle}>
              <AnimateHelix />
            </div>
          )}
          {searchString && (
            <div style={{ margin: 1 }}>
              {resultsAdjusted.length > 0 ? (
                <p>Search results for: {searchString}</p>
              ) : (
                <p>No results for: {searchString}</p>
              )}
            </div>
          )}
        </Col>
        {resultsAdjusted.length > 0 && (
          <Col>
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <thead>
                  <tr>
                    <th scope="row" style={stickyStyle}></th>
                    {resultsAdjusted.map(({ taxonomy, list, maxIndex }, index) => (
                      <th key={index}>
                        <Button onClick={() => setTaxonomy(taxonomy)}>Select</Button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row" style={stickyStyle}>
                      Amplicon
                    </th>
                    {resultsAdjusted.map(({ taxonomy, list, maxIndex }, index) => (
                      <td key={index}>{taxonomy.amplicon && taxonomy.amplicon.value}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" style={stickyStyle}>
                      Taxonomy Source
                    </th>
                    {resultsAdjusted.map(({ taxonomy, list, maxIndex }, index) => (
                      <td key={index}>
                        {taxonomy.taxonomy_source && taxonomy.taxonomy_source.value}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" style={stickyStyle}>
                      Rank 1
                    </th>
                    {resultsAdjusted.map(({ taxonomy, list, maxIndex }, index) => (
                      <td key={index}>
                        <RankCell rank="r1" {...{ taxonomy, list, maxIndex, index }} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" style={stickyStyle}>
                      Rank 2
                    </th>
                    {resultsAdjusted.map(({ taxonomy, list, maxIndex }, index) => (
                      <td key={index}>
                        <RankCell rank="r2" {...{ taxonomy, list, maxIndex, index }} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" style={stickyStyle}>
                      Rank 3
                    </th>
                    {resultsAdjusted.map(({ taxonomy, list, maxIndex }, index) => (
                      <td key={index}>
                        <RankCell rank="r3" {...{ taxonomy, list, maxIndex, index }} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" style={stickyStyle}>
                      Rank 4
                    </th>
                    {resultsAdjusted.map(({ taxonomy, list, maxIndex }, index) => (
                      <td key={index}>
                        <RankCell rank="r4" {...{ taxonomy, list, maxIndex, index }} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" style={stickyStyle}>
                      Rank 5
                    </th>
                    {resultsAdjusted.map(({ taxonomy, list, maxIndex }, index) => (
                      <td key={index}>
                        <RankCell rank="r5" {...{ taxonomy, list, maxIndex, index }} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" style={stickyStyle}>
                      Rank 6
                    </th>
                    {resultsAdjusted.map(({ taxonomy, list, maxIndex }, index) => (
                      <td key={index}>
                        <RankCell rank="r6" {...{ taxonomy, list, maxIndex, index }} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" style={stickyStyle}>
                      Rank 7
                    </th>
                    {resultsAdjusted.map(({ taxonomy, list, maxIndex }, index) => (
                      <td key={index}>
                        <RankCell rank="r7" {...{ taxonomy, list, maxIndex, index }} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" style={stickyStyle}>
                      Rank 8
                    </th>
                    {resultsAdjusted.map(({ taxonomy, list, maxIndex }, index) => (
                      <td key={index}>
                        <RankCell rank="r8" {...{ taxonomy, list, maxIndex, index }} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </Table>
            </div>
            <div>
              <p>
                <em>
                  Scroll sideways to see all <strong>{resultsAdjusted.length}</strong> results
                </em>
              </p>
            </div>
          </Col>
        )}
      </ModalBody>
    </Modal>
  )
}

function mapStateToProps(state) {
  const { isOpen, isLoading, searchStringInput, searchString, results } =
    state.searchPage.taxonomySearchModal

  return {
    isOpen,
    isLoading,
    searchStringInput,
    searchString,
    results,
    amplicon: state.searchPage.filters.selectedAmplicon,
    taxonomy: state.searchPage.filters.taxonomy,
    rankLabelsLookup: state.referenceData.ranks.rankLabelsLookup,
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
