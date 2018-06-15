import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { 
    fetchAmplicons,
    fetchKingdoms,
    selectAmplicon,
    selectAmpliconOperator,
    clearFilters
} from '../actions/index';
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Col,
    FormGroup,
    Input,
    Label,
} from 'reactstrap';

import EnvironmentFilter from '../components/environment_filter';

class AmpliconTaxonomyFilterCard extends React.Component<any> {
    render() {
        return (
            <Card>
                <CardHeader>Contextual Filters</CardHeader>
                <CardBody className="filters">
                    <EnvironmentFilter />

                    <hr />
                    <h5 className="text-center">Contextual Filters</h5>

                </CardBody>
                <CardFooter className="text-center">
                    <Button color="warning">Clear</Button>
                </CardFooter>
            </Card>
        );
    }
}

function mapDispatchToProps(dispatch: any) {
    return bindActionCreators({
        fetchAmplicons, fetchKingdoms, clearFilters }, dispatch);
}

export default connect(null, mapDispatchToProps)(AmpliconTaxonomyFilterCard);