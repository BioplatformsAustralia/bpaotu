import * as _ from 'lodash';
import { EmptyOTUQuery } from '../search';
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

function marshallContextualFilters(filtersState, dataDefinitions) {
    const filterDataDefinition = name => _.find(dataDefinitions.filters, dd => dd.name === name)
    const filters = _.map(
        _.reject(filtersState, filter => filter.name === ''),
        filter => {
            const dataDefinition = filterDataDefinition(filter.name);

            let values: any = {};
            switch (dataDefinition.type) {
                case 'string':
                    values.contains = filter.value;
                    break;
                case 'float':
                case 'date':
                    values.from = filter.value;
                    values.to = filter.value2;
                    break;
                case 'ontology':
                    values.is = filter.value;
                    break;
                case 'sample_id':
                    values.is = filter.values;
                    break;
            }
            return {
                field: filter.name,
                operator: filter.operator,
                ...values,
            };
        });

    return filters;
}

function marshallContextual(state) {
    const { selectedEnvironment, filtersMode } = state;

    return {
        environment: (selectedEnvironment.value === '') ? null : selectedEnvironment,
        mode: filtersMode,
        filters: marshallContextualFilters(state.filters, state.dataDefinitions),
    }
}

export const describeSearch = (stateFilters) => {
    const selectedAmplicon = stateFilters.selectedAmplicon;
    const selectedTaxonomies = _.map(taxonomies, taxonomy => stateFilters.taxonomy[taxonomy].selected);

    return {
        amplicon_filter: selectedAmplicon,
        taxonomy_filters: selectedTaxonomies,
        contextual_filters: marshallContextual(stateFilters.contextual),
    }
}

export const search = () => (dispatch, getState) => {
    const state = getState();

    dispatch({ type: SEARCH_STARTED });

    const filters = describeSearch(state.searchPage.filters);

    executeSearch(filters, state.searchPage.results)
        .then(data => {
            if (_.get(data, 'data.errors', []).length > 0) {
                dispatch({ type: SEARCH_ERROR, errors: data.data.errors });
                return;
            }
            dispatch({ type: SEARCH_SUCCESS, data });
        })
        .catch(error => {
            dispatch({ type: SEARCH_ERROR, errors: ['Unhandled server-side error!'] });
        })
}
