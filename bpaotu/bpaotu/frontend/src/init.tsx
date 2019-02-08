import 'bootstrap/dist/css/bootstrap.min.css'

import 'core-js/es6/array';
import 'core-js/es6/number';
import 'core-js/es6/object';
import 'core-js/es6/promise';
import 'core-js/es6/string';
import 'core-js/es7/array';
import 'core-js/es7/string';
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter as Router } from 'react-router-dom'
import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'

import App from './app'
import reducers from './reducers'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export const store = createStore(reducers, composeEnhancers(applyMiddleware(thunk)))

ReactDOM.render(
  <Provider store={store}>
    <Router basename={window.otu_search_config.base_url}>
      <App />
    </Router>
  </Provider>,
  document.getElementById('app')
)
