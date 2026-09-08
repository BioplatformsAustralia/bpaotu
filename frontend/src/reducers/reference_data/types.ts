export interface SelectOption {
  id: string
  value: string
}

export interface AmpliconsState {
  isLoading: boolean
  values: SelectOption[]
  error: boolean
}

export interface RanksState {
  rankLabelsLookup: Record<string, string[]>
  rankLabels: Record<string, string>
}

export interface TraitsState {
  isLoading: boolean
  values: SelectOption[]
  error: boolean
}

export interface ReferenceDataState {
  amplicons: AmpliconsState
  ranks: RanksState
  traits: TraitsState
}

export const initialAmpliconsState: AmpliconsState = {
  isLoading: true,
  values: [],
  error: false,
}

export const initialRanksState: RanksState = {
  rankLabelsLookup: {},
  rankLabels: {},
}

export const initialTraitsState: TraitsState = {
  isLoading: true,
  values: [],
  error: false,
}

export const referenceDataInitialState: ReferenceDataState = {
  amplicons: initialAmpliconsState,
  ranks: initialRanksState,
  traits: initialTraitsState,
}
