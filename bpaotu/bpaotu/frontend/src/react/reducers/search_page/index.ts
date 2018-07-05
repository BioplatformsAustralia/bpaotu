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
    SUBMIT_TO_GALAXY_STARTED,
    SUBMIT_TO_GALAXY_SUCCESS,
    SUBMIT_TO_GALAXY_ERROR,
    GALAXY_SUBMISSION_UPDATE_SUCCESS,
    GALAXY_SUBMISSION_CLEAR_ALERTS,
    GALAXY_SUBMISSION_UPDATE_ERROR,
} from '../../actions/index';

import contextualDataDefinitionsReducer from '../contextual_data_definitions';
import { selectedAmpliconReducer } from './amplicon';
import contextualReducer from './contextual';
import taxonomyReducer from './taxonomy';
import { changeElementAtIndex, removeElementAtIndex } from './utils';

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

export interface GalaxySubmission {
    submissionId?: string
    finished: boolean
    succeeded: boolean
    error?: string
}

export interface Alert {
    color: string
    text: string
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
    }
    samplesMapModal: {
        isOpen: boolean
        isLoading: boolean
        markers: SampleMarker[]
    }
    galaxy: {
        isSubmitting: boolean
        alerts: Alert[]
        submissions: GalaxySubmission[]
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
    galaxy: {
        alerts: [],
        isSubmitting: false,
        submissions: []
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
        case SUBMIT_TO_GALAXY_STARTED:
            return {
                ...state,
                errors: [],
            }
        case SUBMIT_TO_GALAXY_ERROR:
            return {
                ...state,
                errors: action.errors,
            }
     }
    return state;
}


function alert(text, color='primary') {
    return {color, text};
}

const GALAXY_ALERT_IN_PROGRESS = alert('Submission to Galaxy in Progress ...');
const GALAXY_ALERT_SUCCESS = alert('Successfully submitted to Galaxy.', 'success');
const GALAXY_ALERT_ERROR = alert('An error occured while submiting to Galaxy.', 'danger');

const submitToGalaxyReducer = (state = searchPageInitialState.galaxy, action) => {
    let lastSubmission: GalaxySubmission;
    switch (action.type) {
        case SUBMIT_TO_GALAXY_STARTED:
            return {
                ...state,
                alerts: [],
                isSubmitting: true,
            }
        case SUBMIT_TO_GALAXY_SUCCESS:
            lastSubmission = {
                submissionId: action.data.data.submission_id,
                finished: false,
                succeeded: false,
            }
            return {
                alerts: [GALAXY_ALERT_IN_PROGRESS],
                submissions: [
                    ...state.submissions,
                    lastSubmission,
                ],
                isSubmitting: false,
            }
        case SUBMIT_TO_GALAXY_ERROR:
            return {
                ...state,
                isSubmitting: false,
            }
        case GALAXY_SUBMISSION_UPDATE_SUCCESS:
            lastSubmission = _.last(state.submissions);
            const newLastSubmissionState = (submission => {
                const { state, error } = action.data.data.submission;
                let newState = {
                    ...submission,
                    finished: state === 'ok' || state === 'error',
                    succeeded: state === 'ok'
                }
                if (state === 'error') {
                    newState.error = error;
                }
                return newState;
            })(lastSubmission);

            let newAlerts = state.alerts;
            if (newLastSubmissionState.finished && !lastSubmission.finished) {
                newAlerts = [newLastSubmissionState.succeeded ? GALAXY_ALERT_SUCCESS : GALAXY_ALERT_ERROR];
            }
            return {
                ...state,
                submissions: changeElementAtIndex(state.submissions, state.submissions.length - 1, submission => newLastSubmissionState),
                alerts: newAlerts,
            }

        case GALAXY_SUBMISSION_UPDATE_ERROR:
            lastSubmission = _.last(state.submissions);
            return {
                ...state,
                submissions: changeElementAtIndex(state.submissions, state.submissions.length - 1, submission => ({
                    ...submission,
                    finished: true,
                    succeeded: false,
                    error: action.error,
                })),
                alerts: [{color: 'danger', text: 'An error occured while submiting to Galaxy.'}],
            }

        case GALAXY_SUBMISSION_CLEAR_ALERTS:
            const { index } = action;
            const alerts = _.isNumber(index) ?
                removeElementAtIndex(state.alerts, index) :
                state.alerts.filter(a => a.color === 'danger'); // never auto-remove errors
            return {
                ...state,
                alerts,
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
    galaxy: submitToGalaxyReducer,
    results: searchResultsReducer,
});

export default pageReducer;
