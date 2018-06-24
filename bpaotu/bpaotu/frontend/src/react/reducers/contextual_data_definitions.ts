import * as _ from 'lodash';
import { 
    FETCH_CONTEXTUAL_DATA_DEFINITIONS_SUCCESS,
    FETCH_CONTEXTUAL_DATA_DEFINITIONS_STARTED
} from '../actions/index';

const initialState = {
    isLoading: false,
    environment: [],
    filters: [],
}

export default function(state=initialState, action) {
    switch (action.type) {
        case FETCH_CONTEXTUAL_DATA_DEFINITIONS_STARTED:
            return {
                ...initialState,
                isLoading: true,
            }
        case FETCH_CONTEXTUAL_DATA_DEFINITIONS_SUCCESS:
            const isEnvironment = definition => definition.name === 'environment_id';
            const environment = _.find(action.payload.data.definitions, isEnvironment);
            const allButEnvironment = _.reject(action.payload.data.definitions, isEnvironment);
            return {
                isLoading: false,
                environment: _.map(environment.values, ([id, name]) => ({ id, name })),
                filters: allButEnvironment,
            }
    }
    return state;
}