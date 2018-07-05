import * as _ from 'lodash';
import { executeSubmitToGalaxy, getGalaxySubmission } from '../api';
import { describeSearch } from './search';
import { GalaxySubmission } from '../reducers/search_page';

export const SUBMIT_TO_GALAXY_STARTED = 'SUBMIT_TO_GALAXY_STARTED';
export const SUBMIT_TO_GALAXY_SUCCESS = 'SUBMIT_TO_GALAXY_SUCCESS';
export const SUBMIT_TO_GALAXY_ERROR = 'SUBMIT_TO_GALAXY_ERROR';

export const GALAXY_SUBMISSION_UPDATE_SUCCESS = 'GALAXY_SUBMISSION_UPDATE_SUCCESS';
export const GALAXY_SUBMISSION_UPDATE_ERROR = 'GALAXY_SUBMISSION_UPDATE_ERROR';
export const GALAXY_SUBMISSION_CLEAR_ALERTS = 'GALAXY_SUBMISSION_CLEAR_ALERTS';

const GALAXY_SUBMISSION_POLL_FREQUENCY_MS = 5000;
const ALERT_AUTO_HIDE_MS = 3000;

export const submitToGalaxy = () => (dispatch, getState) => {
    const state = getState();

    dispatch({type: SUBMIT_TO_GALAXY_STARTED});

    const filters = describeSearch(state.searchPage.filters);

    executeSubmitToGalaxy(filters)
    .then(data => {
        if (_.get(data, 'data.errors', []).length > 0) {
            dispatch({ type: SUBMIT_TO_GALAXY_ERROR, errors: data.data.errors });
            return;
        }
        dispatch({type: SUBMIT_TO_GALAXY_SUCCESS, data});
        dispatch(autoUpdateGalaxySubmission());
    })
    .catch(error => {
        dispatch({ type: SUBMIT_TO_GALAXY_ERROR, errors: ['Unhandled server-side error!'] });
    })
}

export const autoUpdateGalaxySubmission = () => (dispatch, getState) => {
    const getLastSubmission: (() => GalaxySubmission) = () => _.last(getState().searchPage.galaxy.submissions);
    const lastSubmission = getLastSubmission();

    getGalaxySubmission(lastSubmission.submissionId)
    .then(data => {
        dispatch({ type: GALAXY_SUBMISSION_UPDATE_SUCCESS, data});
        const newLastSubmission = getLastSubmission();
        if (newLastSubmission.finished) {
            if (!lastSubmission.finished) {
                // submission just finished as the result of this update
                // auto-dismiss the alerts
                setTimeout(() => dispatch({ type: GALAXY_SUBMISSION_CLEAR_ALERTS }), ALERT_AUTO_HIDE_MS);
            }
        } else {
            setTimeout(() => dispatch(autoUpdateGalaxySubmission()), GALAXY_SUBMISSION_POLL_FREQUENCY_MS)
        }
    })
    .catch(error => {
        dispatch({ type: GALAXY_SUBMISSION_UPDATE_ERROR, error: 'Unhandled server-side error!' });
    });
}

export const dismissGalaxyAlert = (index) => ({ type: GALAXY_SUBMISSION_CLEAR_ALERTS, index });
