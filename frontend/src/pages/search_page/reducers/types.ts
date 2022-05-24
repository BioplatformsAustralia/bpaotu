import { taxonomy_keys } from '../../../constants'
import { OperatorAndValue } from '../../../search'

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
  }
  samplesMapModal: {
    isOpen: boolean
    isLoading: boolean
    markers: SampleMarker[],
    sample_otus: any[]
  }
  samplesGraphModal: {
    isOpen: boolean
    isLoading: boolean
    markers: SampleMarker[], // FIXME used?
    sample_otus: any[]
  }
  metagenomeModal: {
    sample_id: any
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
    isLoading: boolean
    errors: string[]
    data: any[]
    page: number
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
  options: []
}

export const searchPageInitialState: PageState = {
  filters: {
    selectedAmplicon: EmptyOperatorAndValue,
    taxonomy: Object.fromEntries(
      taxonomy_keys.map(k => [k, EmptySelectableLoadableValues])),
    selectedTrait: EmptyOperatorAndValue,
    contextual: {
      selectedEnvironment: EmptyOperatorAndValue,
      filtersMode: 'and',
      filters: []
    }
  },
  samplesMapModal: {
    isOpen: false,
    isLoading: false,
    markers: [],
    sample_otus: []
  },
  samplesGraphModal: {
    isOpen: false,
    isLoading: false,
    markers: [],
    sample_otus: []
  },
  metagenomeModal: {
    sample_id: null
  },
  galaxy: {
    alerts: [],
    isSubmitting: false,
    submissions: []
  },
  tips: {
    alerts: [],
  },
  results: {
    isLoading: false,
    errors: [],
    data: [],
    page: 0,
    pageSize: 10,
    rowsCount: 0,
    sorted: []
  }
}

export class ErrorList extends Error {
  public msgs: string[]
  constructor(...msgs) {
    super(msgs.join('\n'))
    this.msgs = msgs
  }
}
