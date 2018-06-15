import * as _ from 'lodash';
import axios from 'axios';

import { 
    CKAN_AUTH_INFO_STARTED,
    CKAN_AUTH_INFO_SUCCESS,
    CKAN_AUTH_INFO_ERROR,
} from '../actions/index';

const initialState = {
    ckanAuthToken: null,
    isLoginInProgress: false,
    isLoggedIn: false,
    email: null,
}

export default function(state=initialState, action) {
    switch (action.type) {
        case CKAN_AUTH_INFO_STARTED:
            return {
                ...state,
                isLoginInProgress: true,
            }
        case CKAN_AUTH_INFO_SUCCESS:
            const ckanAuthToken = action.data.data;
            const [_, data] = ckanAuthToken.split('||');
            const { email } = JSON.parse(data);
            axios.defaults.headers = {
                'X-BPAOTU-CKAN-Token': ckanAuthToken,
            }
            return {
                isLoginInProgess: false,
                isLoggedIn: true,
                ckanAuthToken,
                email,
            }
        case CKAN_AUTH_INFO_ERROR:
            return initialState;
    }
    return state
}