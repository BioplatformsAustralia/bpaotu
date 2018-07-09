import { buildValueSelector, buildOperatorSelector } from './common';

import { getAmplicons } from '../api/index';

export const SELECT_AMPLICON = 'SELECT_AMPLICON';
export const SELECT_AMPLICON_OPERATOR = 'SELECT_AMPLICON_OPERATOR';
export const FETCH_AMPLICONS_STARTED = 'FETCH_AMPLICONS_STARTED';
export const FETCH_AMPLICONS_SUCCESS = 'FETCH_AMPLICONS_SUCCESS';
export const FETCH_AMPLICONS_ERROR = 'FETCH_AMPLICONS_ERROR';

export const selectAmplicon = buildValueSelector(SELECT_AMPLICON);
export const selectAmpliconOperator = buildOperatorSelector(SELECT_AMPLICON_OPERATOR);
export const fetchAmpliconsStarted = () => ({ type: FETCH_AMPLICONS_STARTED });
export const fetchAmpliconsSuccess = (data: any) => ({ type: FETCH_AMPLICONS_SUCCESS, payload: data });
export const fetchAmpliconsError = (msg: string) => ({ type: FETCH_AMPLICONS_ERROR, payload: msg });

export function fetchAmplicons() {
    return ((dispatch: any) => {
        dispatch(fetchAmpliconsStarted());

        getAmplicons()
            .then(data => {
                dispatch(fetchAmpliconsSuccess(data));
            }).catch(err => {
                dispatch(fetchAmpliconsError(err));
            });
    })
}

