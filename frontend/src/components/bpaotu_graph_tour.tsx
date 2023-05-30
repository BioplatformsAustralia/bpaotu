import React, { useContext } from 'react'
import Tour from 'reactour'
import { withRouter } from 'react-router-dom'
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'
import { Badge, UncontrolledTooltip } from 'reactstrap'
import Octicon from 'components/octicon'
import { TourContext } from 'providers/tour_provider'

import { useAnalytics } from 'use-analytics'

const stepsStyle = {
  backgroundColor: 'rgb(30 30 30 / 90%)',
  color: 'rgb(255 255 255 / 90%)',
  padding: '50px 30px',
  boxShadow: 'rgb(0 0 0 / 30%) 0px 0.5em 3em',
  maxWidth: '500px',
}

const backLinkStyle = {
  border: '1px solid #f7f7f7',
  color: '#ffffff',
  background: 'none',
  padding: '.3em .7em',
  fontSize: 'inherit',
  display: 'block',
  cursor: 'pointer',
  margin: '1em auto',
}

const activateSelectedElement = (elementName) => {
  if (
    document.getElementById(elementName) &&
    !document.getElementById(elementName).classList.contains('active')
  ) {
    document.getElementById(elementName).click()
  }
}

const graphTourSteps = (props, isMainTourOpen) => {
  return [
    {
      content: () => {
        return (
          <div>
            <h4>Interactive Graphical Search Tutorial</h4>
            <p>
              The Interactive Graphical Search tool can be used to visually interrogate the AM
              dataset.
            </p>
            <p>In this tutorial we will:</p>
            <ul>
              <li>Highlight the main features</li>
              <li>Show how filters can be applied using the interactive graphical interface</li>
              <li>
                Show how the interactive user interface can be used in conjunction with the other
                search options available on the portal
              </li>
            </ul>
            {isMainTourOpen && (
              <p>You can return to the main tutorial at any time by simply closing this one.</p>
            )}
          </div>
        )
      },
      style: stepsStyle,
    },
    {
      selector: '[data-tut="reactour__graph_menu"]',
      content: ({ goTo }: { goTo: (step: number) => void }) => {
        document.getElementById('tabbedGraphTab').addEventListener('click', () => {
          goTo(2)
        })
        document.getElementById('listGraphTab').addEventListener('click', () => {
          goTo(2)
        })
        return (
          <div>
            <h4>Graph View Selection</h4>
            <p>The interactive graphing page can be viewed in either tabbed or list layout. </p>
            <p>
              The default view is tabbed view, but you can swap between views by clicking between
              the 2 buttons.
            </p>
            <p>
              <ul>
                <li>Click either 'Tabbed View' or 'Listed View' button to see respective view.</li>
              </ul>
            </p>
          </div>
        )
      },
      style: stepsStyle,
    },
    {
      selector: '[data-tut="reactour__graph_view"]',
      content: ({ goTo }: { goTo: (step: number) => void }) => {
        return (
          <div>
            <h4>Graph View Selection</h4>
            <p>
              In tabbed view, different graphs can be viewed by clicking between the various tabs.
            </p>
            <p>In listed view, use the side scroll bar to view different graphs.</p>
            <ul>
              <li>Click "Prev" button to go back and switch the view.</li>
            </ul>
          </div>
        )
      },
      style: stepsStyle,
      position: [60, 175],
    },
    {
      selector: '[data-tut="reactour__graph_filter"]',
      highlightedSelectors: ['[data-tut="reactour__graph_view"]'],
      content: () => {
        return (
          <div>
            <h4>Filter Selection</h4>
            <p> A list of applied filters can be seen at the bottom of the page.</p>
            <ul>
              <li>Filters can be applied by selecting/clicking on desired area of a graph.</li>
              <li>All the applied filters are shown at the bottom of the graph page.</li>
              <li>
                Filters can be deselected by clicking on the cross at the far right of the filter
                box.
              </li>
            </ul>
          </div>
        )
      },
      action: (node) => {
        activateSelectedElement('reactour__graph_menu_tabbed')
        activateSelectedElement('reactour__graph_taxonomy')
      },
      style: stepsStyle,
      position: [60, 175],
    },
    {
      selector: '[data-tut="reactour__graph_view"]',
      content: () => {
        return (
          <div>
            <h4>Download + Info Buttons</h4>
            <p>
              All graphs are available for download by selecting the download button at the top
              right hand corner of the graphing window. <br />
              <p>
                <i>
                  Note: some browsers may require you to hover the cursor over the graph to make the
                  download button visible
                </i>
              </p>
            </p>
            <p>
              Hover over the <Octicon name="info" /> Info buttons to view a definition of the
              function.
            </p>
            <p>
              At any time, the graphical interactive pop-up window can be closed and reopened
              without the search being lost.
            </p>
          </div>
        )
      },
      style: stepsStyle,
      position: [60, 175],
    },
    {
      selector: '[data-tut="reactour__graph_view"]',
      highlightedSelectors: ['[data-tut="reactour__graph_filter"]'],
      content: () => {
        return (
          <div>
            <h4>Amplicon Selection</h4>
            <p>
              We will use the same example used in the tutorial on the main page to test the
              features of the interactive graphing tool.
            </p>
            <p>
              The default amplicon for the graphical interface is <b>bacterial 16S (27f/519r)</b>.
            </p>
            <p>
              If you wish to change amplicon, select the desired amplicon from the drop-down menu on
              the main page before opening the graphing tool.
            </p>
            <ul>
              <li>Close the graphical interface</li>
              <li>Select the amplicon 2f519R_archaea then reopen the interactive graph search</li>
            </ul>
            <p>You will see:</p>
            <ul>
              <li>The amplicon plot for with the total number of ASVs for the Archaea</li>
              <li>The amplicon filter at the bottom of the pop-up window</li>
            </ul>
          </div>
        )
      },
      action: (node) => {
        activateSelectedElement('reactour__graph_amplicon')
      },
      style: stepsStyle,
      position: [60, 175],
    },
    {
      selector: '[data-tut="reactour__graph_filter"]',
      highlightedSelectors: ['[data-tut="reactour__graph_view"]'],
      content: () => {
        return (
          <div>
            <h4>Reset Amplicon Selection</h4>
            <p>We will use the default tabbed view for this step.</p>
            <p>For this example, we'll find all ASV's that are:</p>
            <ul>
              <li>classified as phylum Verrucomicrobia,</li>
              <li>from grassland soils</li>
              <li>with a depth of 0 to 0.1m</li>
            </ul>
            <p>For this we will use the default amplicon of bacterial 16S.</p>
            <ul>
              <li>
                Reset the amplicon filter clicking the cross on the amplicon filter or by closing
                the popup and selecting the amplicon on the main page
              </li>
            </ul>
          </div>
        )
      },
      action: (node) => {
        activateSelectedElement('reactour__graph_amplicon')
      },
      style: stepsStyle,
      position: [60, 175],
    },
    {
      selector: '[data-tut="reactour__graph_view"]',
      highlightedSelectors: ['[data-tut="reactour__graph_filter"]'],
      content: () => {
        return (
          <div>
            <h4>Taxonomy Selection</h4>
            <p>
              Click on the section of the pie graph corresponding to the desired taxonomy. You will
              notice the graph will reset to the next level of taxonomy with each click.
            </p>
            <p>To select the Verrucomicrobia</p>
            <ul>
              <li>Click on the 'd_Bacteria' portion of the pie</li>
              <li>Click on the 'p__Verrucomicrobia' portion of the pie</li>
            </ul>
            <p>
              Now, we'll move to the environment page to select the graphs showing environmental
              breakdown.
            </p>
          </div>
        )
      },
      action: (node) => {
        activateSelectedElement('reactour__graph_taxonomy')
      },
      style: stepsStyle,
      position: [60, 175],
    },
    {
      selector: '[data-tut="reactour__graph_view"]',
      content: () => {
        return (
          <div>
            <h4>Environment Selection</h4>
            <p>On the Environment tab, click on the Soil section of the pie chart</p>
          </div>
        )
      },
      action: (node) => {
        activateSelectedElement('reactour__graph_environment')
      },
      style: stepsStyle,
      position: [60, 250],
    },
    {
      selector: '[data-tut="reactour__graph_view"]',
      content: () => {
        return (
          <div>
            <h4>Contextual Filter Selection</h4>
            <p>On the Contextual Filters tab:</p>
            <ul>
              <li>Click on the 'Vegetation Type' tab if not selected</li>
              <li>Find and click 'Grassland' on the 'Vegetation Type Plot' pie chart</li>
            </ul>
          </div>
        )
      },
      action: (node) => {
        activateSelectedElement('reactour__graph_contextual')
      },
      style: stepsStyle,
      position: [60, 250],
    },
    {
      selector: '[data-tut="reactour__graph_view"]',
      content: () => {
        return (
          <div>
            <h4>Contextual Filter Selection</h4>
            <ul>
              <li>The pie chart legend can be used to deselect each data series. </li>
              <li>This will recalculate the percentage composition. </li>
              <li>
                This is a handy tool to visualise data that makes up a small proportion of the
                dataset or for visualising data of a particular category.{' '}
              </li>
            </ul>
            <p>
              Lets look at the proportion of samples with agricultural usage. <br />
              <i>Note this does not apply data filters.</i>
            </p>
            <ul>
              <li>Click on the 'Env Broad Scale' tab if not selected.</li>
              <li>
                Deselect each category from the legend that does not relate to some form of
                agriculture (Keep 2, 3, 5).
              </li>
              <li>
                Note that samples that do not have data for a given categorical field show as
                “Null”, in our example 12 samples (5.13%) have no information regarding their broad
                land-use category. At present missing values are not represented for numerical
                fields (e.g., pH), unless the values are confirmed “missing”, in which case they are
                given the flag -9999.
              </li>
            </ul>
          </div>
        )
      },
      style: stepsStyle,
      position: [60, 250],
    },
    {
      selector: '[data-tut="reactour__graph_view"]',
      highlightedSelectors: ['[data-tut="reactour__graph_filter"]'],
      content: () => {
        return (
          <div>
            <h4>Contextual Filter Selection</h4>
            <p>
              Not all filters are directly accessible from the interactive graphical interface.
              However, we can add additional filters using the dropdown menus on the main page.
              <br />
            </p>
            <p>To select the required depth</p>
            <ul>
              <li>
                Close the interactive graphical interface popup window and use the dropdown filter
                on the main page to select depth between 0 and 0.1 m (
                <i>
                  Notice any selections made from the graphical viewer have been populated in the
                  the text based filters
                </i>
                ).
              </li>
              <li>
                Reopen the interactive graph search popup (
                <i>
                  Notice the depth filter has been added to the list of filters at the bottom of the
                  page
                </i>
                ).
              </li>
            </ul>
          </div>
        )
      },
      style: stepsStyle,
      position: [60, 250],
    },
    {
      selector: '[data-tut="reactour__graph_any_all"]',
      content: () => {
        return (
          <div>
            <h4>Contextual Filter Selection</h4>
            <p>
              The ability to choose if contextual filters fit 'any' or 'all' conditions is enabled
              if the default filters are narrowed or if two or more contextual filters are enabled.
            </p>
          </div>
        )
      },
      style: stepsStyle,
      position: [60, 250],
    },
    {
      selector: '[data-tut="reactour__graph_view"]',
      highlightedSelectors: ['[data-tut="reactour__graph_filter"]'],
      content: () => {
        return (
          <div>
            <h4>Exploring the data</h4>
            <p>
              Now that we have selected some data of interest, we can use the graphical interface to
              explore the data in more detail.
            </p>
            <p>For example if we were interested in samples over a specific pH range we can: </p>
            <ul>
              <li>Click on the “Contextual Filters” tab and select the pH tab.</li>
              <li>By hovering the cursor over the values on the graph we can see their values.</li>
              <li>
                You can use your mouse to draw a rectangle over values that you are interested to
                filter for a range of interest.
              </li>
              <li>Try using your mouse to select for values ranging from 5 to 6.2 </li>
              <li>(Note that the filter has been added to the list at the bottom of the page)</li>
              <li>
                If finer filtering is required, you can close the window popup window and change the
                values in the dropdown menu of the main page.
              </li>
            </ul>
          </div>
        )
      },
      style: stepsStyle,
      position: [60, 250],
    },
    {
      selector: '[data-tut="reactour__graph_view"]',
      content: ({ goTo }: { goTo: (step: number) => void }) => {
        return (
          <div>
            <h4>Traits Selection</h4>
            <p>
              The Traits tab provides information relating to inferred metabolic/functional
              characteristics found in samples using the selected filters.
            </p>
            <p>
              Filters for a specific trait can be added by clicking on the desired segment of the
              pie chart.
            </p>
          </div>
        )
      },
      action: (node) => {
        activateSelectedElement('reactour__graph_traits')
      },
      style: stepsStyle,
      position: [60, 250],
    },
    {
      selector: '[data-tut="reactour__graph_view"]',
      content: () => {
        return (
          <div>
            <h4>Taxonomy or Trait information Selection</h4>
            <p>
              Two additional tabs provide visualisation of taxonomy or trait information using the
              selected filters against various AM environment types.
            </p>
            <p>
              This includes comparative plots of the entire data set, all marine samples, all soil
              samples and the composition of samples selected using the filters and samples not
              included in the filtered dataset.
            </p>
          </div>
        )
      },
      action: (node) => {
        activateSelectedElement('reactour__graph_taxonomy_am_environment')
      },
      style: stepsStyle,
      position: [60, 250],
    },
    {
      content: ({ goTo }: { goTo: (step: number) => void }) => {
        return (
          <div>
            <h4>End of the Tutorial</h4>
            <br />
            <button style={backLinkStyle} onClick={() => goTo(0)}>
              Restart the tutorial!
            </button>
          </div>
        )
      },
      style: stepsStyle,
    },
  ]
}

