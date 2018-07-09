import { combineReducers } from 'redux';
import AmpliconsReducer from './amplicons';
import SearchPageReducer from './search_page/index';
import AuthReducer from './auth';

const referenceDataReducer = combineReducers({
    amplicons: AmpliconsReducer,
});

const rootReducer = combineReducers({
    referenceData: referenceDataReducer,
    searchPage: SearchPageReducer,
    auth: AuthReducer,
});

export default rootReducer;
