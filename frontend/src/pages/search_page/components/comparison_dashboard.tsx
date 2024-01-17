import React, { useEffect } from 'react'
import { isEmpty } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Alert } from 'reactstrap'

import AnimateHelix from 'components/animate_helix'
import { fetchContextualDataForGraph } from 'reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from 'reducers/taxonomy_data_graph'

// import ComparisonListed from './comparison_listed'
// import ComparisonTabbed from './comparison_tabbed'

const chartEnabled = (state) => {
  return (
    !isEmpty(state.taxonomyDataForGraph.graphdata) &&
    !state.taxonomyDataForGraph.isLoading &&
    !state.contextualDataForGraph.isLoading &&
    !state.searchPage.filters.taxonomyLoading
  )
}

const ComparisonDashboard = (props) => {
  const {
    chartEnabled,
    selectedEnvironment,
    optionsEnvironment,
    optionscontextualFilter,
    contextualGraphdata,
    taxonomyGraphdata,
    fetchContextualDataForGraph,
    fetchTaxonomyDataForGraph,
    showTabbedGraph,
    selectedTab,
    selectTab,
    scrollToSelected,
    selectToScroll,
  } = props

  useEffect(() => {
    fetchContextualDataForGraph()
    fetchTaxonomyDataForGraph()
  }, [fetchContextualDataForGraph, fetchTaxonomyDataForGraph])

  const loadingstyle = {
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }

  return (
    <>
      {chartEnabled ? (
        <div>
          {isEmpty(contextualGraphdata) ? (
            <Alert color="warning">No matching samples</Alert>
          ) : showTabbedGraph ? (
            // <ComparisonTabbed
            //   selectedEnvironment={selectedEnvironment}
            //   optionsEnvironment={optionsEnvironment}
            //   optionscontextualFilter={optionscontextualFilter}
            //   contextualGraphdata={contextualGraphdata}
            //   taxonomyGraphdata={taxonomyGraphdata}
            //   selectedTab={selectedTab}
            //   selectTab={selectTab}
            //   scrollToSelected={scrollToSelected}
            //   selectToScroll={selectToScroll}
            // />
            <p>show tabbed</p>
          ) : (
            // <ComparisonListed
            //   selectedEnvironment={selectedEnvironment}
            //   optionscontextualFilter={optionscontextualFilter}
            //   contextualGraphdata={contextualGraphdata}
            //   taxonomyGraphdata={taxonomyGraphdata}
            //   scrollToSelected={scrollToSelected}
            //   selectToScroll={selectToScroll}
            //   selectTab={selectTab}
            //   data-tut="reactour__comparison_listed"
            // />
            <p>show listed</p>
          )}
        </div>
      ) : (
        <div style={loadingstyle}>
          <AnimateHelix />
        </div>
      )}
    </>
  )
}

const mapStateToProps = (state) => {
  return {
    selectedEnvironment: state.searchPage.filters.contextual.selectedEnvironment,
    chartEnabled: chartEnabled(state),
    optionsEnvironment: state.contextualDataDefinitions.environment,
    optionscontextualFilter: state.contextualDataDefinitions.filters,
    contextualGraphdata: state.contextualDataForGraph.graphdata,
    taxonomyGraphdata: state.taxonomyDataForGraph.graphdata,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      fetchContextualDataForGraph,
      fetchTaxonomyDataForGraph,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ComparisonDashboard)
