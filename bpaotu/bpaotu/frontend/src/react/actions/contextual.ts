import { buildValueSelector, buildOperatorSelector } from './common';

import { getContextualDataDefinitions } from '../api/index';

export const SELECT_ENVIRONMENT = 'SELECT_ENVIRONMENT';
export const SELECT_ENVIRONMENT_OPERATOR = 'SELECT_ENVIRONMENT_OPERATOR';

export const SELECT_CONTEXTUAL_FILTERS_MODE = 'SELECT_CONTEXTUAL_FILTERS_MODE';

export const FETCH_CONTEXTUAL_DATA_DEFINITIONS_STARTED = 'FETCH_CONTEXTUAL_DATA_DEFINITIONS_STARTED';
export const FETCH_CONTEXTUAL_DATA_DEFINITIONS_SUCCESS = 'FETCH_CONTEXTUAL_DATA_DEFINITIONS_SUCCESS';
export const FETCH_CONTEXTUAL_DATA_DEFINITIONS_ERROR = 'FETCH_CONTEXTUAL_DATA_DEFINITIONS_ERROR';

export const ADD_CONTEXTUAL_FILTER = 'ADD_CONTEXTUAL_FILTER';
export const REMOVE_CONTEXTUAL_FILTER = 'REMOVE_CONTEXTUAL_FILTER';
export const SELECT_CONTEXTUAL_FILTER = 'SELECT_CONTEXTUAL_FILTER';
export const CHANGE_CONTEXTUAL_FILTER_OPERATOR = 'CHANGE_CONTEXTUAL_FILTER_OPERATOR';
export const CHANGE_CONTEXTUAL_FILTER_VALUE = 'CHANGE_CONTEXTUAL_FILTER_VALUE';
export const CHANGE_CONTEXTUAL_FILTER_VALUE2 = 'CHANGE_CONTEXTUAL_FILTER_VALUE2';
export const CHANGE_CONTEXTUAL_FILTER_VALUES = 'CHANGE_CONTEXTUAL_FILTER_VALUES';

export const fetchContextualDataDefinitionsStarted = () => ({ type: FETCH_CONTEXTUAL_DATA_DEFINITIONS_STARTED });
export const fetchContextualDataDefinitionsSuccess = (data: any) => ({ type: FETCH_CONTEXTUAL_DATA_DEFINITIONS_SUCCESS, payload: data });
export const fetchContextualDataDefinitionsError = (msg: string) => ({ type: FETCH_CONTEXTUAL_DATA_DEFINITIONS_ERROR, payload: msg });

export function fetchContextualDataDefinitions() {
    return ((dispatch: any) => {
        dispatch(fetchContextualDataDefinitionsStarted());

        getContextualDataDefinitions()
            .then(data => {
                dispatch(fetchContextualDataDefinitionsSuccess(data));
            }).catch(err => {
                dispatch(fetchContextualDataDefinitionsError(err));
            });
    })
}

export const selectEnvironment = buildValueSelector(SELECT_ENVIRONMENT);
export const selectEnvironmentOperator = buildOperatorSelector(SELECT_ENVIRONMENT_OPERATOR);

export const selectContextualFiltersMode = value => ({ type: SELECT_CONTEXTUAL_FILTERS_MODE, value });

export const addContextualFilter = () => ({ type: ADD_CONTEXTUAL_FILTER });
export const removeContextualFilter = (index) => ({ type: REMOVE_CONTEXTUAL_FILTER, index });
export const selectContextualFilter = (index, value) => ({ type: SELECT_CONTEXTUAL_FILTER, index, value });
export const changeContextualFilterOperator = (index, operator) => ({ type: CHANGE_CONTEXTUAL_FILTER_OPERATOR, index, operator });
export const changeContextualFilterValue = (index, value) => ({ type: CHANGE_CONTEXTUAL_FILTER_VALUE, index, value });
export const changeContextualFilterValue2 = (index, value) => ({ type: CHANGE_CONTEXTUAL_FILTER_VALUE2, index, value });
export const changeContextualFilterValues = (index, values) => ({ type: CHANGE_CONTEXTUAL_FILTER_VALUES, index, values });
