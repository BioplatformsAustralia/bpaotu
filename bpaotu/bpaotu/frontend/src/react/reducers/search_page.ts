import * as _ from 'lodash';

import {
    CLEAR_FILTERS,
    SELECT_AMPLICON,
    SELECT_AMPLICON_OPERATOR,
    selectAmplicon,
    SEARCH_SUCCESS,
    SEARCH_STARTED,
    CHANGE_TABLE_PROPERTIES,
    OPEN_SAMPLES_MAP_MODAL,
    CLOSE_SAMPLES_MAP_MODAL,
    FETCH_SAMPLES_MAP_MODAL_SAMPLES_STARTED,
    FETCH_SAMPLES_MAP_MODAL_SAMPLES_SUCCESS,
} from '../actions/index';
import { combineReducers } from 'redux';

export interface OperatorAndValue {
    value: string
    operator: 'is' | 'isnot'
}

interface LoadableValues {
    isLoading: boolean
    options: any[]
}

interface SelectableLoadableValues extends LoadableValues {
    isDisabled: boolean
    selected: OperatorAndValue
}

interface PageState {
    filters: {
        selectedAmplicon: OperatorAndValue
        taxonomy: {
            kingdom: SelectableLoadableValues
            phylum: SelectableLoadableValues
            class: SelectableLoadableValues
            order: SelectableLoadableValues
            family: SelectableLoadableValues
            genus: SelectableLoadableValues
            species: SelectableLoadableValues
        }
    },
    samplesMapModal: {
        isOpen: boolean
        isLoading: boolean
        markers: SampleMarker[]
    }
    results: {
        isLoading: boolean
        data: any[]
        page: number
        pageSize: number
        rowsCount: number
        sorted: any[]
    }
}

interface SampleMarker {
    title: string
    lat: number
    lng: number
}

const EmptyOperatorAndValue: OperatorAndValue = { value: '', operator: 'is' };
const EmptyLoadableValues: LoadableValues = { isLoading: null, options: [] };
const EmptySelectableLoadableValues: SelectableLoadableValues = {
    selected: EmptyOperatorAndValue,
    isDisabled: true,
    isLoading: false,
    options: []
};

const initialState: PageState = {
    filters: {
        selectedAmplicon: EmptyOperatorAndValue,
        taxonomy: {
            kingdom: EmptySelectableLoadableValues,
            phylum: EmptySelectableLoadableValues,
            class: EmptySelectableLoadableValues,
            order: EmptySelectableLoadableValues,
            family: EmptySelectableLoadableValues,
            genus: EmptySelectableLoadableValues,
            species: EmptySelectableLoadableValues
        }
    },
    samplesMapModal: {
        isOpen: false,
        isLoading: false,
        markers: []
    },
    results: {
        isLoading: false,
        data: [],
        page: 0,
        pageSize: 10,
        rowsCount: 0,
        sorted: [],
    }
}

function selectedAmpliconReducer(state = EmptyOperatorAndValue, action) {
    switch (action.type) {
        case CLEAR_FILTERS:
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
            case CLEAR_FILTERS:
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

function taxonomyReducer(state = initialState.filters.taxonomy, action) {
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

const samplesMapModalReducer = (state = initialState.samplesMapModal, action) => {
    switch (action.type) {
        case OPEN_SAMPLES_MAP_MODAL:
            return {
                ...state,
                isOpen: true,
            }
        case CLOSE_SAMPLES_MAP_MODAL:
            return {
                ...state,
                isOpen: false,
            }
        case FETCH_SAMPLES_MAP_MODAL_SAMPLES_STARTED:
            return {
                ...state,
                isLoading: true,
                markers: [],
            }
        case FETCH_SAMPLES_MAP_MODAL_SAMPLES_SUCCESS:
            const markers = _.map(action.data.data.data, sample => ({title: sample.bpa_id, lat: sample.latitude, lng: sample.longitude}));
            return {
                ...state,
                isLoading: false,
                markers,
            }
      }
    return state;
}

const searchResultsReducer = (state = initialState.results, action) => {
    switch (action.type) {
        case CHANGE_TABLE_PROPERTIES:
            const { page, pageSize, sorted } = action.props;
            return {
                ...state,
                page,
                pageSize,
                sorted,
            };
        case SEARCH_STARTED:
            return {
                ...state,
                isLoading: true,
            }
        case SEARCH_SUCCESS:
            const rowsCount = action.data.data.rowsCount;
            const pages =  Math.ceil(rowsCount / state.pageSize);
            const newPage = Math.min(pages - 1, state.page);
            return {
                ...state,
                isLoading: false,
                data: action.data.data.data,
                rowsCount,
                pages,
                page: newPage,
            }
    }
    return state;
}

const filtersReducer = combineReducers({
    selectedAmplicon: selectedAmpliconReducer,
    taxonomy: taxonomyReducer
})

const pageReducer = combineReducers({
    filters: filtersReducer,
    samplesMapModal: samplesMapModalReducer,
    results: searchResultsReducer,
});

export default pageReducer; 