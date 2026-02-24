import { join } from 'lodash'

export const logoPNG = (name: string) =>
  join([window.otu_search_config.static_base_url.replace(/\/$/, ''), 'bpa-logos', name], '/')
