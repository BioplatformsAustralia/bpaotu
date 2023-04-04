import { map } from 'lodash'
import { createActions, handleAction } from 'redux-actions'
import { getTraits } from '../../api'
import { selectTrait } from '../../pages/search_page/reducers/trait'
import { getAmpliconFilter } from '../../pages/search_page/reducers/amplicon'

export const { fetchTraitsStarted, fetchTraitsEnded } = createActions(
  'FETCH_TRAITS_STARTED',
  'FETCH_TRAITS_ENDED'
)

export const fetchTraits = () => {
  return (dispatch: any, getState) => {
    dispatch(selectTrait(''))
    dispatch(fetchTraitsStarted())
    const state = getState()
    return getTraits(getAmpliconFilter(state))
      .then((data) => {
        dispatch(fetchTraitsEnded(data))
      })
      .catch((err) => {
        dispatch(fetchTraitsEnded(err))
      })
  }
}

const initialState = {
  isLoading: true,
  values: [],
  error: false,
}

export default handleAction(
  fetchTraitsEnded,
  {
    next: (state, action: any) => ({
      isLoading: false,
      error: false,
      values: map(action.payload.data.possibilities, (option: any) => ({
        id: option[0],
        value: option[1],
      })),
    }),
    throw: (state, action: any) => {
      // tslint:disable-next-line:no-console
      console.error('Error while loading traits: ', action.payload)
      return {
        isLoading: false,
        error: true,
        values: [],
      }
    },
  },
  initialState
)
