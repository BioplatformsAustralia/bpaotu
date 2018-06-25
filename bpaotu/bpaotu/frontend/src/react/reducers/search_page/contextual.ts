import * as _ from 'lodash';
import { combineReducers } from 'redux';

import {
    SELECT_ENVIRONMENT,
    SELECT_ENVIRONMENT_OPERATOR,
    SELECT_CONTEXTUAL_FILTERS_MODE,
    ADD_CONTEXTUAL_FILTER,
    REMOVE_CONTEXTUAL_FILTER,
    SELECT_CONTEXTUAL_FILTER,
    CHANGE_CONTEXTUAL_FILTER_OPERATOR,
    CHANGE_CONTEXTUAL_FILTER_VALUE,
    CHANGE_CONTEXTUAL_FILTER_VALUE2,
    CHANGE_CONTEXTUAL_FILTER_VALUES,
    CLEAR_CONTEXTUAL_FILTERS,
} from '../../actions/index';

import contextualDataDefinitionsReducer from '../contextual_data_definitions';
import { searchPageInitialState } from './index';

function selectedEnvironmentReducer(state = searchPageInitialState.filters.contextual.selectedEnvironment, action) {
    switch (action.type) {
        case SELECT_ENVIRONMENT:
            return {
                ...state,
                value: action.id,
            }
        case SELECT_ENVIRONMENT_OPERATOR:
            return {
                ...state,
                operator: action.operator,
            }
    }
    return state;
}

function contextualFiltersModeReducer(state = searchPageInitialState.filters.contextual.filtersMode, action) {
    switch (action.type) {
        case SELECT_CONTEXTUAL_FILTERS_MODE:
            return action.value;
    }
    return state;
}

/*
To keep things simple we don't use different object for different types. ex. String contextual filter would have a 
contains operator and only one value, Date contextual filter would have a between operator and from/to values etc.
There are pros and cons either way. This way the display of the React Components is fairly generic, but the state
will have multiple "values" fields that are empty if they don't make sense for the given type.
Ex. values is used only by Sample ID, String filters only use value, "Between" filters use value and value2 etc.
*/
const EmptyContextualFilter = {
    name: '',
    operator: '',
    value: '',
    value2: '',
    values: [],
}

function contextualFiltersReducer(state, action, dataDefinitions) {
    switch (action.type) {
        case ADD_CONTEXTUAL_FILTER:
            return [
                ...state,
                EmptyContextualFilter,
            ]
        case CLEAR_CONTEXTUAL_FILTERS:
            return []
        case REMOVE_CONTEXTUAL_FILTER:
            return removeElementAtIndex(state, action.index);
        case SELECT_CONTEXTUAL_FILTER:
            const dataDefinition = _.find(dataDefinitions, dd => dd.name === action.value);
            return changeElementAtIndex(state, action.index, filter => ({
                ...EmptyContextualFilter,
                name: action.value,
            }))
        case CHANGE_CONTEXTUAL_FILTER_OPERATOR:
            return changeElementAtIndex(state, action.index, filter => ({
                ...filter,
                operator: action.operator
            }))
        case CHANGE_CONTEXTUAL_FILTER_VALUE:
            return changeElementAtIndex(state, action.index, filter => ({
                ...filter,
                value: action.value
            }))
        case CHANGE_CONTEXTUAL_FILTER_VALUE2:
            return changeElementAtIndex(state, action.index, filter => ({
                ...filter,
                value2: action.value
            }))
        case CHANGE_CONTEXTUAL_FILTER_VALUES:
            return changeElementAtIndex(state, action.index, filter => ({
                ...filter,
                values: action.values
            }))
       }
    return state;
}

const contextualReducer = (state = searchPageInitialState.filters.contextual, action) => {
    return {
        selectedEnvironment: selectedEnvironmentReducer(state.selectedEnvironment, action),
        dataDefinitions: contextualDataDefinitionsReducer(state.dataDefinitions, action),
        filtersMode: contextualFiltersModeReducer(state.filtersMode, action),
        filters: contextualFiltersReducer(state.filters, action, state.dataDefinitions),
    }
}

const changeElementAtIndex = (arr, idx, fn) => {
    const changedElement = fn(arr[idx]);
    if (arr[idx] === changedElement) {
        return arr;
    }
    let result = arr.slice(0, idx);
    if (changedElement) {
        result.push(changedElement);
    }
    result = result.concat(arr.slice(idx + 1));
    return result;
}
const removeElementAtIndex = _.partialRight(changeElementAtIndex, () => null);

export default contextualReducer; 