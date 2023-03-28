import React from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Modal, ModalBody, ModalHeader, ModalFooter, Button, Input, Label, FormGroup, Alert} from 'reactstrap'

import analytics from 'app/analytics'
import { isString, pickBy, keys, join } from 'lodash'
import { closeMetagenomeModal } from '../reducers/metagenome_modal'
import { describeSearch } from '../reducers/search'
import { metagenome_rows } from './metagenome_rows'
import { values, filter} from 'lodash'
import AnimateHelix, { loadingstyle } from '../../../components/animate_helix'
import { metagenomeRequest } from '../../../api'

const InfoBox = (props) => (
    <div className="alert-secondary btn-sm" style={{
        display: 'inline-block',
        marginRight: '1em',
        borderWidth: '1px',
        borderStyle: 'solid'
    }}>
        {props.children}
    </div>)

class MetagenomeModal extends React.Component<any> {
    scrollRef: any
    state = {
        selected: {},
        requestState: 0, // See modalBody() below
        submissionResponse: {}
    }

    constructor(props) {
        super(props);
        this.handleChecboxChange = this.handleChecboxChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.closeModal = this.closeModal.bind(this)
        this.modalBody = this.modalBody.bind(this)
        this.modalFooter = this.modalFooter.bind(this)
        this.scrollRef = React.createRef()
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.requestState !== prevState.requestState && this.scrollRef.current) {
            this.scrollRef.current.scrollIntoView()
        }
    }

    handleChecboxChange(event) {
        const target = event.target;
        const value = target.checked;
        const name = target.name;
        this.setState((state: any) => {
            return {
                selected: {
                    ...state.selected,
                    [name]: value
                }
            };
        });
    }

    handleSubmit(event) {
        event.preventDefault();
        if (this.state.requestState === 1) {
            analytics.track('otu_request_metagenome_files')

            metagenomeRequest(
                this.props.sample_ids,
                keys(pickBy(this.state.selected))).then(response => {
                    this.setState({
                        submissionResponse: response,
                        requestState: 3 // Request acknowledged
                    })
                }).catch(err => {
                    this.setState({
                        submissionResponse: err.response,
                        requestState: 4}) // Request failed
                });
        }
        this.setState(
            // Step through request states. 0 (select file types) → 1 (submit
            // request) → 2 (waiting for response)
            (state: any, props) => ({requestState:
                (state.requestState < 2)? state.requestState+1: state.requestState}))
    }

    closeModal() {
        this.setState({submissionResponse: {}, requestState: 0})
        this.props.closeMetagenomeModal()
    }

    get_rows() {
        return metagenome_rows.map((row, index) => {
            // Note: key={index} is OK here as metagenome_rows is a constant
            if (isString(row)) {
                return <tr className="table-secondary" key={"r" + index}>
                    <th colSpan={4}>{row}</th>
                </tr>
            }
            return <tr key={"r" + index} >
                <td>{row[0]}</td>
                <td>{row[1]}</td>
                <td>
                    <FormGroup check>
                        <Label>
                            <Input type='checkbox'
                                name={row[2].toString()}
                                onChange={this.handleChecboxChange}
                                checked={this.state.selected[row[2].toString()] || false} />
                            {row[2]}
                        </Label>
                    </FormGroup>
                </td>
            </tr>
        })
    }

    modalBody() {
        const response: any = this.state.submissionResponse
        if (this.props.error || this.state.requestState === 4) {
            return <Alert color="danger">
                {this.props.error && <>Search failed: {this.props.error}</>}
                {(this.state.requestState === 4 &&
                    <>
                        Submission failed: {
                            response &&
                            `${response.status}: ${response.statusText}. ${response.data}`}
                    </>)}
            </Alert>
        }
        if (this.props.isLoading || this.state.requestState === 2) {
            return <div style={loadingstyle}>
                <AnimateHelix />
            </div>
        }

        switch (this.state.requestState) {
            case 0: // Select file types
                return <>
                    <p>
                        Metagenome files for
                        {(this.props.sample_ids.length === 1) ?
                            (<> sample {this.props.sample_ids[0]}</>) :
                            (<> {this.props.sample_ids.length} samples</>)}
                    </p>
                    <table role="table" className="table table-bordered table-striped">
                        <thead>
                            <tr className="table-primary">
                                <th>Data object type</th>
                                <th>Description</th>
                                <th>Request</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                this.get_rows()
                            }
                        </tbody>
                    </table>
                </>
            case 1: // Show confirmation page
                return <div ref={this.scrollRef}>
                    <p>Please confirm metagenome data request for file types</p>
                    <div style={{ paddingLeft: '2em', marginBottom: '1rem' }}>
                        {keys(pickBy(this.state.selected)).map(
                            (v) => (<InfoBox key={v}>{v}</InfoBox>)
                        )}
                    </div>
                    <p>
                        for {this.props.sample_ids.length !== 1 ?
                            `${this.props.sample_ids.length} samples:` :
                            "sample:"}
                    </p>
                    <p style={{ marginLeft: '2em', padding: '1em', border: '1px solid #ccc' }}>
                        {join(this.props.sample_ids, ', ')}
                    </p>
                </div>
            case 2: // Waiting for submission response
                return <span>Submitting…</span>
            case 3: // Good response
                const data = response.data
                return <Alert color="success">
                    <h4>Thank you for your data request</h4>
                    <p>
                        Your request id
                        is <strong>{data.request_id}</strong>,lodged
                        at {data.timestamp}
                    </p>
                    <p>
                        We will be in touch. Please
                        contact <a href={"mailto:" + data.contact}>{data.contact}</a> for
                        more information.
                    </p>
                </Alert>
        }
    }

    modalFooter() {
        if (this.state.requestState > 2 || this.props.error) {
            return <Button
                type="button"
                onClick={this.closeModal}
                color="primary">
                Close
            </Button>
        }
        const n_selected = filter(values(this.state.selected)).length
        const sample_msg = (this.props.sample_ids.length === 1) ?
            ('sample ' + this.props.sample_ids[0]) :
            (this.props.sample_ids.length.toString() + ' samples')

        if (this.state.requestState === 0) {
            return <Button
                type="submit"
                onClick={this.handleSubmit}
                color="primary"
                disabled={n_selected < 1}>
                Request {n_selected} metagenome files for {sample_msg}
            </Button>
        } else {
            return <>
                <Button
                    type="button"
                    onClick={this.closeModal}
                    color="secondary">
                    Cancel
                </Button>

                <Button
                    type="submit"
                    onClick={this.handleSubmit}
                    color="primary"
                    disabled={n_selected < 1}>
                    Confirm
                </Button>
            </>
        }
    }

    render() {
        return (
            <Modal isOpen={this.props.isOpen} scrollable={true} fade={true}>
                <ModalHeader toggle={this.closeModal}>
                    Metagenome data request
                </ModalHeader>
                <ModalBody style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    { this.modalBody() }
                </ModalBody>
                <ModalFooter>
                    { this.modalFooter() }
                </ModalFooter>
            </Modal>
        );
    }
}

function mapStateToProps(state) {
    const { isOpen, isLoading, sample_ids, error} = state.searchPage.metagenomeModal
    return {
        isOpen,
        isLoading,
        sample_ids,
        error,
        ckanAuthToken: state.auth.ckanAuthToken,
        describeSearch: () => describeSearch(state)
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MetagenomeModal)
