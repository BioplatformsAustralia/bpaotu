import { combineReducers } from 'redux';
import referenceDataReducer from './reference_data';
import searchPageReducer from '../pages/search_page/reducers';
import authReducer from './auth';

const rootReducer = combineReducers({
    referenceData: referenceDataReducer,
    searchPage: searchPageReducer,
    auth: authReducer,
});

export default rootReducer;
