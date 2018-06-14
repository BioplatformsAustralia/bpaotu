import { combineReducers } from 'redux';
import AmpliconsReducer from './amplicons';
import SearchPageReducer from './search_page';

const referenceDataReducer = combineReducers({
    amplicons: AmpliconsReducer
});

const rootReducer = combineReducers({
    referenceData: referenceDataReducer,
    searchPage: SearchPageReducer
});

export default rootReducer;