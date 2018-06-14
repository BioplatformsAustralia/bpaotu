import * as React from 'react';
import {
    Container,
    Col,
    Row,
    Button,
} from 'reactstrap';

import AmpliconTaxonomyFilterCard from './containers/amplicon_taxonomy_filter_card';
import ContextualFilterCard from './containers/contextual_filter_card';
import SearchButton from './containers/search_button';
import SearchResultsTable from './containers/search_results_table';

export default class App extends React.Component {
    render() {
        return (
            <div>
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
                        <Col sm={5}>
                        </Col>
                        <Col sm={2}>
                            <SearchButton />
                        </Col>
                        <Col sm={5}>
                        </Col>
                    </Row>
                    <Row className="space-above">
                        <Col sm={12}>
                            <SearchResultsTable />
                       </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}