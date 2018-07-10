import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button } from 'reactstrap';

import Octicon from '../../../components/octicon';

export default props => (
    <Button 
        block
        color="primary"
        size="lg"
        disabled={props.isDisabled}
        onClick={props.search}>
            <Octicon name="search" /> &nbsp; Search
    </Button>
);
