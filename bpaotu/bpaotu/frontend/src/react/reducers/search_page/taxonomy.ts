import * as _ from 'lodash';
import { combineReducers } from 'redux';

import {
    CLEAR_ALL_TAXONOMY_FILTERS,
} from '../../actions/index';
import {
    searchPageInitialState,
    EmptyOperatorAndValue,
    EmptySelectableLoadableValues,
} from './index';

function makeTaxonomyReducer(taxonomyName) {
    return (state = EmptySelectableLoadableValues, action) => {
        const taxonomyU = taxonomyName.toUpperCase();
        const actionTypes = {
            clear: 'CLEAR_' + taxonomyU,
            disable: 'DISABLE_' + taxonomyU,
            fetchStarted: `FETCH_${ taxonomyU }_STARTED`,
            fetchSuccess: `FETCH_${ taxonomyU }_SUCCESS`,
            fetchError: `FETCH_${ taxonomyU }_ERROR`,
            select: 'SELECT_' + taxonomyU,
            selectOperator: `SELECT_${ taxonomyU }_OPERATOR`
        }
        switch (action.type) {
            case CLEAR_ALL_TAXONOMY_FILTERS:
            case actionTypes.clear:
                return EmptySelectableLoadableValues;

            case actionTypes.disable:
                return {
                    ...state,
                    isDisabled: true
                }

            case actionTypes.fetchStarted:
                return {
                    ...state,
                    options: [],
                    isLoading: true
                }

            case actionTypes.fetchSuccess:
                const possibilites = action.payload.data.possibilities.new_options.possibilities;
                const options = _.map(
                    possibilites,
                    (option: any) => ({ id: option[0], value: option[1] }));

                const isSelectedStillInOptions = selected => {
                    if (selected.value == '') 
                        return true;
                    return _.findIndex(options, k => k.id == selected.value) != -1;
                }

                const selected = isSelectedStillInOptions(state.selected) ? state.selected: EmptyOperatorAndValue;

                return {
                    isLoading: false,
                    options,
                    selected
                }

            case actionTypes.select:
                return {
                    ...state,
                    selected: {
                        ...state.selected,
                        value: action.id
                    }
                };
            case actionTypes.selectOperator:
                return {
                    ...state,
                    selected: {
                        ...state.selected,
                        operator: action.operator
                    }
                };
        }
        return state;
    }
}

export default function taxonomyReducer(state = searchPageInitialState.filters.taxonomy, action) {
    return {
        ...state,
        kingdom: makeTaxonomyReducer('kingdom')(state.kingdom, action),
        phylum: makeTaxonomyReducer('phylum')(state.phylum, action),
        class: makeTaxonomyReducer('class')(state.class, action),
        order: makeTaxonomyReducer('order')(state.order, action),
        family: makeTaxonomyReducer('family')(state.family, action),
        genus: makeTaxonomyReducer('genus')(state.genus, action),
        species: makeTaxonomyReducer('species')(state.species, action)
    }
}