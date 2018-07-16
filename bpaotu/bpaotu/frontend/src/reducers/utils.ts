
export function handleAPIResponse(apiFn, handlerFn) {
    apiFn()
    .then(handlerFn)
    .catch(handlerFn)
}

export function handleSimpleAPIResponse(dispatch, apiFn, handlerFn) {
    return handleAPIResponse(apiFn, simpleDispatch(dispatch, handlerFn));
}

export function simpleDispatch(dispatch, action) {
    return (dataOrError) => { dispatch(action(dataOrError)) }
}
