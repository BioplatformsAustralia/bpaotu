import * as _ from 'lodash';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { updateTaxonomyDropDowns } from '../actions/index';

import DropDownFilter from '../components/drop_down_filter';
import { buildValueSelector, buildOperatorSelector } from '../actions/common';

const taxonomyFilterStateToProps = name => state => { 
    const {options, isDisabled, isLoading, selected} = state.searchPage.filters.taxonomy[name];
    return {
        label: _.capitalize(name),
        options,
        selected,
        optionsLoading: isLoading,
        isDisabled: isDisabled
    }
}
const taxonomyDispatchToProps = name => dispatch => {
    const nameU = name.toUpperCase();
    return bindActionCreators({
        selectValue: buildValueSelector('SELECT_' + nameU),
        selectOperator: buildOperatorSelector(`SELECT_${ nameU }_OPERATOR`),
        onChange: updateTaxonomyDropDowns(name)
    }, dispatch)
}

const connectUpTaxonomyDropDownFilter = name => connect(taxonomyFilterStateToProps(name), taxonomyDispatchToProps(name))(DropDownFilter);

export const KingdomFilter = connectUpTaxonomyDropDownFilter('kingdom');
export const PhylumFilter = connectUpTaxonomyDropDownFilter('phylum');
export const ClassFilter = connectUpTaxonomyDropDownFilter('class');
export const OrderFilter = connectUpTaxonomyDropDownFilter('order');
export const FamilyFilter = connectUpTaxonomyDropDownFilter('family');
export const GenusFilter = connectUpTaxonomyDropDownFilter('genus');
export const SpeciesFilter = connectUpTaxonomyDropDownFilter('species');
