import React, { useContext, useEffect, useState } from 'react'
import { isString, pickBy, keys, join, values, filter } from 'lodash'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Button,
  Input,
  Label,
  FormGroup,
  Alert,
} from 'reactstrap'

import AnimateHelix, { loadingstyle } from 'components/animate_helix'
import { Tutorial, stepsStyle } from 'components/tutorial'
import { TourContext } from 'providers/tour_provider'

import { runKronaRequest, closeKronaModal } from '../reducers/krona_modal'

const InfoBox = (props) => (
  <div
    className="alert-secondary btn-sm"
    style={{
      display: 'inline-block',
      marginRight: '1em',
      borderWidth: '1px',
      borderStyle: 'solid',
    }}
  >
    {props.children}
  </div>
)

const KronaModal = (props) => {
  const [selected, setSelected] = useState({})

  console.log('KronaModal', 'props', props)

  const { isLoading, runKronaRequest, sample_id } = props

  const handleSubmit = (event) => {
    runKronaRequest(sample_id)

    // .then((response) => {
    //   console.log('handleSubmit', 'response', response)
    // })
    // .catch((error) => {
    //   console.log('handleSubmit', 'error', error)
    // })
  }

  const closeModal = () => {
    props.closeKronaModal()
  }

  const modalBody = () => {
    return (
      <div>
        <Button type="button" onClick={handleSubmit} color="primary">
          Run
        </Button>
        <p>isLoading: {isLoading.toString()}</p>
        <p>sample id: {sample_id}</p>
      </div>
    )
  }

  const modalFooter = () => {
    return (
      <Button type="button" onClick={closeModal} color="primary">
        Close
      </Button>
    )
  }

  return (
    <Modal
      isOpen={props.isOpen}
      scrollable={true}
      fade={true}
      data-tut="reactour__KronaPlotModal"
      id="KronaPlotModal"
    >
      <ModalHeader
        toggle={closeModal}
        data-tut="reactour__CloseKronaPlotModal"
        id="CloseKronaPlotModal"
      >
        Krona Plots
      </ModalHeader>
      <ModalBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {modalBody()}
      </ModalBody>
      <ModalFooter>{modalFooter()}</ModalFooter>
    </Modal>
  )
}

const mapStateToProps = (state) => {
  const { isOpen, isLoading, sample_id, error } = state.searchPage.kronaModal

  console.log('mapStateToProps', 'state.searchPage.kronaModal', state.searchPage.kronaModal)

  return {
    isOpen,
    isLoading,
    sample_id,
    error,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      runKronaRequest,
      closeKronaModal,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(KronaModal as any)

// const steps = [
//   {
//     selector: '[data-tut="reactour__KronaPlotModal"]',
//     content: () => {
//       return (
//         <div>
//           <h4>Krona Plots</h4>
//           <p>
//             TODO.
//           </p>
//         </div>
//       )
//     },
//     style: stepsStyle,
//     position: [60, 100],
//   },
// ]

/*      <Tutorial
        steps={steps}
        isOpen={isRequestSubtourOpen}
        showCloseButton={false}
        showNumber={false}
        onRequestClose={() => {
          setIsRequestSubtourOpen(false)
          setIsMainTourOpen(true)
          const node = document.getElementById('CloseKronaPlotModal')
          const closeButton = node.querySelector('.close')
          if (closeButton instanceof HTMLElement) {
            closeButton.click()
          }
        }}
        lastStepNextButton="Back to Tutorial"
      />*/

// const {
//   isMainTourOpen,
//   setIsMainTourOpen,
//   mainTourStep,
//   setMainTourStep,
//   isRequestSubtourOpen,
//   setIsRequestSubtourOpen,
// } = useContext(TourContext)

// useEffect(() => {
//   if (props.isOpen) {
//     if (isMainTourOpen) {
//       setIsMainTourOpen(false)
//       setIsRequestSubtourOpen(true)
//     }
//   } else {
//     if (isRequestSubtourOpen) {
//       setIsMainTourOpen(true)
//       setIsRequestSubtourOpen(false)
//       // Note: we don't auto increment the mainTourStep when closing modal subtour (like for other subtours)
//       // because the tour steps that launch this subtour has lots of text and users might click the
//       // 'Request all' or 'Request on' buttons before finishing reading them all
//       setMainTourStep(mainTourStep)
//     }
//   }
// }, [
//   props,
//   isMainTourOpen,
//   isRequestSubtourOpen,
//   setIsMainTourOpen,
//   setIsRequestSubtourOpen,
//   mainTourStep,
//   setMainTourStep,
// ])