const BPAOTUGraphTour = (props) => {
  const { track } = useAnalytics()
  const { isMainTourOpen, isGraphTourOpen, setIsGraphTourOpen, graphTourStep, setGraphTourStep } =
    useContext(TourContext)

  const disableBody = (target) => disableBodyScroll(target)
  const enableBody = (target) => enableBodyScroll(target)

  const steps = graphTourSteps(props, isMainTourOpen)

  // all steps are zero-indexed
  const lastStep = steps.length - 1

  return (
    <>
      <Tour
        startAt={graphTourStep}
        steps={steps}
        prevButton={'<< Prev'}
        nextButton={'Next >>'}
        disableFocusLock={true}
        closeWithMask={false}
        badgeContent={(curr, tot) => `${curr} of ${tot}`}
        getCurrentStep={(curr) => setGraphTourStep(curr)}
        accentColor={'#007bff'}
        rounded={5}
        isOpen={isGraphTourOpen}
        onRequestClose={() => {
          setIsGraphTourOpen(false)
          if (graphTourStep === lastStep) {
            track('otu_tutorial_graph_complete')
          } else {
            track('otu_tutorial_graph_incomplete', { step: graphTourStep })
          }
        }}
        onAfterOpen={disableBody}
        onBeforeClose={enableBody}
        lastStepNextButton={'End Tutorial'}
      />
      <Badge
        id="badgeGraphTutorial"
        style={{
          cursor: 'pointer',
          fontSize: '14px',
          margin: '10px',
          padding: '10px 25px',
          color: '#041e48',
          backgroundColor: '#17c496',
        }}
        onClick={() => {
          setIsGraphTourOpen(true)
          track('otu_tutorial_graph_open')
          props.history.push('/')
        }}
        pill
      >
        <Octicon name="book" />
        <span style={{ marginLeft: 6 }}>Tutorial</span>
      </Badge>
      <UncontrolledTooltip target="badgeGraphTutorial" placement="auto">
        This tutorial helps to use interactive graph feature in the BPA-OTU data portal
      </UncontrolledTooltip>
    </>
  )
}

export default withRouter(BPAOTUGraphTour)
