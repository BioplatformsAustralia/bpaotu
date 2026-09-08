import { createStore, applyMiddleware, compose, type AnyAction } from 'redux'
import thunk, { ThunkDispatch } from 'redux-thunk'
import rootReducer from 'reducers'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export const store = createStore(rootReducer, composeEnhancers(applyMiddleware(thunk)))

export type RootState = ReturnType<typeof rootReducer>

export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>
