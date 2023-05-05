import axios from 'axios'
import { get as _get, map, partial, join } from 'lodash'

import { store } from 'index'
import 'interfaces'
import { ckanAuthInfoEnded } from 'reducers/auth'
import { taxonomy_keys } from 'app/constants'

axios.defaults.xsrfHeaderName = 'X-CSRFTOKEN'
axios.defaults.xsrfCookieName = 'csrftoken'

axios.interceptors.response.use(null, (err) => {
  if (err.status === 403) {
    store.dispatch(ckanAuthInfoEnded(new Error(err)))
    return
  }
  return Promise.reject(err)
})

export function ckanAuthInfo() {
  return axios.get(window.otu_search_config.ckan_check_permissions)
}

export function getReferenceData() {
  return axios.get(window.otu_search_config.reference_data_endpoint)
}

export function getTraits(selectedAmplicon) {
  return axios.get(window.otu_search_config.trait_endpoint, {
    params: {
      amplicon: JSON.stringify(selectedAmplicon),
    },
  })
}

export function getContextualDataDefinitions() {
  return axios.get(window.otu_search_config.contextual_endpoint)
}

export function getContextualDataForGraph(filters, options) {
  const formData = new FormData()
  formData.append('columns', JSON.stringify(_get(options, 'columns', [])))
  formData.append('otu_query', JSON.stringify(filters))

  return axios({
    method: 'post',
    url: window.otu_search_config.contextual_graph_endpoint,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function getTaxonomyDataForGraph(filters, options) {
  const formData = new FormData()
  formData.append('columns', JSON.stringify(_get(options, 'columns', [])))
  formData.append('otu_query', JSON.stringify(filters))

  return axios({
    method: 'post',
    url: window.otu_search_config.taxonomy_graph_endpoint,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function getTaxonomy(selectedAmplicon = { value: '' }, selectedTaxonomies, selectedTrait) {
  const taxonomies = completeArray(selectedTaxonomies, taxonomy_keys.length, { value: '' })

  return axios.get(window.otu_search_config.taxonomy_endpoint, {
    params: {
      amplicon: JSON.stringify(selectedAmplicon),
      selected: JSON.stringify(taxonomies),
      trait: JSON.stringify(selectedTrait),
    },
  })
}

function doSearch(url, filters, options) {
  const formData = new FormData()
  formData.append('start', (options.page * options.pageSize).toString())
  formData.append('length', options.pageSize)
  formData.append('sorting', JSON.stringify(_get(options, 'sorted', [])))
  formData.append('columns', JSON.stringify(_get(options, 'columns', [])))
  formData.append('otu_query', JSON.stringify(filters))

  return axios({
    method: 'post',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function nondenoisedDataRequest(
  selectedAmplicon,
  selectedSamples,
  matchSequence,
  taxonomyString
) {
  const formData = new FormData()
  formData.append('selected_amplicon', selectedAmplicon)
  formData.append('selected_samples', JSON.stringify(selectedSamples))
  formData.append('match_sequence', matchSequence)
  formData.append('taxonomy_string', taxonomyString)

  return axios({
    method: 'post',
    url: window.otu_search_config.nondenoised_request_endpoint,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function metagenomeRequest(sample_ids, fileTypes) {
  const formData = new FormData()
  formData.append('sample_ids', JSON.stringify(sample_ids))
  formData.append('selected_files', JSON.stringify(fileTypes))

  const url = join([window.otu_search_config.base_url, 'private/metagenome-request'], '/')
  return axios({
    method: 'post',
    url: url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const executeSearch = partial(doSearch, window.otu_search_config.search_endpoint)
export const executeContextualSearch = partial(
  doSearch,
  window.otu_search_config.required_table_headers_endpoint
)

function executeOtuSearch(url, filters) {
  const formData = new FormData()
  formData.append('otu_query', JSON.stringify(filters))
  return axios({
    method: 'post',
    url: url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const executeSampleSitesSearch = partial(
  executeOtuSearch,
  window.otu_search_config.search_sample_sites_endpoint
)

export const executeMetagenomeSearch = partial(
  executeOtuSearch,
  join([window.otu_search_config.base_url, 'private/metagenome-search'], '/')
)

export function executeSubmitToGalaxy(filters) {
  const formData = new FormData()
  formData.append('query', JSON.stringify(filters))

  return axios({
    method: 'post',
    url: window.otu_search_config.submit_to_galaxy_endpoint,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function executeWorkflowOnGalaxy(filters) {
  const formData = new FormData()
  formData.append('query', JSON.stringify(filters))

  return axios({
    method: 'post',
    url: window.otu_search_config.execute_workflow_on_galaxy_endpoint,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function getGalaxySubmission(submissionId) {
  return axios.get(window.otu_search_config.galaxy_submission_endpoint, {
    params: {
      submission_id: submissionId,
    },
  })
}

const makeArray = (length, fillValue) => map(Array(length), () => fillValue)
const completeArray = (arr, length, fillValue) =>
  arr.concat(makeArray(length - arr.length, fillValue))

export function executeBlast(searchString, filters) {
  const formData = new FormData()
  formData.append('query', JSON.stringify(filters))
  formData.append('search_string', searchString)

  return axios({
    method: 'post',
    url: window.otu_search_config.submit_blast_endpoint,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function getBlastSubmission(submissionId) {
  return axios.get(window.otu_search_config.blast_submission_endpoint, {
    params: {
      submission_id: submissionId,
    },
  })
}

export function apiCookieConsentAccepted() {
  return axios
    .get(window.otu_search_config.cookie_consent_accepted_endpoint.toString())
    .then((response) => {})
    .catch((error) => {})
}

export function apiCookieConsentDeclined() {
  return axios
    .get(window.otu_search_config.cookie_consent_declined_endpoint.toString())
    .then((response) => {})
    .catch((error) => {})
}
