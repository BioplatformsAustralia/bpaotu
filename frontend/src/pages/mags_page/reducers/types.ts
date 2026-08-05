
interface MagRecord {
  id: number
  sample_id: number
  bin_id: string
  method: string
  tax: string
  tax_16s: string
  tax_gtdb: string
  length: number
  gc_perc: number
  num_contigs: number
  disparity: number
  completeness: number
  contamination: number
  strain_het: number
  coverage: number
  tpm: number
  quality: number
}


export interface MagsPageState {
  // selected: string | null
  results: {
    cleared: boolean
    isLoading: boolean
    hasLoaded: boolean
    errors: string[]
    data: MagRecord[]
    page: number
    pages: number
    pageSize: number
    rowsCount: number
    filtered: any[]
    sorted: any[]
  }
  samples: {
    isLoading: false,
    hasLoaded: false,
    data: [],
    otus: [],
    sampleMagsCount: {
      isLoading: false,
      hasLoaded: false,
    },
  }
}

export const magsPageInitialState: MagsPageState = {
  results: {
    cleared: false,
    isLoading: false,
    hasLoaded: false,
    errors: [],
    data: [],
    page: 0,
    pages: 0,
    pageSize: 100,
    rowsCount: 0,
    filtered: [],
    sorted: [],
  },
  samples: {
    isLoading: false,
    hasLoaded: false,
    data: [],
    otus: [],
    sampleMagsCount: {
      isLoading: false,
      hasLoaded: false,
    },
  }
}
