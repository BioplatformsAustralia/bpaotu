import { map, get as _get } from 'lodash'
import * as React from 'react'
import { Col, FormGroup, Label } from 'reactstrap'
import Select from 'react-select';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { selectTaxonomySource } from '../reducers/taxonomy_source'
import { updateTaxonomyDropDowns } from '../reducers/taxonomy'
import { fetchTraits } from '../../../reducers/reference_data/traits'


class _TaxonomySelector extends React.Component<any, any> {

    constructor(props) {
      super(props)
      this.onValueChange = this.onValueChange.bind(this)
    }

    public onValueChange(evt) {
        const id = evt.value
        this.props.selectValue(id)
        this.props.updateTraits()
        this.props.onChange()
    }

    public renderOptions() {
        if (this.props.optionsLoadingError) {
            return (
                { value: "", label: "Couldn't load values!" }
            )
        }
        return map(this.props.options, this.renderOption)
    }

    public renderOption(option) {
        return (
            { value: option.id, label: option.value }
        )
    }

    public render() {
      return (
        <FormGroup row={true}>
          <Label sm={3}>{this.props.label}</Label>
          <Col sm={9}>
          <Select
              isSearchable={true}
              isLoading={this.props.optionsLoading}
              isDisabled={this.props.isDisabled || this.props.optionsLoadingError}
              value={map(this.props.options, this.renderOption).filter(option => option.value === this.props.selected.value)}
              options={this.renderOptions()}
              onChange={this.onValueChange}
              />
          </Col>
        </FormGroup>
      )
    }
  }

function mapStateToProps(state) {
    return {
        label: 'Taxonomy source',
        options: state.referenceData.taxonomySources.values,
        optionsLoadingError: state.referenceData.taxonomySources.error,
        isDisabled: _get(state, 'referenceData.taxonomySources.values', []).length === 0,
        optionsLoading: state.referenceData.taxonomySources.isLoading,
        selected: state.searchPage.filters.selectedTaxonomySource
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(
        {
            selectValue: selectTaxonomySource,
            onChange: updateTaxonomyDropDowns(''),
            updateTraits: fetchTraits
        },
        dispatch
    )
}

const TaxonomySelector = connect(
    mapStateToProps,
    mapDispatchToProps
)(_TaxonomySelector)

export default TaxonomySelector
