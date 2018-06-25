import * as _ from 'lodash';
import { executeSampleSitesSearch } from '../api';
import { describeSearch } from './search';

export const OPEN_SAMPLES_MAP_MODAL = 'OPEN_SAMPLES_MAP_MODAL';
export const CLOSE_SAMPLES_MAP_MODAL = 'CLOSE_SAMPLES_MAP_MODAL';

export const FETCH_SAMPLES_MAP_MODAL_SAMPLES_STARTED = 'FETCH_SAMPLES_MAP_MODAL_SAMPLES_STARTED';
export const FETCH_SAMPLES_MAP_MODAL_SAMPLES_SUCCESS = 'FETCH_SAMPLES_MAP_MODAL_SAMPLES_SUCCESS';
export const FETCH_SAMPLES_MAP_MODAL_SAMPLES_ERROR = 'FETCH_SAMPLES_MAP_MODAL_SAMPLES_ERROR';

export const openSamplesMapModal = () => ({ type: OPEN_SAMPLES_MAP_MODAL });
export const closeSamplesMapModal = () => ({ type: CLOSE_SAMPLES_MAP_MODAL });

export const fetchSampleMapModalSamples = () => (dispatch, getState) => {
    const state = getState();

    dispatch({type: FETCH_SAMPLES_MAP_MODAL_SAMPLES_STARTED});

    const filters = describeSearch(state.searchPage.filters);

    executeSampleSitesSearch(filters, state.searchPage.results)
    .then(data => {
        dispatch({type: FETCH_SAMPLES_MAP_MODAL_SAMPLES_SUCCESS, data});
    })
    .catch(error => {
        dispatch({type: FETCH_SAMPLES_MAP_MODAL_SAMPLES_ERROR, msg: error});
    })
}
