import React from 'react'
import Tour, { Navigation, Dot, Controls, Arrow } from 'reactour'
import { withRouter } from 'react-router-dom';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'
import {Badge} from 'reactstrap'
import Octicon from '../components/octicon'

const stepsStyle = {
  backgroundColor: 'rgb(0 0 0 / 90%)',
  color: 'rgb(255 255 255 / 70%)',
  padding: '50px 30px',
  boxShadow: 'rgb(0 0 0 / 30%) 0px 0.5em 3em',
  width: '700px',
}

const steps = [
  {
    content: () => {
      return (
        <div>
          <span>
          <h4>Welcome to Australian Microbiome Data Barcode Products Portal</h4><br/>
            For more information about the portal{' '}<a rel="noopener noreferrer" target="_bpaotu" href="https://data.bioplatforms.com/organization/pages/australian-microbiome/processed">go here.</a>.<br/><br/>
            Let's start with a brief introduction and example to the portal.  <br/>For this example, we'll find all ASV's classified as Verrucomicrobia, from grassland soils.<br/> 
        </span>
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
          <span>
            <h4>Select Amplicon and Taxonomy</h4><br/>
            We first need to select an amplicon. In our example case amplicon == '27f519r_bacteria'.<br/><br/>
            This selection will cause the lower level taxonomies to filtered to those available in the upper selection. We now need to select our target kingdom and phylum.<br/><br/>
            Select Kingdom is 'd__Bacteria' to keep only sequences hitting the bacterial target the primers were designed for.<br/><br/>
            Select Phylum is 'p__Verrucomicrobiota'.<br/><br/>
            For more details about taxonomy selection <a rel="noopener noreferrer" target="_bpaotu" href='https://data.bioplatforms.com/organization/pages/australian-microbiome/processed'>go here.</a>.<br/>
        </span>
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
          <span>
            <h4>Select the appropriate metadata attributes</h4><br/>
            We can now  select the sample environment, in our example case 'Soil'<br/><br/>
            Note that, no selection here (---) will include both terrestrial and marine samples to subsequent steps.<br/><br/>
            For our example, we will further refine the search to include:<br/><br/>
            Vegetation Type is Grassland<br/>
            Depth between 0 - 0.1<br/><br/>
            For more details about metadata selection <a rel="noopener noreferrer" target="_bpaotu" href='https://data.bioplatforms.com/organization/pages/australian-microbiome/processed'>go here.</a>.<br/>
        </span>
        </div>
      )
    },
    style: stepsStyle,
  },
  {
    selector: '[data-tut="reactour__SearchButton"]',
    content: () => {
      return (
        <div>
          <span>
            <h4>Search database</h4><br/>
            Now that the search parameters are entered hit "search" and the data requested will be returned.<br/>
        </span>
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
          <span>
            <h4>View Results</h4><br/>
            Once the database search is complete all samples with the desired data (Verrucomicrobia ASV's from surface soils) will be shown in the results section at the bottom of the page.<br/><br/>
            Here you can see each sample that has the search attributes and the attribute data.<br/><br/>
            There are also multiple exploration and export buttons, which we'll explore in the following steps.<br/><br/>
            To see details about a single sample, click on the sample link under 'SampleID' in the results list, this will take to ALL raw sequencing data for that sample.<br/><br/>
            Let's view the results on a map<br/>
        </span>
        </div>
      )
    },
      style: stepsStyle,
  },
  {
    selector: '[data-tut="Show results on Map"]',
    content: ({ goTo }: { goTo: (step: number) => void }) => {
      if(document.getElementById('reactour__SamplesMap')) {
        setTimeout(() => {
          goTo(6)
        }, 0)
      }
      else {
        document.getElementById('Show results on Map').addEventListener('click', () => {
          setTimeout(() => {
            goTo(6)
          }, 10)
        })
      }
      return (
        <div>
          <span>
          <h4>View results map</h4><br/>
          Click the 'Show results on Map' button<br/><br/>
          This will load a map of the location of the selected samples<br/> 
        </span>
        </div>
      )
      // return 'Click button to Show results on Map.'
    },
    // action: node => {
    //   console.log(node)
    //   node.click()
    //   // var element = document.getElementById('Show results on Map');
    //   // console.log(element)
    //   // node.addEventListener('click', () => console.log('Clickedddddddd'))
    //   // element.addEventListener('change', () => this.setState({ tourStep: this.state.tourStep++ })
    // },
    style: stepsStyle,
  },
  {
    selector: '[data-tut="reactour__SamplesMap"]',
    content:({ goTo }: { goTo: (step: number) => void }) => {
      if(!document.getElementById('reactour__SamplesMap')) {
        setTimeout(() => {
          goTo(8)
        }, 0)
      }
      return (
        <div>
          <span>
            <h4>View results map</h4><br/>
            The map shows the location of samples, the number of samples per location, community richness, and a heat map of sequence abundance.<br/><br/>
            You can toggle the features by selecting layers button on the right.<br/><br/>
            For more information on the map, <a rel="noopener noreferrer" target="_bpaotu" href='https://data.bioplatforms.com/organization/pages/australian-microbiome/processed'>go here</a>.<br/>
        </span>
        </div>
      )
    },
    style: stepsStyle,
    position: [60, 100],
  },
  {
    selector: '[data-tut="reactour__CloseSamplesMapModal"]',
    // content:'Click close button to close Map View.',
    content: ({ goTo }: { goTo: (step: number) => void }) => {
      const nstep = document.getElementById('reactour__CloseSamplesMapModal')?8:5
        setTimeout(() => {
          goTo(nstep)
        }, 0)
      return (
        <div>
          <span>
          <h4>Close map view</h4><br/>
          Click close button to close Map View.<br/>
        </span>
        </div>
      )
      // return 'Click close button to close Map View.'
    },
    action: node => {
      if(node){
        // console.log(node)
        const closeButton = node.querySelector('.close')
        if(closeButton){
          // console.log(closeButton);
          closeButton.click();
        }
      }
    },
    style: stepsStyle,
  },
  {
    selector: '[data-tut="Show results on Graph"]',
    content: ({ goTo }: { goTo: (step: number) => void }) => {
      if(document.getElementById('reactour__SamplesGraph')) {
        setTimeout(() => {
          goTo(9)
        }, 0)
      }
      else {
        document.getElementById('Show results on Graph').addEventListener('click', () => {
            setTimeout(() => {
              goTo(9)
            }, 10)
        })
      }  
      return (
        <div>
          <span>
          <h4>Show the results on graphs</h4><br/>
          We can also explore the data visually.<br/><br/> 
          Click the 'Show results on Graph' button.<br/> 
        </span>
        </div>
      )
    },
    style: stepsStyle,
  },
  {
    selector: '[data-tut="reactour__SamplesGraph"]',
    content:({ goTo }: { goTo: (step: number) => void }) => {
      var element = document.getElementById('reactour__SamplesGraph')
      if(!element) {
        setTimeout(() => {
          goTo(11)
        }, 0)
      }
      return (
        <div>
          <span>
            <h4>Show the results on graphs</h4><br/>
            This will load all of your search parameters and results into some summary figures<br/><br/>
            Other contextual data associated with the samples can be explored here.  For example, look at the pH range of soils selected<br/><br/>
            For more information on graphs page, <a rel="noopener noreferrer" target="_bpaotu" href='https://data.bioplatforms.com/organization/pages/australian-microbiome/processed'>go here</a>.<br/>
          </span>
        </div>
      )
    },
    style: stepsStyle,
    position: [60, 100],
  },
  {
    selector: '[data-tut="reactour__CloseSamplesGraphModal"]',
    content: ({ goTo }: { goTo: (step: number) => void }) => {
      const nstep = document.getElementById('reactour__CloseSamplesGraphModal')?11:8
        setTimeout(() => {
          goTo(nstep)
        }, 0)
      return (
        <div>
          <span>
          <h4>Close graph view</h4><br/>
          Click close button to close Graph View.<br/>
        </span>
        </div>
      )
    },
    action: node => {
      if(node){
        const closeButton = node.querySelector('.close')
        if(closeButton){
          closeButton.click();
        }
      }
    },
    style: stepsStyle,
  },
  {
    selector: '[data-tut="Make Krona Taxonomic Abundance Graph using Galaxy Australia"]',
    content:() => {
      return (
        <div>
          <span>
            <h4>Make a krona plot</h4><br/>
            We can make a krona plot from the selected organisms by selecting the 'Make Krona Taxonomic Abundance Graph using Galaxy Australia'<br/><br/>
            After selecting this option the data is sent to Galaxy Australia, where a krona plot is made.<br/><br/>
            Once the process is started a link to the process description help is displayed. See this link for further information <a rel="noopener noreferrer" target="_krona" href="/static/bpaotu/rdc/Galaxy%20Australia%20-%20Krona%20Visualisation%20Quick%20Start%20Guide.pdf">(Krona link)</a><br/>
          </span>
        </div>
      )
    },
      style: stepsStyle,
  },
  {
    selector: '[data-tut="Export Data to Galaxy Australia for further analysis"]',
    content: () => {
      return (
        <div>
          <span>
            <h4>Export data to Galaxy for further analysis</h4><br/>
            Data can be exported to Galaxy Australia for further analysis by clicking the 'Export to "galaxy 'Australia' button<br/>
            Once data is sent to galaxy it is available for analysis in users galaxy workspace<br/>
            If users are not galaxy users, a user account is set up for you using your AM associated email details<br/>
            See this link for further information <a rel="noopener noreferrer" target="_krona" href="/static/bpaotu/rdc/Galaxy Australia - Quick Start Guide.pdf">(Galaxy link)</a><br/>
        </span>
        </div>
      )
    },
    style: stepsStyle,
  },
  {
    selector: '[data-tut="Export Search Results - Only Contextual Data (CSV)"]',
    content:() => {
      return (
        <div>
          <span>
            <h4>Export the data as CSV</h4><br/>
            The most common way for our users to export data for downstream analyses is as CSV<br/><br/>
            Data can be exported as CSV by clicking the 'Export Search Results - Only Contextual Data (CSV)'<br/><br/>
            The Contextual Only option will provide only the sample metadata, not the ASV table<br/><br/>
          </span>
        </div>
      )
    },
    style: stepsStyle,
  },
  {
    selector: '[data-tut="Export Search Results (CSV)"]',
    content:() => {
      return (
        <div>
          <span>
            <h4>Export the data as CSV</h4><br/>
            Data can be exported as CSV by clicking the 'Export Search Results (CSV)'<br/><br/>
            The full export option will export both the metadata and the ASV table<br/>
          </span>
        </div>
      )
    },
    style: stepsStyle,
  },
  {
    selector: '[data-tut="Export Search Results (Phinch compatible BIOM)"]',
    content:() => {
      return (
        <div>
          <span>
            <h4>Export the data as BIOM</h4><br/>
            It is also possible to export the data in a BIOM format (JSON) that is compatible with PHINCH (<a rel="noopener noreferrer" target="_phinch" href="http://phinch.org">http://phinch.org</a>)<br/><br/>
            The BIOM formatted results can be exported by selecting the 'Export Search Results (Phinch compatible BIOM)<br/>
          </span>
        </div>
      )
    },
    style: stepsStyle,
  },
  {
    content:() => {
      return (
        <div>
          <span>
            <h4>End of the Tutorial</h4><br/>
            If you have any queries, please contact us at <a href="mailto:help@bioplatforms.com">help@bioplatforms.com</a><br/><br/>
          </span>
        </div>
      )
    },
    style: stepsStyle,
  },
];

class BPAOTUTour extends React.Component<any> {
  state = {
    isTourOpen: false,
    tourStep: 0
  }
  disableBody = target => disableBodyScroll(target)
  enableBody = target => enableBodyScroll(target)
  setIsTourOpen(action) {
    this.setState({
      isTourOpen: action,
      tourStep: this.state.tourStep
    })
  }
  render() {
    const accentColor = '#007bff'
    return (
      <>
        <Tour
          startAt={0}
          steps={steps}
          // goToStep={this.state.tourStep}
          prevButton={'<< Prev'} 
          nextButton={'Next >>'} 
          // showNavigation={false}
          // disableDotsNavigation={true}
          disableFocusLock={true}
          // prevStep={(defaultNext) => {(defaultNext==2) && defaultNext()}}
          badgeContent={(curr, tot) => `${curr} of ${tot}`}
          accentColor={accentColor}
          rounded={5}
          isOpen={this.state.isTourOpen}
          onRequestClose={() => this.setIsTourOpen(false)}
          onAfterOpen={this.disableBody}
          onBeforeClose={this.enableBody}
          lastStepNextButton={'Close Tutorial'}
          // CustomHelper={this.BPAOTUHelper}
        />
        <Badge onClick={() => {
        this.setIsTourOpen(true)
        this.props.history.push('/')
        }} color="dark" pill style={{cursor:'pointer'}}><Octicon name="book" />{' '}Tutorial </Badge>
      </>
    )
  }

  BPAOTUHelper({ current, content, totalSteps, gotoStep, close }) {
    return (
      <main className="CustomHelper__wrapper">
        {/* <aside className="CustomHelper__sidebar">
          <span className="CustomHelper__sidebar_step">Step {current + 1}</span>
          <img
             className="CustomHelper__sidebar_img"
             src={`https://avataaars.io/?avatarStyle=Circle&topType=LongHairNotTooLong&accessoriesType=${accessories[current]}&hairColor=Brown&facialHairType=BeardLight&facialHairColor=Black&clotheType=BlazerSweater&eyeType=WinkWacky&eyebrowType=UpDownNatural&mouthType=Smile&skinColor=Pale`}
           />
          <span className="CustomHelper__sidebar_step">Lorem Ipsum</span>
        </aside> */}
        <div className="CustomHelper__content">
          <Badge
              className="CustomHelper__controls"
              style={{ position: 'absolute' }}
            />
          {content}
          <Controls
            data-tour-elem="controls"
            className="CustomHelper__controls text-center"
            style={{ position: 'absolute' }}
          >
            <Arrow
              onClick={() => gotoStep(current - 1)}
              disabled={current === 0}
              className="CustomHelper__navArrow"
            />
            <Navigation data-tour-elem="navigation">
              {Array.from(Array(totalSteps).keys()).map((li, i) => (
                <Dot
                  key={li}
                  onClick={() => current !== i && gotoStep(i)}
                  current={current}
                  index={i}
                  disabled={current === i}
                  showNumber={true}
                  data-tour-elem="dot"
                />
              ))}
            </Navigation>
            <Arrow
              onClick={() => gotoStep(current + 1)}
              disabled={current === totalSteps - 1}
              className="CustomHelper__navArrow"
              inverted
            />
          </Controls>
        </div>
      </main>
    )
  }
}

export default withRouter(BPAOTUTour);
