export interface MapPageState {
  isLoading: boolean
  samples: any[]
  sample_otus: any[]
  abundance_matrix: any[]
}

export const mapPageInitialState: MapPageState = {
  isLoading: false,
  samples: [],
  sample_otus: [],
  abundance_matrix: [],
}
