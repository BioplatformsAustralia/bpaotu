import { combineReducers } from 'redux';


import selectColumnsReducer from './select_columns';
import searchResultsReducer from './search';


const pageReducer = combineReducers({
    selectColumns: selectColumnsReducer,
    results: searchResultsReducer,
});

export default pageReducer;