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
import { Tutorial } from 'components/tutorial'
import { TourContext } from 'providers/tour_provider'

import { metagenomeRequest } from 'api'
import { useAnalytics } from 'use-analytics'

import { closeMetagenomeModal } from '../reducers/metagenome_modal'
import { describeSearch } from '../reducers/search'

import { metagenome_rows } from './metagenome_rows'

const stepsStyle = {
  backgroundColor: 'rgb(30 30 30 / 90%)',
  color: 'rgb(255 255 255 / 90%)',
  padding: '50px 30px',
  boxShadow: 'rgb(0 0 0 / 30%) 0px 0.5em 3em',
  maxWidth: '500px',
}

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

interface SubmissionResponse {
  status?: number
  statusText?: string
  data?: SubmissionResponseData
}

interface SubmissionResponseData {
  request_id: string
  timestamp: string
  contact: string
}

const MetagenomeModal = (props) => {
  const [selected, setSelected] = useState({})
  const [requestState, setRequestState] = useState(0)
  const [submissionResponse, setSubmissionResponse] = useState<SubmissionResponse>({})

  const { track } = useAnalytics()

  const {
    isMainTourOpen,
    setIsMainTourOpen,
    mainTourStep,
    setMainTourStep,
    isRequestTourOpen,
    setIsRequestTourOpen,
  } = useContext(TourContext)

  useEffect(() => {
    if (props.isOpen) {
      if (isMainTourOpen) {
        setIsMainTourOpen(false)
        setIsRequestTourOpen(true)
      }
    } else {
      if (isRequestTourOpen) {
        setIsMainTourOpen(true)
        setIsRequestTourOpen(false)
        setMainTourStep(mainTourStep + 1)
      }
    }
  }, [props, isMainTourOpen, isRequestTourOpen, setIsMainTourOpen, setIsRequestTourOpen])

  const handleChecboxChange = (event) => {
    const target = event.target
    const value = target.checked
    const name = target.name

    setSelected((prevSelected) => ({
      ...prevSelected,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (requestState === 1) {
      track('otu_request_metagenome_files')

      metagenomeRequest(props.sample_ids, keys(pickBy(selected)))
        .then((response) => {
          setSubmissionResponse(response)
          setRequestState(3) // Request acknowledged
        })
        .catch((err) => {
          setSubmissionResponse(err.response)
          setRequestState(4) // Request failed
        })
    }

    // Step through request states.
    // 0 (select file types)
    // → 1 (submit request)
    // → 2 (waiting for response)
    setRequestState((prevRequestState) =>
      prevRequestState < 2 ? prevRequestState + 1 : prevRequestState
    )
  }

  const closeModal = () => {
    setSubmissionResponse({})
    setRequestState(0)
    props.closeMetagenomeModal()
  }

  const getRows = () => {
    return metagenome_rows.map((row, index) => {
      // Note: key={index} is OK here as metagenome_rows is a constant
      if (isString(row)) {
        return (
          <tr className="table-secondary" key={'r' + index}>
            <th colSpan={4}>{row}</th>
          </tr>
        )
      }

      return (
        <tr key={'r' + index}>
          <td>{row[0]}</td>
          <td>{row[1]}</td>
          <td>
            <FormGroup check>
              <Label>
                <Input
                  type="checkbox"
                  name={row[2].toString()}
                  onChange={handleChecboxChange}
                  checked={selected[row[2].toString()] || false}
                />
                {row[2]}
              </Label>
            </FormGroup>
          </td>
        </tr>
      )
    })
  }

  const modalBody = () => {
    const { status, statusText, data } = submissionResponse

    if (props.error || requestState === 4) {
      return (
        <Alert color="danger">
          {props.error && <>Search failed: {props.error}</>}
          {requestState === 4 && (
            <>Submission failed: {submissionResponse && `${status}: ${statusText}. ${data}`}</>
          )}
        </Alert>
      )
    }

    if (props.isLoading || requestState === 2) {
      return (
        <div style={loadingstyle}>
          <AnimateHelix />
        </div>
      )
    }

    switch (requestState) {
      case 0: // Select file types
        return (
          <>
            <p>
              Metagenome files for
              {props.sample_ids.length === 1 ? (
                <> sample {props.sample_ids[0]}</>
              ) : (
                <> {props.sample_ids.length} samples</>
              )}
            </p>
            <table role="table" className="table table-bordered table-striped">
              <thead>
                <tr className="table-primary">
                  <th>Data object type</th>
                  <th>Description</th>
                  <th>Request</th>
                </tr>
              </thead>
              <tbody>{getRows()}</tbody>
            </table>
          </>
        )
      case 1: // Show confirmation page
        return (
          <div>
            <p>Please confirm metagenome data request for file types</p>
            <div style={{ paddingLeft: '2em', marginBottom: '1rem' }}>
              {keys(pickBy(selected)).map((v) => (
                <InfoBox key={v}>{v}</InfoBox>
              ))}
            </div>
            <p>
              for{' '}
              {props.sample_ids.length !== 1 ? `${props.sample_ids.length} samples:` : 'sample:'}
            </p>
            <p style={{ marginLeft: '2em', padding: '1em', border: '1px solid #ccc' }}>
              {join(props.sample_ids, ', ')}
            </p>
          </div>
        )
      case 2: // Waiting for submission response
        return <span>Submitting…</span>
      case 3: // Good response
        const { request_id, timestamp, contact } = submissionResponse.data

        return (
          <Alert color="success">
            <h4>Thank you for your data request</h4>
            <p>
              Your request id is <strong>{request_id}</strong>, lodged at {timestamp}
            </p>
            <p>
              We will be in touch. Please contact <a href={'mailto:' + contact}>{contact}</a> for
              more information.
            </p>
          </Alert>
        )
    }
  }

  const modalFooter = () => {
    if (requestState > 2 || props.error) {
      return (
        <Button type="button" onClick={closeModal} color="primary">
          Close
        </Button>
      )
    }

    const n_selected = filter(values(selected)).length
    const sample_msg =
      props.sample_ids.length === 1
        ? 'sample ' + props.sample_ids[0]
        : props.sample_ids.length.toString() + ' samples'

    if (requestState === 0) {
      return (
        <Button type="submit" onClick={handleSubmit} color="primary" disabled={n_selected < 1}>
          Request {n_selected} metagenome files for {sample_msg}
        </Button>
      )
    } else {
      return (
        <>
          <Button type="button" onClick={closeModal} color="secondary">
            Cancel
          </Button>

          <Button type="submit" onClick={handleSubmit} color="primary" disabled={n_selected < 1}>
            Confirm
          </Button>
        </>
      )
    }
  }

  const steps = [
    {
      selector: '[data-tut="reactour__MetagenomeDataRequestModal"]',
      content: () => {
        return (
          <div>
            <h4>Request Metagenome Files</h4>
            <p>TODO Blah blah blah</p>
          </div>
        )
      },
      style: stepsStyle,
      position: [60, 100],
    },
  ]

  return (
    <Modal
      isOpen={props.isOpen}
      scrollable={true}
      fade={true}
      data-tut="reactour__MetagenomeDataRequestModal"
      id="MetagenomeDataRequestModal"
    >
      <ModalHeader
        toggle={closeModal}
        data-tut="reactour__CloseMetagenomeDataRequestModal"
        id="CloseMetagenomeDataRequestModal"
      >
        Metagenome data request
      </ModalHeader>
      <ModalBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {modalBody()}
      </ModalBody>
      <ModalFooter>{modalFooter()}</ModalFooter>
      <Tutorial
        steps={steps}
        isOpen={isRequestTourOpen}
        showCloseButton={false}
        showNumber={false}
        onRequestClose={() => {
          setIsRequestTourOpen(false)
          setIsMainTourOpen(true)
          const node = document.getElementById('CloseMetagenomeDataRequestModal')
          const closeButton = node.querySelector('.close')
          if (closeButton instanceof HTMLElement) {
            closeButton.click()
          }
        }}
        lastStepNextButton="Back to Tutorial"
      />
    </Modal>
  )
}

function mapStateToProps(state) {
  const { isOpen, isLoading, sample_ids, error } = state.searchPage.metagenomeModal
  return {
    isOpen,
    isLoading,
    sample_ids,
    error,
    ckanAuthToken: state.auth.ckanAuthToken,
    describeSearch: () => describeSearch(state),
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      closeMetagenomeModal,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(MetagenomeModal as any)
