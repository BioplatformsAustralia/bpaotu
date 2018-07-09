import * as _ from 'lodash';
import * as moment from 'moment';
import { ckanAuthInfo } from '../api';

export const CKAN_AUTH_INFO_STARTED = 'CKAN_AUTH_INFO_STARTED';
export const CKAN_AUTH_INFO_SUCCESS = 'CKAN_AUTH_INFO_SUCCESS';
export const CKAN_AUTH_INFO_ERROR = 'CKAN_AUTH_INFO_ERROR';


export const ckanAuthError = (err) => ({type: CKAN_AUTH_INFO_ERROR, msg: err});


export const getCKANAuthInfo = () => (dispatch, getState) => {
    const state = getState();

    dispatch({type: CKAN_AUTH_INFO_STARTED});

    ckanAuthInfo()
    .then(data => {
        dispatch({type: CKAN_AUTH_INFO_SUCCESS, data});
    })
    .catch(error => {
        dispatch(ckanAuthError(error));
    })
}
