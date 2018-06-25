import * as _ from 'lodash';
import { combineReducers } from 'redux';

import {
    SEARCH_SUCCESS,
    SEARCH_STARTED,
    CHANGE_TABLE_PROPERTIES,
    OPEN_SAMPLES_MAP_MODAL,
    CLOSE_SAMPLES_MAP_MODAL,
    FETCH_SAMPLES_MAP_MODAL_SAMPLES_STARTED,
    FETCH_SAMPLES_MAP_MODAL_SAMPLES_SUCCESS,
    SEARCH_ERROR,
} from '../../actions/index';

import contextualDataDefinitionsReducer from '../contextual_data_definitions';
import { selectedAmpliconReducer } from './amplicon';
import contextualReducer from './contextual';
import taxonomyReducer from './taxonomy';

export interface OperatorAndValue {
    value: string
    operator: 'is' | 'isnot'
}

export interface LoadableValues {
    isLoading: boolean
    options: any[]
}

export interface SelectableLoadableValues extends LoadableValues {
    isDisabled: boolean
    selected: OperatorAndValue
}

export interface PageState {
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
        },
        contextual: any, // TODO
    },
    samplesMapModal: {
        isOpen: boolean
        isLoading: boolean
        markers: SampleMarker[]
    }
    results: {
        isLoading: boolean
        errors: string[]
        data: any[]
        page: number
        pageSize: number
        rowsCount: number
        sorted: any[]
    }
}

export interface SampleMarker {
    title: string
    lat: number
    lng: number
}

export const EmptyOperatorAndValue: OperatorAndValue = { value: '', operator: 'is' };
export const EmptyLoadableValues: LoadableValues = { isLoading: null, options: [] };
export const EmptySelectableLoadableValues: SelectableLoadableValues = {
    selected: EmptyOperatorAndValue,
    isDisabled: true,
    isLoading: false,
    options: []
};

export const searchPageInitialState: PageState = {
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
        },
        contextual: {
            dataDefinitions: {
                isLoading: false,
                environment: [],
                filters: [],
            },
            selectedEnvironment: EmptyOperatorAndValue,
            filtersMode: 'and',
            filters: [],
        }
    },
    samplesMapModal: {
        isOpen: false,
        isLoading: false,
        markers: []
    },
    results: {
        isLoading: false,
        errors: [],
        data: [],
        page: 0,
        pageSize: 10,
        rowsCount: 0,
        sorted: [],
    }
}

const samplesMapModalReducer = (state = searchPageInitialState.samplesMapModal, action) => {
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

const searchResultsReducer = (state = searchPageInitialState.results, action) => {
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
                errors: [],
                isLoading: true,
            }
        case SEARCH_SUCCESS:
            const rowsCount = action.data.data.rowsCount;
            const pages =  Math.ceil(rowsCount / state.pageSize);
            const newPage = Math.min(pages - 1 < 0 ? 0 : pages - 1, state.page);
            return {
                ...state,
                isLoading: false,
                data: action.data.data.data,
                rowsCount,
                pages,
                page: newPage,
            }
        case SEARCH_ERROR:
            return {
                ...state,
                isLoading: false,
                errors: action.errors,
            }
    }
    return state;
}

const filtersReducer = combineReducers({
    selectedAmplicon: selectedAmpliconReducer,
    taxonomy: taxonomyReducer,
    contextual: contextualReducer,
})

const pageReducer = combineReducers({
    filters: filtersReducer,
    samplesMapModal: samplesMapModalReducer,
    results: searchResultsReducer,
});

export default pageReducer; 