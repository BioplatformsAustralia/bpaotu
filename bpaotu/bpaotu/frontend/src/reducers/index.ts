import { combineReducers } from 'redux';
import referenceDataReducer from './reference_data';
import mapPageReducer from '../pages/map_page/reducers';
import searchPageReducer from '../pages/search_page/reducers';
import authReducer from './auth';

const rootReducer = combineReducers({
    referenceData: referenceDataReducer,
    mapPage: mapPageReducer,
    searchPage: searchPageReducer,
    auth: authReducer,
});

export default rootReducer;
