import React from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Modal, ModalBody, ModalHeader, ModalFooter, Button, Input, Label, FormGroup, Form} from 'reactstrap'
import { isString } from 'lodash'
import { closeMetagenomeModal } from '../reducers/metagenome_modal'
import { metagenome_rows } from './metagenome_rows'
import { values, filter } from 'lodash'

function metagenomeDownloadURL(sampleId, fileType) {
    return "STUB/" + sampleId + '.' + fileType // FIXME. STUB
}

class MetagenomeModal extends React.Component<any> {

    state = {
        selected: {}
    }

    constructor(props) {
        super(props);
        this.handleChecboxChange = this.handleChecboxChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
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
        const formData = new FormData(event.target)
        const queryString = new URLSearchParams(formData as any).toString();

        // FIXME stub
        console.log('form submit', this.state, queryString)
      }

    render() {
        const n_selected = filter(values(this.state.selected)).length
        return (
            <Modal isOpen={this.props.isOpen} scrollable={true} fade={true}>
                <ModalHeader toggle={this.props.closeMetagenomeModal}>
                    <div>
                        <span>{'Metagenome download STUB'}</span>
                    </div>
                </ModalHeader>
                <ModalBody>
                    <Form id='metagenome-download-form' onSubmit={this.handleSubmit}>
                        {
                            (this.props.sample_id && this.props.sample_id !== '*') ? (
                                <p>
                                    Metagenome files for {this.props.sample_id}
                                </p>) : ''
                        }
                        <table role="table" className="table table-bordered table-striped">
                            <thead>
                                <tr className="table-primary">
                                    <th>Data object type</th>
                                    <th>Data object description</th>
                                    <th>Data object methodology</th>
                                    <th>Download</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metagenome_rows.map((column, index) => (
                                    // Note: index is safe as key here because it's a static array
                                    (isString(column)) ?
                                        <tr className="table-secondary" key={index}>
                                            <th colSpan={4}>{column}</th>
                                        </tr>
                                        :
                                        <tr key={index} >
                                            <td>{column[0]}</td>
                                            <td>{column[1]}</td>
                                            <td>{column[2]}</td>
                                            <td>{
                                                (this.props.sample_id === '*') ?
                                                    <FormGroup check>
                                                        <Label>
                                                            <Input type='checkbox'
                                                                name={column[3].toString()}
                                                                onChange={this.handleChecboxChange}
                                                                checked={this.state.selected[column[3].toString()] || false} />
                                                            {column[3]}
                                                        </Label>
                                                    </FormGroup>
                                                    :
                                                    <a href={metagenomeDownloadURL(this.props.sample_id, column[3])}
                                                        rel="noopener noreferrer"
                                                        target="_blank" >
                                                        Download {column[3]}</a> // FIXME show Mb?
                                            }</td>
                                        </tr>
                                ))}
                            </tbody>
                        </table>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    {(this.props.sample_id === '*') ?
                        <Button
                        type="submit"
                        form='metagenome-download-form'
                        color="primary"
                        disabled={n_selected < 1}>
                            Download bundle of {n_selected} metagenome files for each of {this.props.rowsCount} samples
                        </Button>
                        :
                        ''}
                </ModalFooter>
            </Modal>
        );
    }
}

function mapStateToProps(state) {
    const { sample_id } = state.searchPage.metagenomeModal
    return {
        rowsCount: state.searchPage.results.rowsCount,
        isOpen: !!sample_id,
        sample_id,
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
