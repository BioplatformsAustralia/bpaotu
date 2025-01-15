import { taxonomy_keys } from 'app/constants'
import { OperatorAndValue } from 'search'

export interface LoadableValues {
  isLoading: boolean
  options: any[]
}

export interface SelectableLoadableValues extends LoadableValues {
  isDisabled: boolean
  selected: OperatorAndValue
}

export interface GalaxySubmission {
  submissionId?: string
  userCreated?: boolean
  historyId?: string
  finished: boolean
  succeeded: boolean
  error?: string
}

export interface BlastSubmission {
  submissionId: string
  finished: boolean
  succeeded: boolean
  error?: string
}

export interface ComparisonSubmission {
  submissionId: string
  finished: boolean
  succeeded: boolean
  error?: string
}

export interface Alert {
  color: string
  text: string
}

export interface PageState {
  filters: {
    selectedAmplicon: OperatorAndValue
    taxonomy: {
      [key: string]: SelectableLoadableValues
    }
    selectedTrait: OperatorAndValue
    contextual: any // TODO
    sampleIntegrityWarning: any
  }
  blastModal: {
    isOpen: boolean
    rowsCount: number
  }
  samplesMapModal: {
    isOpen: boolean
    isLoading: boolean
    markers: SampleMarker[]
    sample_otus: any[]
  }
  samplesGraphModal: {
    isOpen: boolean
  }
  samplesComparisonModal: {
    isOpen: boolean
    isLoading: boolean
    isProcessing: boolean
    markers: SampleMarker[]
    sampleOtus: any[]
    abundanceMatrix: any
    contextual: any
    selectedMethod: string
    plotData: any
  }
  metagenomeModal: {
    isLoading: boolean
    isOpen: boolean
    sample_ids: any
    error: string
  }
  galaxy: {
    isSubmitting: boolean
    alerts: Alert[]
    submissions: GalaxySubmission[]
  }
  tips: {
    alerts: Alert[]
  }
  results: {
    cleared: boolean
    isLoading: boolean
    errors: string[]
    data: any[]
    page: number
    pages: number
    pageSize: number
    rowsCount: number
    sorted: any[]
  }
}

export interface SampleMarker {
  title: string
  lat: number
  lng: number
}

export const EmptyOperatorAndValue: OperatorAndValue = { value: '', operator: 'is' }
export const EmptyLoadableValues: LoadableValues = { isLoading: null, options: [] }
export const EmptySelectableLoadableValues: SelectableLoadableValues = {
  selected: EmptyOperatorAndValue,
  isDisabled: true,
  isLoading: false,
  options: [],
}

export const searchPageInitialState: PageState = {
  filters: {
    selectedAmplicon: EmptyOperatorAndValue,
    taxonomy: Object.fromEntries(taxonomy_keys.map((k) => [k, EmptySelectableLoadableValues])),
    selectedTrait: EmptyOperatorAndValue,
    contextual: {
      selectedEnvironment: EmptyOperatorAndValue,
      filtersMode: 'and',
      filters: [],
    },
    sampleIntegrityWarning: {
      selectedEnvironment: EmptyOperatorAndValue,
      filtersMode: 'and',
      filters: [],
    },
  },
  blastModal: {
    isOpen: false,
    rowsCount: -1, // to prevent clash with "0" which prevents running blast search
  },
  samplesMapModal: {
    isOpen: false,
    isLoading: false,
    markers: [],
    sample_otus: [],
  },
  samplesGraphModal: {
    isOpen: false,
  },
  samplesComparisonModal: {
    isOpen: false,
    isLoading: false,
    isProcessing: false,
    markers: [],
    sampleOtus: [],
    abundanceMatrix: {},
    contextual: {},
    selectedMethod: 'braycurtis',
    plotData: { jaccard: [], braycurtis: [] },
  },
  metagenomeModal: {
    isOpen: false,
    isLoading: false,
    sample_ids: [],
    error: '',
  },
  galaxy: {
    alerts: [],
    isSubmitting: false,
    submissions: [],
  },
  tips: {
    alerts: [],
  },
  results: {
    cleared: true,
    isLoading: false,
    errors: [],
    data: [],
    page: 0,
    pages: 0,
    pageSize: 10,
    rowsCount: 0,
    sorted: [],
  },
}

export class ErrorList extends Error {
  public msgs: string[]
  constructor(...msgs) {
    super(msgs.join('\n'))
    this.msgs = msgs
  }
}
