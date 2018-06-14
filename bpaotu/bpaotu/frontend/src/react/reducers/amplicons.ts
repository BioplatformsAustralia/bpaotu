import * as _ from 'lodash';
import { FETCH_AMPLICONS_SUCCESS } from '../actions/index';

export default function(state: any[]=[], action: any) {
    switch (action.type) {
        case FETCH_AMPLICONS_SUCCESS:
            return _.map(action.payload.data.possibilities, (option: any) => ({id: option[0], value: option[1]}));
    }
    return state
}