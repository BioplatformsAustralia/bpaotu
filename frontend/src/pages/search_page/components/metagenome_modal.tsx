import React from 'react';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Modal, ModalBody, ModalHeader, ModalFooter, Button, Input, Label, FormGroup, Form, Alert} from 'reactstrap'
import { isString } from 'lodash'
import { closeMetagenomeModal } from '../reducers/metagenome_modal'
import { describeSearch } from '../reducers/search'
import { metagenome_rows } from './metagenome_rows'
import { values, filter, map } from 'lodash'
import AnimateHelix, { loadingstyle } from '../../../components/animate_helix'

// https://www.codegrepper.com/code-examples/javascript/file+size+calculation+based+on+value+to+show+in+kb%2Fmb+in+javascript
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const metagenomeLink = (url, size) => {
    const segments = new URL(url).pathname.split('/');
    const tail = segments.pop() || segments.pop(); // Handle potential trailing slash
    return <>
        <td>
            <a href={url}
                rel="noopener noreferrer"
                download
                target="_blank" >
                {tail}</a>
        </td>
        <td>
            {formatBytes(size)}
        </td>
    </>
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
        const searchParams = JSON.stringify(this.props.describeSearch())
        // FIXME STUB. Download zip file containing fetcher scripts as per bioplatforms.com.au.
        console.log("MetagenomeModal.handleSubmit stub", searchParams, queryString)
      }

    get_rows(callback) {
        return metagenome_rows.map((row, index) => {
            // Note: key={index} is OK here as metagenome_rows is a constant
            if (isString(row)) {
                return <tr className="table-secondary" key={"r" + index}>
                    <th colSpan={5}>{row}</th>
                </tr>
            }
            return <tr key={"r" + index} >
                <td>{row[0]}</td>
                <td>{row[1]}</td>
                <td>{row[2]}</td>
                {callback(row, index)
                }
            </tr>
        })
    }

    get_bulk_rows() {
        return this.get_rows((row, index) => (
            <td>
                <FormGroup check>
                    <Label>
                        <Input type='checkbox'
                            name={row[3].toString()}
                            onChange={this.handleChecboxChange}
                            checked={this.state.selected[row[3].toString()] || false} />
                        {row[3]}
                    </Label>
                </FormGroup>
            </td>
        ))
    }

    get_sample_rows() {
        var mg_data = Object.assign(this.props.metagenome_data[this.props.sample_id] || {})
        const rows = this.get_rows((row, index) => {
            const fileType = row[3].toString()
            try {
                const [url, size] = mg_data[fileType]
                delete mg_data[fileType]
                return metagenomeLink(url, size)
            } catch (e) {
                return <><td><i>{fileType} not available</i></td><td></td></>
            }
        })
        // Anything left in mg_data?
        const remaining = map(mg_data, (row) => (
            <tr key={"x" + row[0]}>
                <td></td>
                <td></td>
                <td></td>
                {metagenomeLink(row[0], row[1])}
            </tr>
        ))
        if (remaining.length) {
            return [...rows,
            <tr className="table-secondary" key='unknown-mg-data'>
                <th colSpan={5}>Other metagenome data</th>
            </tr>,
            ...remaining]
        } else {
            return rows
        }
    }

    render() {
        const n_selected = filter(values(this.state.selected)).length
        const bulk = (this.props.sample_id === '*')

        return (
            <Modal isOpen={this.props.isOpen} scrollable={true} fade={true}>
                <ModalHeader toggle={this.props.closeMetagenomeModal}>
                    <div>
                        {
                            this.props.error ?
                                <Alert color="danger">Error: {this.props.error}</Alert> :
                                <span>{'Metagenome download'}</span>
                        }
                    </div>
                </ModalHeader>
                <ModalBody>
                    {
                        (this.props.isLoading) ?
                            <div style={loadingstyle}>
                                <AnimateHelix />
                            </div>
                            : (this.props.isOpen) ?
                                <Form id='metagenome-download-form' onSubmit={this.handleSubmit}>
                                    {
                                        (this.props.sample_id && !bulk && !this.props.error) ? (
                                            <p>
                                                Metagenome files for sample {this.props.sample_id}
                                            </p>) : ''
                                    }
                                    <table role="table" className="table table-bordered table-striped">
                                        <thead>
                                            <tr className="table-primary">
                                                <th>Data object type</th>
                                                <th>Data object description</th>
                                                <th>Data object methodology</th>
                                                <th>Download</th>
                                                {(!bulk) && <th>Size</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                (bulk) ?
                                                    this.get_bulk_rows() :
                                                    this.get_sample_rows()
                                            }
                                        </tbody>
                                    </table>
                                </Form>
                                : null
                    }
                </ModalBody>
                <ModalFooter>
                    {(bulk) ?
                        <Button
                        type="submit"
                        form='metagenome-download-form'
                        color="primary"
                        disabled={n_selected < 1}>
                            Download fetcher for {n_selected} metagenome files for each of {this.props.rowsCount} samples
                        </Button>
                        :
                        ''}
                </ModalFooter>
            </Modal>
        );
    }
}

function mapStateToProps(state) {
    const { isOpen, isLoading, sample_id, metagenome_data, error} = state.searchPage.metagenomeModal
    return {
        rowsCount: state.searchPage.results.rowsCount,
        isOpen,
        sample_id,
        isLoading,
        metagenome_data,
        error,
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
