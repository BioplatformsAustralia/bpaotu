import React, { useContext } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'

import { Tutorial, TutorialBadge, AMBLink, stepsStyle } from 'components/tutorial'
import { TourContext } from 'providers/tour_provider'

import { NavLink as RRNavLink } from 'react-router-dom'

import { useAnalytics } from 'use-analytics'

const tourSteps = (props) => {
  const metagenome = window.location.pathname === '/metagenome'

  const commonSteps = [
    {
      content: () => {
        return (
          <div>
            <h4>Welcome to Australian Microbiome Data Products Portal</h4>
            <p>
              This tutorial will take you through an example search and demonstrate some of the
              features available in the data portal.
            </p>
            <p>TODO We have two sets of data available amplicon or metagenome</p>
            {metagenome ? (
              <>
                <p>
                  You can follow the amplicon tutorial instead by clicking{' '}
                  <RRNavLink to="/">here</RRNavLink>.
                </p>
                <p>TODO an example specific to metagenome (if required)</p>
              </>
            ) : (
              <>
                <p>
                  You can follow the metagenome tutorial instead by clicking{' '}
                  <RRNavLink to="/metagenome">here</RRNavLink>.
                </p>
                <p>
                  For this example, we'll find all ASV's classified as Verrucomicrobia, from
                  grassland soils.
                </p>
              </>
            )}
          </div>
        )
      },
      style: stepsStyle,
    },
    {
      selector: '[data-tut="reactour__AmpliconTaxonomyFilterCard"]',
      content: () => {
        return (
          <div>
            <h4>Select Amplicon and Taxonomy</h4>

            {metagenome ? (
              <>
                <p>
                  TODO metagenome specifc text instead of: We first need to select an amplicon. For
                  our example, amplicon == '27f519r_bacteria'.
                </p>
                <p>
                  TODO explain how searching the other amplicons will be different on Metagenome
                  page (only returns results for samples with metagenome data??)
                </p>
              </>
            ) : (
              <p>
                We first need to select an amplicon. For our example, amplicon ==
                '27f519r_bacteria'.
              </p>
            )}

            <p>
              This selection will cause the lower level taxonomies to be filtered to those available
              in the upper selection. We now need to select our target kingdom and phylum.
            </p>

            {metagenome ? (
              <>
                <p>TODO metagenome specifc text about the metaxa taxonomy</p>
                <p>TODO metagenome specifc textinstead of: Select Kingdom</p>
              </>
            ) : (
              <>
                <p>
                  Select Kingdom as 'd__Bacteria' to keep only sequences hitting the bacterial
                  target the primers were designed for.
                </p>
                <p>Select Phylum as 'p__Verrucomicrobiota'.</p>
              </>
            )}

            <p>
              For more details about taxonomy selection <AMBLink text="see this page" />.
            </p>
          </div>
        )
      },
      style: stepsStyle,
    },
    {
      selector: '[data-tut="reactour__ContextualFilterCard"]',
      content: () => {
        return (
          <div>
            <h4>Select the appropriate contextual metadata filters</h4>
            <p>We can now select the sample environment, in our example case 'Soil'</p>
            <p>
              <i>Note: no selection here (---) will include both terrestrial and marine samples</i>
            </p>
            For our example, we will further refine the search to include:
            <ul>
              <li>Vegetation Type is Grassland</li>
              <li>Depth of 0 to 0.1</li>
            </ul>
            <p>
              <i>
                Note: matching filters will be suggested after typing a few characters in the
                dropdown list
              </i>
            </p>
            <p>
              For a metadata of the contextual data fields or to view the methods manual, click the
              relevant buttons.
            </p>
          </div>
        )
      },
      style: stepsStyle,
    },
    {
      selector: '[data-tut="reactour__SampleSearchButton"]',
      content: () => {
        return (
          <div>
            <h4>Search database</h4>
            <p>
              Now that the search parameters are entered hit "Sample search" and the requested data
              will be returned.
            </p>
          </div>
        )
      },
      style: stepsStyle,
    },
    {
      selector: '[data-tut="reactour__SearchResultsCard"]',
      content: () => {
        return (
          <div>
            <h4>View Results</h4>
            <p>
              Once the database search is complete all samples with the desired data
              (Verrucomicrobia ASV's from surface soils) will be shown in the results section at the
              bottom of the page.
            </p>
            <p>
              Here you can see each sample that has the search attributes and the attribute data.
            </p>
            <p>
              There are also multiple exploration and export buttons, which we'll explore in the
              following steps.
            </p>
            <p>
              To see details about a single sample, click on the sample link under 'Sample ID' in
              the results list, this will take you to ALL raw sequencing data for that sample.
            </p>
          </div>
        )
      },
      style: stepsStyle,
    },
    {
      selector: '[data-tut="reactour__InteractiveMapSearchButton"]',
      content: () => {
        return (
          <div>
            <h4>View interactive map search</h4>
            <p>Now, let's view the results on a map.</p>
            <p>Click the 'Interactive map search' button.</p>
            <p>This will load a map of the location of the selected samples.</p>
          </div>
        )
      },
      style: stepsStyle,
    },
    {
      selector: '[data-tut="reactour__InteractiveGraphSearchButton"]',
      content: () => {
        return (
          <div>
            <h4>View interactive graphical search</h4>
            <p>We can also explore the data visually.</p>
            <p>Click the 'Interactive graph search' button.</p>
            <p>
              This will load all of your search parameters and results into some summary figures.
            </p>
          </div>
        )
      },
      style: stepsStyle,
    },
  ]

  const contactStep = {
    selector: '[data-tut="reactour__Contact"]',
    content: () => {
      return (
        <div>
          <span>
            <h4>End of the Tutorial</h4>
            <p>If you have any queries, please click on the contact link</p>
          </span>
        </div>
      )
    },
    style: stepsStyle,
  }

  const ampliconSteps = [
    {
      selector: '[data-tut="reactour__ExportOtuContextual"]',
      content: () => {
        return (
          <div>
            <span>
              <h4>Export the data as CSV</h4>
              <p>
                Data can be exported as CSV by clicking the 'Download OTU and Contextual Data (CSV)'
              </p>
              <p>The full export option will export both the metadata and the ASV table</p>
            </span>
          </div>
        )
      },
      style: stepsStyle,
    },
    {
      selector: '[data-tut="reactour__ExportContextualOnly"]',
      content: () => {
        return (
          <div>
            <span>
              <h4>Export the data as CSV</h4>
              <p>
                The most common way for our users to export data for downstream analyses is as CSV
              </p>
              <p>
                Data can be exported as CSV by clicking the 'Download Contextual Data only (CSV)'
              </p>
              <p>
                The Contextual Only option will provide only the sample metadata, not the ASV table
              </p>
            </span>
          </div>
        )
      },
      style: stepsStyle,
    },
    {
      selector: '[data-tut="reactour__ExportBIOM"]',
      content: () => {
        return (
          <div>
            <span>
              <h4>Export the data as BIOM format (Phinch compatible)</h4>
              <p>
                It is also possible to export the data in a BIOM format (JSON) that is compatible
                with PHINCH (
                <a rel="noopener noreferrer" target="_phinch" href="http://phinch.org">
                  http://phinch.org
                </a>
                )
              </p>
              <p>
                The BIOM formatted results can be exported by selecting the 'Download BIOM format
                (Phinch compatible)'
              </p>
            </span>
          </div>
        )
      },
      style: stepsStyle,
    },
    {
      selector: '[data-tut="reactour__ExportGalaxy"]',
      content: () => {
        return (
          <div>
            <span>
              <h4>Export data to Galaxy for further analysis</h4>
              <p>
                Data can be exported to Galaxy Australia for further analysis by clicking the
                'Export data to Galaxy for further analysis' button.
              </p>
              <p>
                Once data is sent to galaxy it is available for analysis in users galaxy workspace
              </p>
              <p>
                If users are not galaxy users, a user account is set up for you using your AM
                associated email details
              </p>
              <p>
                See this link for further information{' '}
                <a
                  rel="noopener noreferrer"
                  target="_krona"
                  href="/static/bpaotu/rdc/Galaxy Australia - Quick Start Guide.pdf"
                >
                  (Galaxy link)
                </a>
              </p>
            </span>
          </div>
        )
      },
      style: stepsStyle,
    },
    {
      selector: '[data-tut="reactour__ExportKrona"]',
      content: () => {
        return (
          <div>
            <span>
              <h4>Make a krona plot</h4>
              <p>
                We can make a krona plot from the selected organisms by selecting the 'Export Data
                to Galaxy Australia for Krona Taxonomic Abundance Graph'
              </p>
              <p>
                After selecting this option the data is sent to Galaxy Australia, where a krona plot
                is made.
              </p>
              <p>
                Once the process is started a link to the process description help is displayed. See
                this link for further information{' '}
                <a
                  rel="noopener noreferrer"
                  target="_krona"
                  href="/static/bpaotu/rdc/Galaxy%20Australia%20-%20Krona%20Visualisation%20Quick%20Start%20Guide.pdf"
                >
                  (Krona link)
                </a>
              </p>
            </span>
          </div>
        )
      },
      style: stepsStyle,
    },
  ]

  const metagenomeSteps = [
    {
      selector: '[data-tut="reactour__RequestMetagenomeFiles"]',
      content: () => {
        return (
          <div>
            <span>
              <h4>Request Metagenome Files</h4>
              <p>
                Click on the 'Request metagenome files for all selected samples' to send a
                metagenome data request.
              </p>
              <p>
                You will be given a list of data object types for different workflow activities to
                select from.
              </p>
            </span>
          </div>
        )
      },
      style: stepsStyle,
    },
    {
      selector: '[data-tut="reactour__ExportContextualOnly"]',
      content: () => {
        return (
          <div>
            <span>
              <h4>Export the contextual data as CSV</h4>
              <p>
                Contextual data can be exported as CSV by clicking the 'Download Contextual Data
                only (CSV)'. This will only provide the sample metadata, not the ASV table.
              </p>
            </span>
          </div>
        )
      },
      style: stepsStyle,
    },
  ]

  const specificSteps = metagenome ? metagenomeSteps : ampliconSteps

  return [...commonSteps, ...specificSteps, contactStep]
}

const MainTutorial = (props) => {
  const { track } = useAnalytics()
  const { isMainTourOpen, setIsMainTourOpen, mainTourStep, setMainTourStep, isGraphTourOpen } =
    useContext(TourContext)

  const steps = tourSteps(props)

  // all steps are zero-indexed
  const lastStep = steps.length - 1
  const startAt = mainTourStep === lastStep ? 0 : mainTourStep

  return (
    <>
      <Tutorial
        steps={steps}
        startAt={startAt}
        isOpen={isMainTourOpen && !isGraphTourOpen}
        getCurrentStep={(curr) => setMainTourStep(curr)}
        onRequestClose={() => {
          setIsMainTourOpen(false)
          if (mainTourStep === lastStep) {
            track('otu_tutorial_main_complete')
          } else {
            track('otu_tutorial_main_incomplete', { step: mainTourStep })
          }
        }}
        lastStepNextButton={'End Tutorial'}
      />
      <TutorialBadge
        id="mainTutorial"
        onClick={() => {
          setIsMainTourOpen(true)
          track('otu_tutorial_main_open')
        }}
        tooltip="Get a tour of the available features in the BPA-OTU data portal"
      />
    </>
  )
}

const mapStateToProps = (state) => {
  return {
    definitions_url: state.contextualDataDefinitions.definitions_url,
    scientific_manual_url: state.contextualDataDefinitions.scientific_manual_url,
  }
}

export default connect(mapStateToProps, null)(withRouter(MainTutorial))
