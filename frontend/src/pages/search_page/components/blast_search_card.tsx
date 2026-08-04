import React, { useEffect } from 'react'
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  FormGroup,
  Col,
  Input,
  Label,
  UncontrolledTooltip,
} from 'reactstrap'
import Octicon from 'components/octicon'
import AnimateHelix from 'components/animate_helix'

import { useAppDispatch, useAppSelector } from 'hooks/redux'

import {
  clearBlastAlert,
  handleBlastSequence,
  handleBlastParameters,
  runBlast,
  cancelBlast,
} from '../reducers/blast_search_modal'
import { getAmpliconFilter } from '../reducers/amplicon'
import { search, hasSearchChanged } from '../reducers/search'

const blastStatusMapping = {
  init: 'Initialising',
  fetch: 'Fetching samples',
  making_db_fasta: 'Making db.fasta of OTUs',
  makeblastdb: 'Running makeblastdb',
  write_query: 'Building query',
  execute_blast: 'Executing BLAST Search',
  write_output_raw: 'Writing raw output',
  write_output_sample: 'Writing sample output',
  write_output_map: 'Drawing map',
  write_output_compress: 'Building download package',
  cancelled: 'Cancelled',
  complete: 'Complete',
}

const BlastSearchCard = () => {
  const dispatch = useAppDispatch()

  const {
    alerts,
    blastParams,
    status: blastStatus,
    imageSrc,
    isSubmitting,
    sequenceValue,
  } = useAppSelector((state) => state.searchPage.blastSearchModal)

  const searchChanged = useAppSelector((state) =>
    hasSearchChanged(state)
  )

  useEffect(() => {
    if (searchChanged) {
      dispatch(search(null))
    }
  }, [dispatch, searchChanged])

  const isAmpliconSelected = useAppSelector(
    (state) => getAmpliconFilter(state).value
  )

  const isSearchDisabled = useAppSelector((state) => {
    const blast = state.searchPage.blastSearchModal

    return (
      getAmpliconFilter(state).value === '' ||
      blast.sequenceValue === '' ||
      blast.isSubmitting
    )
  })

  const isLoading = useAppSelector(
    (state) => state.searchPage.results.isLoading
  )

  const rowsCount = useAppSelector(
    (state) => state.searchPage.results.rowsCount
  )
  
  const wrapText = (text) => ({ __html: text })

  const handleParameterChange = (param: string, value: string) => {
    dispatch(
      handleBlastParameters({
        param,
        value,
      })
    )
  }
  
  const parentContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  } as React.CSSProperties
  const imageContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: '500px',
    // width: '50%', // don't restrict width as map can be wide for a large area
  } as React.CSSProperties
  const imageStyle = {
    maxWidth: '100%',
    maxHeight: '500px',
  } as React.CSSProperties
  const fetchingSamplesStyle = {
    paddingTop: '1em',
    paddingBottom: '0px',
    marginBottom: '0px',
  } as React.CSSProperties

  return (
    <Card>
      <CardHeader tag="h5">Search Parameters</CardHeader>
      <CardBody className="blast">
        <FormGroup row={true}>
          <Label sm={3}>
            qcov_hsp_perc{' '}
            <span id="blastTipQcov">
              <Octicon name="info" />
            </span>
            <UncontrolledTooltip target="blastTipQcov" placement="auto">
              Percent query coverage per hsp
            </UncontrolledTooltip>
          </Label>
          <Col sm={1}>
            <Input
              type="select"
              name="qcov_hsp_perc"
              value={blastParams['qcov_hsp_perc']}
              onChange={(evt) =>
                dispatch(
                  handleBlastParameters({
                    param: 'qcov_hsp_perc',
                    value: evt.target.value,
                  })
                )
              }
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="40">40</option>
              <option value="50">50</option>
              <option value="60">60</option>
              <option value="70">70</option>
              <option value="80">80</option>
              <option value="90">90</option>
            </Input>
          </Col>
        </FormGroup>
        <FormGroup row={true}>
          <Label sm={3}>
            perc_ident{' '}
            <span id="blastTipPercIdent">
              <Octicon name="info" />
            </span>
            <UncontrolledTooltip target="blastTipPercIdent" placement="auto">
              Percent identity per hsp
            </UncontrolledTooltip>
          </Label>
          <Col sm={1}>
            <Input
              type="select"
              name="perc_identity"
              value={blastParams['perc_identity']}
              onChange={(evt) =>
                dispatch(
                  handleBlastParameters({
                    param: 'perc_identity',
                    value: evt.target.value,
                  })
                )
              }
            >
              <option value="90">90</option>
              <option value="91">91</option>
              <option value="92">92</option>
              <option value="93">93</option>
              <option value="94">94</option>
              <option value="95">95</option>
              <option value="96">96</option>
              <option value="97">97</option>
              <option value="98">98</option>
              <option value="99">99</option>
            </Input>
          </Col>
        </FormGroup>
        <Input
          type="textarea"
          name="sequence"
          id="sequence"
          placeholder="Enter sequence here to run BLAST search against the selected amplicon and taxonomy/contextual filters"
          value={sequenceValue}
          disabled={!isAmpliconSelected}
          onChange={(evt) => dispatch(handleBlastSequence(evt.target.value))}
        />
        <div className="pt-2">
          {alerts.map((alert, idx) => (
            <Alert
              key={idx}
              color={alert.color}
              fade={false}
              className="text-center"
              toggle={() => dispatch(clearBlastAlert(idx))}
            >
              <div dangerouslySetInnerHTML={wrapText(alert.text)} />
            </Alert>
          ))}
        </div>
        <div className="pt-2">
          <div style={parentContainerStyle}>
            <div style={imageContainerStyle}>
              {imageSrc ? (
                <img src={imageSrc} alt="Location of BLAST results" style={imageStyle} />
              ) : (
                imageSrc === null && <p>No results to display</p>
              )}
            </div>
          </div>
        </div>
        {isSubmitting && (
          <div className="text-center">
            <AnimateHelix scale={0.2} />
            <p style={fetchingSamplesStyle}>{blastStatusMapping[blastStatus]}</p>
          </div>
        )}
      </CardBody>
      <CardFooter className="text-center">
        {isLoading ? (
          <div>
            <AnimateHelix scale={0.2} />
            <p style={fetchingSamplesStyle}>Fetching samples</p>
          </div>
        ) : rowsCount === 0 ? (
          <div>No Sample OTUs found for these search parameters</div>
        ) : (
          <>
            <Button color="warning" disabled={isSearchDisabled} onClick={() => dispatch(runBlast())}>
              Run BLAST
            </Button>
            {isSubmitting && (
              <div className="text-center" style={{ marginTop: 8 }}>
                <Button onClick={() => dispatch(cancelBlast())} size="sm">
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  )
}

export default BlastSearchCard
