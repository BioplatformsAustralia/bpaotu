import * as _ from 'lodash';
import axios from 'axios';

import '../../interfaces';
import { EmptyOTUQuery } from '../../search';


// TODO global config for CKAN auth and CSRF


export function getAmplicons() {
    return axios.get(window.otu_search_config.amplicon_endpoint);
}

export function getTaxonomy(selectedAmplicon = {value: ''}, selectedTaxonomies) {
    const taxonomies = completeArray(selectedTaxonomies, 7, {value: ''});

    return axios.get(window.otu_search_config.taxonomy_endpoint, {
        params: {
            amplicon: JSON.stringify(selectedAmplicon),
            selected: JSON.stringify(taxonomies)
        }
    });
}

export function executeSearch(filters, options) {
    let formData = new FormData();
    formData.append('start', (options.page * options.pageSize).toString());
    formData.append('length', options.pageSize);
    formData.append('otu_query', JSON.stringify(filters));


    return axios({
        method: 'post',
        url: window.otu_search_config.search_endpoint, 
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
}


const makeArray = (length, fillValue) => _.map(Array(length), () => fillValue);
const completeArray = (arr, length, fillValue) => arr.concat(makeArray(length - arr.length, fillValue));