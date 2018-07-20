import * as React from 'react';
import { Route } from 'react-router';
import SearchPage from '../pages/search_page';

export default props => (
    <div>
        <Route exact path="/" component={SearchPage} />
        {/* Add more routes here:
        <Route path="/bye" component={GoodbyePage} />
        <Route path="/hello" component={HelloPage} />
        */}
    </div>
);

