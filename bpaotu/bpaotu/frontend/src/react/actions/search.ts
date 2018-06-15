import * as _ from 'lodash';
import { EmptyOTUQuery } from '../../search';
import { executeSearch } from '../api';
import { taxonomies } from './taxonomy_filters';


export const CHANGE_TABLE_PROPERTIES = 'CHANGE_TABLE_PROPERTIES';
export const SEARCH_STARTED = 'SEARCH_STARTED';
export const SEARCH_SUCCESS = 'SEARCH_SUCCESS';
export const SEARCH_ERROR = 'SEARCH_ERROR';

export const changeTableProperties = (props) => ({
    type: CHANGE_TABLE_PROPERTIES,
    props
})

export const describeSearch = (stateFilters) => {
    const selectedAmplicon = stateFilters.selectedAmplicon;
    const selectedTaxonomies = _.map(taxonomies, taxonomy => stateFilters.taxonomy[taxonomy].selected);

    return {
        amplicon_filter: selectedAmplicon,
        taxonomy_filters: selectedTaxonomies,
        contextual_filters: EmptyOTUQuery.contextual_filters, // TODO
    }
}

export const search = () => (dispatch, getState) => {
    const state = getState();

    dispatch({type: SEARCH_STARTED});

    const filters = describeSearch(state.searchPage.filters);

    executeSearch(filters, state.searchPage.results)
    .then(data => {
        dispatch({type: SEARCH_SUCCESS, data});
    })
    .catch(error => {
        dispatch({type: SEARCH_ERROR, msg: error});
    })
}