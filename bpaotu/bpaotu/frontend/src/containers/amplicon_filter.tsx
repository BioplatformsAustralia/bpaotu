import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { selectAmplicon, selectAmpliconOperator, updateTaxonomyDropDowns } from '../actions/index';

import DropDownFilter from '../components/drop_down_filter';


function mapStateToProps(state) {
    return { 
        label: "Amplicon",
        options: state.referenceData.amplicons,
        isDisabled: state.referenceData.amplicons.length == 0,
        optionsLoading: state.referenceData.amplicons.length == 0,
        selected: state.searchPage.filters.selectedAmplicon
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        selectValue: selectAmplicon,
        selectOperator: selectAmpliconOperator,
        onChange: updateTaxonomyDropDowns('')
    }, dispatch);
}

const AmpliconFilter = connect(mapStateToProps, mapDispatchToProps)(DropDownFilter);

export default AmpliconFilter;
