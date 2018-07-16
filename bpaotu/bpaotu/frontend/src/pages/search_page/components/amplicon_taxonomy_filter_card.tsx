import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { fetchAmplicons } from '../../../reducers/reference_data/amplicons';

import {
    clearAllTaxonomyFilters,
    fetchKingdoms,
 } from '../reducers/taxonomy';
import {
    selectAmplicon,
    selectAmpliconOperator,
} from '../reducers/amplicon';
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

import Octicon from '../../../components/octicon';
import AmpliconFilter from './amplicon_filter';
import {
    KingdomFilter,
    PhylumFilter,
    ClassFilter,
    OrderFilter,
    FamilyFilter,
    GenusFilter,
    SpeciesFilter
} from './taxonomy_filters';

const AmpliconFilterInfo = 'Abundance matrices are derived from sequencing using one of 5 amplicons targeting Bacteria, Archaea, Eukaryotes (v4 and v9) and Fungi.  To filter data from a single amplicon select that amplicon here.  To search all amplicons for a taxa select "all".  Note the "all" search will return non-target sequences as well as target, for example searching "Amplicon = all" + "Kingdom = Bacteria" will return all sequences classified as bacteria in all assays.';
const TaxonomyFilterInfo = 'Taxonomy is assigned to sequences using consensus taxonomy of the top 3 hits against SILVA132 for rRNA targets and UNITE for ITS1 targets.';

export class AmpliconTaxonomyFilterCard extends React.Component<any> {
    componentDidMount() {
        this.props.fetchAmplicons();
        this.props.fetchKingdoms();
    }

    render() {
        return (
            <Card>
                <CardHeader>Filter by
                    Amplicon <span title={AmpliconFilterInfo}><Octicon name="info" /></span> and
                    Taxonomy <span title={TaxonomyFilterInfo}><Octicon name="info" /></span>
                </CardHeader>
                <CardBody className="filters">
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
        this.props.clearAllTaxonomyFilters();
        this.props.fetchAmplicons();
        this.props.fetchKingdoms();
    }
}

function mapDispatchToProps(dispatch: any) {
    return bindActionCreators({
        fetchAmplicons, fetchKingdoms, clearAllTaxonomyFilters }, dispatch);
}

export default connect(null, mapDispatchToProps)(AmpliconTaxonomyFilterCard);
