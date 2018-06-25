import * as _ from 'lodash';
import { combineReducers } from 'redux';

import {
    CLEAR_ALL_TAXONOMY_FILTERS,
    SELECT_AMPLICON,
    SELECT_AMPLICON_OPERATOR,
} from '../../actions/index';
import { EmptyOperatorAndValue } from './index';


export function selectedAmpliconReducer(state = EmptyOperatorAndValue, action) {
    switch (action.type) {
        case CLEAR_ALL_TAXONOMY_FILTERS:
            return EmptyOperatorAndValue;

        case SELECT_AMPLICON:
            return {
                ...state,
                value: action.id
            };
        case SELECT_AMPLICON_OPERATOR:
            return {
                ...state,
                operator: action.operator
            };
    }
    return state;
}