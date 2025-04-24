import { partialRight } from 'lodash'

export function handleAPIResponse(apiFn, handlerFn) {
  apiFn().then(handlerFn).catch(handlerFn)
}

export function handleSimpleAPIResponse(dispatch, apiFn, handlerFn) {
  return handleAPIResponse(apiFn, simpleDispatch(dispatch, handlerFn))
}

export function simpleDispatch(dispatch, action) {
  return (dataOrError) => {
    dispatch(action(dataOrError))
  }
}

export function removeElementWithValue(arr, value) {
  if (value === undefined) return

  for (var i in arr) {
    if (
      arr[i]['name'] === value.name &&
      arr[i]['operator'] === value.operator &&
      arr[i]['value'] === value.value &&
      arr[i]['value2'] === value.value2 &&
      arr[i]['values'] === value.values
    ) {
      arr.splice(i, 1)
    }
  }
  return arr
}

export function changeElementAtIndex(arr, idx, fn) {
  const changedElement = fn(arr[idx])
  if (arr[idx] === changedElement) {
    return arr
  }
  let result = arr.slice(0, idx)
  if (changedElement) {
    result.push(changedElement)
  }
  result = result.concat(arr.slice(idx + 1))
  return result
}

export const removeElementAtIndex = partialRight(changeElementAtIndex, () => null)
