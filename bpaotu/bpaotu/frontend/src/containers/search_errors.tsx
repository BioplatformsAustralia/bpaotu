import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
    Alert,
} from 'reactstrap';

const SearchErrors = ({ errors }) => {
    if (errors.length == 0) {
        return (<span></span>);
    }
    return (
        <Alert color="danger">
            <h4 className="alert-heading">Errors</h4>
            <ul>
                {errors.map((err, idx) => 
                    (<li key={idx}>{err}</li>))}
            </ul>
        </Alert>
    );
};

function mapStateToProps(state) {
    return {
        errors: state.searchPage.results.errors,
    };
}

export default connect(mapStateToProps, null)(SearchErrors);