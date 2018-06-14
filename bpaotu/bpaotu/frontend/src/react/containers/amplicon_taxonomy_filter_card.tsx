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

import AmpliconFilter from '../containers/amplicon_filter';
import { 
    KingdomFilter,
    PhylumFilter,
    ClassFilter,
    OrderFilter,
    FamilyFilter,
    GenusFilter,
    SpeciesFilter
} from '../containers/taxonomy_filters';


class AmpliconTaxonomyFilterCard extends React.Component<any> {
    componentDidMount() {
        this.props.fetchAmplicons();
        this.props.fetchKingdoms();
    }

    render() {
        return (
            <Card>
                <CardHeader>Filter by Amplicon and Taxonomy</CardHeader>
                <CardBody>
                    <AmpliconFilter />

                    <hr />
                    <h5 className="text-center">Taxonomy</h5>

                    <KingdomFilter />
                    <PhylumFilter />
                    <ClassFilter />
                    <OrderFilter />
                    <FamilyFilter />
                    <GenusFilter />
                    <SpeciesFilter />

                </CardBody>
                <CardFooter className="text-center">
                    <Button color="warning" onClick={this.clearFilters.bind(this)}>Clear</Button>
                </CardFooter>
            </Card>
        );
    }

    clearFilters() {
        this.props.clearFilters();
        this.props.fetchAmplicons();
        this.props.fetchKingdoms();
    }
}

function mapDispatchToProps(dispatch: any) {
    return bindActionCreators({
        fetchAmplicons, fetchKingdoms, clearFilters }, dispatch);
}

export default connect(null, mapDispatchToProps)(AmpliconTaxonomyFilterCard);