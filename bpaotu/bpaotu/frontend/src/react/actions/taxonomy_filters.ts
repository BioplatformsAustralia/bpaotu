import * as _ from "lodash";

import { getTaxonomy } from "../api";
import { buildValueSelector, buildOperatorSelector } from "./common";

export const CLEAR_ALL_TAXONOMY_FILTERS = 'CLEAR_TAXONOMY_FILTERS';

export const taxonomies = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];
const taxonomiesBefore = target => _.takeWhile(taxonomies, t => t != target);
const taxonomiesAfter = target => taxonomies.slice(_.findIndex(taxonomies, t => t == target) + 1);

const fetchStarted = (type) => `FETCH_${type.toUpperCase()}_STARTED`;
const fetchSuccess = (type) => `FETCH_${type.toUpperCase()}_SUCCESS`;
const fetchError = (type) => `FETCH_${type.toUpperCase()}_ERROR`;

const fetchTaxonomyOptionsStarted = type => () => ({ type: fetchStarted(type) });

const fetchTaxonomyOptionsSuccess = type => (data => ({
    type: fetchSuccess(type), payload: data
}))

const fetchTaxonomyOptionsError = type => msg => ({
    type: fetchError(type), payload: msg
});

const clearTaxonomyFilter = type => () => ({ type: `CLEAR_${ type.toUpperCase() }` });
const disableTaxonomyFilter = type => () => ({ type: `DISABLE_${ type.toUpperCase() }` });

const taxonomyConfigFor = target => ({ type: target, taxonomies: taxonomiesBefore(target) });

const makeTaxonomyFetcher = config => () => (dispatch, getState) => {
    const state = getState();

    const selectedAmplicon = state.searchPage.filters.selectedAmplicon;
    const selectedTaxonomies = _.map(config.taxonomies, taxonomy => state.searchPage.filters.taxonomy[taxonomy].selected);

    if (selectedTaxonomies.length > 0 && _.last(selectedTaxonomies).value == '') {
        dispatch(clearTaxonomyFilter(config.type)());
        return Promise.resolve();
    }

    dispatch(fetchTaxonomyOptionsStarted(config.type)());
    return getTaxonomy(selectedAmplicon, selectedTaxonomies)
        .then(data => {
            dispatch(fetchTaxonomyOptionsSuccess(config.type)(data));
        }).catch(err => {
            dispatch(fetchTaxonomyOptionsError(config.type)(err));
        });
}

export const updateTaxonomyDropDowns = taxonomy => () => (dispatch, getState) => {
    const rest = taxonomy == '' ? taxonomies : taxonomiesAfter(taxonomy);

    if (_.isEmpty(rest))
        return Promise.resolve();

    rest.forEach(t => dispatch(disableTaxonomyFilter(t)()));

    const nextTaxonomy = _.first(rest);

    const fetcher = makeTaxonomyFetcher(taxonomyConfigFor(nextTaxonomy));
    dispatch(fetcher()).then(() => {
        return dispatch(updateTaxonomyDropDowns(nextTaxonomy)());
    });
}

export const fetchKingdoms = makeTaxonomyFetcher(taxonomyConfigFor('kingdom'));

export const clearAllTaxonomyFilters = () => ({ type: CLEAR_ALL_TAXONOMY_FILTERS });
