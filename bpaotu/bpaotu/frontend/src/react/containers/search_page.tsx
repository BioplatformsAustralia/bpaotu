import * as React from 'react';
import {
    Container,
    Col,
    Row,
} from 'reactstrap';

import AmpliconTaxonomyFilterCard from './amplicon_taxonomy_filter_card';
import ContextualFilterCard from './contextual_filter_card';
import SearchButton from './search_button';
import SearchErrors from './search_errors';
import SearchResultsCard from './search_results_card';
import Octicon from '../components/octicon';

import { getCKANAuthInfo } from '../actions/index';


export default function SearchPage(props) {
    return (
        <Container fluid>
            <Row>
                <Col sm={6}>
                    <AmpliconTaxonomyFilterCard />
                </Col>
                <Col sm={6}>
                    <ContextualFilterCard />
                </Col>
            </Row>

            <Row className="space-above">
                <Col sm={{ size: 6, offset: 3 }}>
                    <SearchErrors />
                </Col>
            </Row>

            <Row className="space-above">
                <Col sm={{ size: 2, offset: 5 }}>
                    <SearchButton />
                </Col>
            </Row>
            <Row className="space-above">
                <Col sm={12}>
                    <SearchResultsCard />

                </Col>
            </Row>
        </Container>
    );
}