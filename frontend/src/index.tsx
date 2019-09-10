import 'bootstrap/dist/css/bootstrap.min.css'

import 'core-js';
import axios from 'axios'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { HashRouter as Router } from 'react-router-dom'
import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'

import App from './app'
import reducers from './reducers'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export const store = createStore(reducers, composeEnhancers(applyMiddleware(thunk)))

axios.get(window.otu_search_config.base_url + '/private/api/v1/config').then(function(response) {
    window.otu_search_config = response.data;
    ReactDOM.render(
    <Provider store={store}>
        <Router basename={window.otu_search_config.base_url}>
        <App />
        </Router>
    </Provider>,
    document.getElementById('root')
    )
});
