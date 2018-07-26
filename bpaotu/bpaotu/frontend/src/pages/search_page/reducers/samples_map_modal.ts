import * as _ from 'lodash';
import { searchPageInitialState } from "./types";
import { executeSampleSitesSearch } from "../../../api";
import { describeSearch } from "./search";
import { createActions, handleActions } from 'redux-actions';
import { handleSimpleAPIResponse } from '../../../reducers/utils';

export const {
    openSamplesMapModal,
    closeSamplesMapModal,

    samplesMapModalFetchSamplesStarted,
    samplesMapModalFetchSamplesEnded,

} = createActions(
    'OPEN_SAMPLES_MAP_MODAL',
    'CLOSE_SAMPLES_MAP_MODAL',

    'SAMPLES_MAP_MODAL_FETCH_SAMPLES_STARTED',
    'SAMPLES_MAP_MODAL_FETCH_SAMPLES_ENDED',
);

export const fetchSampleMapModalSamples = () => (dispatch, getState) => {
    const filters = describeSearch(getState().searchPage.filters);

    dispatch(samplesMapModalFetchSamplesStarted());
    handleSimpleAPIResponse(dispatch, _.partial(executeSampleSitesSearch, filters), samplesMapModalFetchSamplesEnded);
}

export default handleActions({
    [openSamplesMapModal as any]: (state, action) => ({
        ...state,
        isOpen: true,
    }),
    [closeSamplesMapModal as any]: (state, action) => ({
        ...state,
        isOpen: false,
    }),
    [samplesMapModalFetchSamplesStarted as any]: (state, action) => ({
        ...state,
        isLoading: true,
        markers: [],
    }),
    [samplesMapModalFetchSamplesEnded as any]: (state, action: any) => ({
        ...state,
        isLoading: false,
        markers: _.map(action.payload.data.data, sample => ({bpa_data: sample.bpa_id, lat: sample.latitude, lng: sample.longitude})),
    }),
}, searchPageInitialState.samplesMapModal);
