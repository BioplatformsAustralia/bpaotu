import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button } from 'reactstrap';

import Octicon from '../components/octicon';

import { search } from '../actions/index';

const SearchButton = (props) => (
    <Button color="primary" disabled={props.isDisabled} onClick={props.search} block size="lg">
        <Octicon name="search" />
        &nbsp;
        Search
    </Button>
);

function mapStateToProps(state) {
    return {
        isDisabled: state.searchPage.results.isLoading,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        search,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchButton);

