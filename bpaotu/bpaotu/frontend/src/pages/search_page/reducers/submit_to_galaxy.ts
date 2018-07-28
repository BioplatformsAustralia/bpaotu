import * as _ from 'lodash';
import { searchPageInitialState, GalaxySubmission, ErrorList } from "./types";
import { executeSubmitToGalaxy, getGalaxySubmission } from '../../../api';

import { describeSearch } from './search';
import { changeElementAtIndex, removeElementAtIndex } from '../../../reducers/utils';
import { createActions, handleActions } from 'redux-actions';

const GALAXY_SUBMISSION_POLL_FREQUENCY_MS = 5000;
const ALERT_AUTO_HIDE_MS = 3000;

export const {
    submitToGalaxyStarted,
    submitToGalaxyEnded,

    galaxySubmissionUpdateStarted,
    galaxySubmissionUpdateEnded,

    clearGalaxyAlert,
} = createActions(
    'SUBMIT_TO_GALAXY_STARTED',
    'SUBMIT_TO_GALAXY_ENDED',

    'GALAXY_SUBMISSION_UPDATE_STARTED',
    'GALAXY_SUBMISSION_UPDATE_ENDED',

    'CLEAR_GALAXY_ALERT',
);

export const submitToGalaxy = () => (dispatch, getState) => {
    const state = getState();

    dispatch(submitToGalaxyStarted());

    const filters = describeSearch(state.searchPage.filters);

    executeSubmitToGalaxy(filters)
    .then(data => {
        if (_.get(data, 'data.errors', []).length > 0) {
            dispatch(submitToGalaxyEnded(new ErrorList(data.data.errors)));
            return;
        }
        dispatch(submitToGalaxyEnded(data));
        dispatch(autoUpdateGalaxySubmission());
    })
    .catch(error => {
        dispatch(submitToGalaxyEnded(new ErrorList('Unhandled server-side error!')));
    })
}

export const autoUpdateGalaxySubmission = () => (dispatch, getState) => {
    const getLastSubmission: (() => GalaxySubmission) = () => _.last(getState().searchPage.galaxy.submissions);
    const lastSubmission = getLastSubmission();

    getGalaxySubmission(lastSubmission.submissionId)
    .then(data => {
        dispatch(galaxySubmissionUpdateEnded(data));
        const newLastSubmission = getLastSubmission();
        if (!newLastSubmission.finished) {
            setTimeout(() => dispatch(autoUpdateGalaxySubmission()), GALAXY_SUBMISSION_POLL_FREQUENCY_MS)
        }
    })
    .catch(error => {
        dispatch(galaxySubmissionUpdateEnded(new Error('Unhandled server-side error!')));
    });
}


function alert(text, color='primary') {
    return {color, text};
}

const GALAXY_ALERT_IN_PROGRESS = alert('Submission to Galaxy in Progress ...');
const GALAXY_ALERT_ERROR = alert('An error occured while submiting to Galaxy.', 'danger');

export default handleActions({
    [submitToGalaxyStarted as any]: (state, action) => ({
        ...state,
        alerts: [],
        isSubmitting: true,
    }),
    [submitToGalaxyEnded as any]: {
        next: (state, action: any) => {
            const lastSubmission = {
                submissionId: action.payload.data.submission_id,
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
        },
        throw: (state, action) => ({
            ...state,
            isSubmitting: false,
        }),
    },
    [galaxySubmissionUpdateEnded as any]: {
        next: (state, action: any) => {
            const lastSubmission = _.last(state.submissions);
            const newLastSubmissionState = (submission => {
                const { state, error, history_id } = action.payload.data.submission;
                let newState = {
                    ...submission,
                    historyId: history_id,
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
                const linkToHistory = `${window.otu_search_config.galaxy_base_url}/histories/view?id=${newLastSubmissionState.historyId}`;
                const GALAXY_ALERT_SUCCESS = alert(
                    'Successfully submitted to Galaxy.' +
                    ` File uploaded to your <a href="${linkToHistory}" className="alert-link">Galaxy history.</a>`, 'success');
                newAlerts = [newLastSubmissionState.succeeded ? GALAXY_ALERT_SUCCESS : GALAXY_ALERT_ERROR];
            }
            return {
                ...state,
                submissions: changeElementAtIndex(state.submissions, state.submissions.length - 1, _ => newLastSubmissionState),
                alerts: newAlerts,
            }
        },
        throw: (state, action) => {
            const lastSubmission = _.last(state.submissions);
            return {
                ...state,
                submissions: changeElementAtIndex(state.submissions, state.submissions.length - 1, submission => ({
                    ...submission,
                    finished: true,
                    succeeded: false,
                    error: action.error,
                })),
                alerts: [GALAXY_ALERT_ERROR],
            }
        },
    },
    [clearGalaxyAlert as any]: (state, action) => {
        const index = action.payload;
        const alerts = _.isNumber(index) ?
            removeElementAtIndex(state.alerts, index) :
            state.alerts.filter(a => a.color === 'danger'); // never auto-remove errors
        return {
            ...state,
            alerts,
        }
    },

}, searchPageInitialState.galaxy);
