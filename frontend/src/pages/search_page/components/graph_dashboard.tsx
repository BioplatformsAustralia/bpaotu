import React, { useEffect } from 'react'
import { isEmpty } from 'lodash'
import { useAppDispatch, useAppSelector } from 'hooks/redux'
import type { RootState } from 'app/store'
import { Alert } from 'reactstrap'

import AnimateHelix from 'components/animate_helix'
import { fetchContextualDataForGraph } from 'reducers/contextual_data_graph'
import { fetchTaxonomyDataForGraph } from 'reducers/taxonomy_data_graph'

import GraphListed from './graph_listed'
import GraphTabbed from './graph_tabbed'

const chartEnabled = (state) => {
  return (
    !isEmpty(state.taxonomyDataForGraph.graphdata) &&
    !state.taxonomyDataForGraph.isLoading &&
    !state.contextualDataForGraph.isLoading &&
    !state.searchPage.filters.taxonomyLoading
  )
}

const GraphDashboard = (props) => {
  const dispatch = useAppDispatch()
  const { showTabbedGraph, selectedTab, selectTab, scrollToSelected, selectToScroll } = props
  const selectedEnvironment = useAppSelector(
    (state: RootState) => state.searchPage.filters.contextual.selectedEnvironment,
  )
  const optionsEnvironment = useAppSelector(
    (state: RootState) => state.contextualDataDefinitions.environment,
  )
  const optionscontextualFilter = useAppSelector(
    (state: RootState) => state.contextualDataDefinitions.filters,
  )
  const contextualGraphdata = useAppSelector(
    (state: RootState) => state.contextualDataForGraph.graphdata,
  )
  const taxonomyGraphdata = useAppSelector(
    (state: RootState) => state.taxonomyDataForGraph.graphdata,
  )
  const chartEnabled = useAppSelector((state: RootState) => {
    return (
      !isEmpty(state.taxonomyDataForGraph.graphdata) &&
      !state.taxonomyDataForGraph.isLoading &&
      !state.contextualDataForGraph.isLoading &&
      !state.searchPage.filters.taxonomyLoading
    )
  })

  useEffect(() => {
    dispatch(fetchContextualDataForGraph())
    dispatch(fetchTaxonomyDataForGraph())
  }, [dispatch])

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
            <Alert color="warning" fade={false}>
              No matching samples
            </Alert>
          ) : showTabbedGraph ? (
            <GraphTabbed
              selectedEnvironment={selectedEnvironment}
              optionsEnvironment={optionsEnvironment}
              optionscontextualFilter={optionscontextualFilter}
              contextualGraphdata={contextualGraphdata}
              taxonomyGraphdata={taxonomyGraphdata}
              selectedTab={selectedTab}
              selectTab={selectTab}
              scrollToSelected={scrollToSelected}
              selectToScroll={selectToScroll}
            />
          ) : (
            <GraphListed
              selectedEnvironment={selectedEnvironment}
              optionscontextualFilter={optionscontextualFilter}
              contextualGraphdata={contextualGraphdata}
              taxonomyGraphdata={taxonomyGraphdata}
              scrollToSelected={scrollToSelected}
              selectToScroll={selectToScroll}
              selectTab={selectTab}
              data-tut="reactour__graph_listed"
            />
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

export default GraphDashboard
