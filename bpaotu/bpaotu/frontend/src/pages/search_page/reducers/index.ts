import * as _ from 'lodash';
import { combineReducers } from 'redux';

import selectedAmpliconReducer from './amplicon';
import taxonomyReducer from './taxonomy';
import contextualReducer from './contextual';
import searchResultsReducer from './search';
import samplesMapModalReducer from './samples_map_modal';
import submitToGalaxyReducer from './submit_to_galaxy';


const filtersReducer = combineReducers({
    selectedAmplicon: selectedAmpliconReducer,
    taxonomy: taxonomyReducer,
    contextual: contextualReducer,
})

const pageReducer = combineReducers({
    filters: filtersReducer,
    samplesMapModal: samplesMapModalReducer,
    galaxy: submitToGalaxyReducer,
    results: searchResultsReducer,
});

export default pageReducer;