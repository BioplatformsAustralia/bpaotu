import { createActions, handleActions } from 'redux-actions'
import {
  executeComparison,
  executeCancelComparison,
  executeClearComparison,
  getComparisonSubmission,
} from 'api'
import { changeElementAtIndex, removeElementAtIndex } from 'reducers/utils'
import { describeSearch } from './search'
import { ComparisonSubmission, ErrorList, searchPageInitialState } from './types'

import { get as _get, isNumber, last } from 'lodash'

export const {
  openSamplesComparisonModal,
  closeSamplesComparisonModal,

  samplesComparisonModalClearPlotData,
  samplesComparisonModalSetSelectedMethod,
  samplesComparisonModalSetSelectedFilter,
  samplesComparisonModalSetSelectedFilterExtra,
  handleUmapParameters,
  resetUmapParameters,
  runComparisonStarted,
  runComparisonEnded,
  comparisonSubmissionUpdateStarted,
  comparisonSubmissionUpdateEnded,
  cancelComparisonStarted,
  cancelComparisonEnded,
  clearComparisonStarted,
  clearComparisonEnded,
} = createActions(
  'OPEN_SAMPLES_COMPARISON_MODAL',
  'CLOSE_SAMPLES_COMPARISON_MODAL',

  'SAMPLES_COMPARISON_MODAL_CLEAR_PLOT_DATA',
  'SAMPLES_COMPARISON_MODAL_SET_SELECTED_METHOD',
  'SAMPLES_COMPARISON_MODAL_SET_SELECTED_FILTER',
  'SAMPLES_COMPARISON_MODAL_SET_SELECTED_FILTER_EXTRA',
  'HANDLE_UMAP_PARAMETERS',
  'RESET_UMAP_PARAMETERS',
  'RUN_COMPARISON_STARTED',
  'RUN_COMPARISON_ENDED',
  'COMPARISON_SUBMISSION_UPDATE_STARTED',
  'COMPARISON_SUBMISSION_UPDATE_ENDED',
  'CANCEL_COMPARISON_STARTED',
  'CANCEL_COMPARISON_ENDED',
  'CLEAR_COMPARISON_STARTED',
  'CLEAR_COMPARISON_ENDED'
)

const COMPARISON_SUBMISSION_POLL_FREQUENCY_MS = 2000

export const setSelectedMethod = (selectedMethod) => (dispatch, getState) => {
  dispatch(samplesComparisonModalSetSelectedMethod(selectedMethod))
}

export const setSelectedFilter = (selectedFilter) => (dispatch, getState) => {
  dispatch(samplesComparisonModalSetSelectedFilter(selectedFilter))
}

export const setSelectedFilterExtra = (selectedFilterExtra) => (dispatch, getState) => {
  dispatch(samplesComparisonModalSetSelectedFilterExtra(selectedFilterExtra))
}

export const clearPlotData = () => (dispatch, getState) => {
  dispatch(samplesComparisonModalClearPlotData())
}

export const runComparison =
  (umapParams, submissionId = null) =>
  (dispatch, getState) => {
    const state = getState()
    const filters = describeSearch(state)

    // pass submissionId as action payload to determine if this is submission or resubmission
    dispatch(runComparisonStarted(submissionId))

    executeComparison(filters, umapParams, submissionId)
      .then((data) => {
        if (_get(data, 'data.errors', []).length > 0) {
          dispatch(runComparisonEnded(new ErrorList(...data.data.errors)))
          return
        }
        dispatch(runComparisonEnded(data))
        dispatch(autoUpdateComparisonSubmission())
      })
      .catch((error) => {
        dispatch(runComparisonEnded(new ErrorList('Unhandled server-side error!')))
      })
  }

export const cancelComparison = () => (dispatch, getState) => {
  const state = getState()

  dispatch(cancelComparisonStarted())

  // get the most recently added submissionId
  // (repeated calls to runComparison add a new submissionId)
  const { submissions } = state.searchPage.samplesComparisonModal
  const submissionId = submissions[submissions.length - 1].submissionId

  executeCancelComparison(submissionId)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(cancelComparisonEnded(new ErrorList(data.data.errors)))
        return
      }
      dispatch(cancelComparisonEnded(data))
    })
    .catch((error) => {
      dispatch(cancelComparisonEnded(new ErrorList('Unhandled server-side error!')))
    })
}

export const clearComparison = () => (dispatch, getState) => {
  const state = getState()

  dispatch(clearComparisonStarted())

  // get the most recently added submissionId
  // (repeated calls to runComparison add a new submissionId)
  const { submissions } = state.searchPage.samplesComparisonModal
  const submissionId = submissions[submissions.length - 1].submissionId

  executeClearComparison(submissionId)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(clearComparisonEnded(new ErrorList(data.data.errors)))
        return
      }
      dispatch(clearComparisonEnded(data))
    })
    .catch((error) => {
      dispatch(clearComparisonEnded(new ErrorList('Unhandled server-side error!')))
    })
}

export const autoUpdateComparisonSubmission = () => (dispatch, getState) => {
  const state = getState()
  const getLastSubmission: () => ComparisonSubmission = () =>
    last(state.searchPage.samplesComparisonModal.submissions)
  const lastSubmission = getLastSubmission()

  getComparisonSubmission(lastSubmission.submissionId)
    .then((data) => {
      dispatch(comparisonSubmissionUpdateEnded(data))

      // previous way was this:
      // const newLastSubmission = getLastSubmission()
      // const continuePoll = !newLastSubmission.finished
      //
      // however, we need to check the state immediately to prevent another API call
      // because newLastSubmission.finished will lag due to race condition
      const { state } = data.data.submission
      const stopPoll = state === 'complete' || state === 'cancelled' || state === 'error'
      const continuePoll = !stopPoll

      if (continuePoll) {
        // TODO:
        // consider a variable poll frequency depending on estimated time of completion
        // based on how long first few state changes take and what the current state is
        setTimeout(
          () => dispatch(autoUpdateComparisonSubmission()),
          COMPARISON_SUBMISSION_POLL_FREQUENCY_MS
        )
      }
    })
    .catch((error) => {
      if (error.response && error.response.status === 504) {
        // status: 504, statusText: "Gateway Time-out"
        console.log('autoUpdateComparisonSubmission', 'error', error)
        dispatch(
          comparisonSubmissionUpdateEnded(
            new Error(
              'Server-side error. It is possible that the result set is too large. Please run a search with fewer samples.'
            )
          )
        )
      } else {
        dispatch(comparisonSubmissionUpdateEnded(new Error('Unhandled server-side error!')))
      }
    })
}

export default handleActions(
  {
    [openSamplesComparisonModal as any]: (state, action) => ({
      ...state,
      isOpen: true,
    }),
    [closeSamplesComparisonModal as any]: (state, action) => ({
      ...state,
      isOpen: false,
    }),
    [samplesComparisonModalSetSelectedMethod as any]: (state, action: any) => ({
      ...state,
      selectedMethod: action.payload,
    }),
    [samplesComparisonModalSetSelectedFilter as any]: (state, action: any) => ({
      ...state,
      selectedFilter: action.payload,
    }),
    [samplesComparisonModalSetSelectedFilterExtra as any]: (state, action: any) => ({
      ...state,
      selectedFilterExtra: action.payload,
    }),
    [samplesComparisonModalClearPlotData as any]: (state, action: any) => ({
      ...state,
      plotData: searchPageInitialState.samplesComparisonModal.plotData,
    }),
    [handleUmapParameters as any]: (state, action: any) => {
      return {
        ...state,
        umapParams: { ...state.umapParams, [action.payload.param]: action.payload.value },
      }
    },
    [resetUmapParameters as any]: (state, action: any) => {
      return {
        ...state,
        umapParams: searchPageInitialState.samplesComparisonModal.umapParams,
      }
    },
    [runComparisonStarted as any]: (state, action: any) => ({
      ...state,
      isLoading: true,
      isFinished: false,
      status: action.payload ? 'reload' : 'init',
      errors: [],
    }),
    [runComparisonEnded as any]: {
      next: (state, action: any) => {
        const lastSubmission: ComparisonSubmission = {
          submissionId: action.payload.data.submission_id,
          finished: false,
          succeeded: false,
        }

        return {
          ...state,
          submissions: [...state.submissions, lastSubmission],
        }
      },
      throw: (state, action: any) => ({
        ...state,
        isLoading: false,
        isFinished: false,
        status: 'error',
        errors: action.payload.msgs,
      }),
    },
    [comparisonSubmissionUpdateEnded as any]: {
      next: (state, action: any) => {
        const actionSubmission = action.payload.data.submission
        const actionSubmissionState = actionSubmission.state
        const lastSubmission = last(state.submissions)
        const newLastSubmissionState = ((submission) => {
          const { state: status, error } = action.payload.data.submission
          const newState = {
            ...submission,
            finished: status === 'complete' || status === 'error',
            succeeded: status === 'complete',
          }
          if (status === 'error') {
            newState['errors'] = error
          }
          return newState
        })(lastSubmission)

        let isLoading: any = state.isLoading
        let isFinished: any = false
        let results: any = searchPageInitialState.samplesComparisonModal.results
        let plotData: any = searchPageInitialState.samplesComparisonModal.plotData

        if (actionSubmissionState === 'complete') {
          isLoading = false
          isFinished = true
          results = action.payload.data.submission.results

          const { abundanceMatrix, contextual } = results
          const sample_ids = abundanceMatrix.sample_ids
          const pointsBC = abundanceMatrix.points['braycurtis']
          // const pointsJ = abundanceMatrix.points['jaccard']

          // apply a jitter so that points aren't put on the same place (makes graph misleading)
          // need to retain the original value to put in the tooltip though
          const jitterAmount = 0.005
          plotData = {
            braycurtis: sample_ids.map((s, i) => {
              return {
                text: s,
                x: pointsBC[i][0],
                xj: pointsBC[i][0] + (Math.random() * 2 - 1) * jitterAmount,
                y: pointsBC[i][1],
                yj: pointsBC[i][1] + (Math.random() * 2 - 1) * jitterAmount,
                ...contextual[s],
              }
            }),
            jaccard: [],
            // jaccard: sample_ids.map((s, i) => {
            //   return {
            //     text: s,
            //     x: pointsJ[i][0],
            //     xj: pointsJ[i][0] + (Math.random() * 2 - 1) * jitterAmount,
            //     y: pointsJ[i][1],
            //     yj: pointsJ[i][1] + (Math.random() * 2 - 1) * jitterAmount,
            //     ...contextual[s],
            //   }
            // }),
          }
        }

        const errors = action.payload.data.submission.error
          ? [action.payload.data.submission.error]
          : []

        if (errors.length > 0) {
          isLoading = false
          isFinished = false
        }

        return {
          ...state,
          submissions: changeElementAtIndex(
            state.submissions,
            state.submissions.length - 1,
            (_) => newLastSubmissionState
          ),
          isLoading: isLoading,
          isFinished: isFinished,
          isCancelled: !!actionSubmission.cancelled,
          mem_usage: action.payload.data.mem_usage,
          timestamps: action.payload.data.submission.timestamps,
          errors: errors,
          status: actionSubmissionState,
          results: results,
          plotData: plotData,
        }
      },
      throw: (state, action) => {
        return {
          ...state,
          submissions: changeElementAtIndex(
            state.submissions,
            state.submissions.length - 1,
            (submission) => ({
              ...submission,
              finished: true,
              succeeded: false,
              error: action.error,
            })
          ),
          isLoading: false,
          isFinished: false,
          status: 'error',
          errors: [action.payload.message],
        }
      },
    },
    [cancelComparisonStarted as any]: (state, action: any) => ({
      ...state,
      isLoading: false,
      isFinished: false,
      status: 'cancelling',
    }),
    [cancelComparisonEnded as any]: (state, action: any) => ({
      ...state,
      isLoading: false,
      isFinished: true,
      status: 'cancelled',
    }),
    [clearComparisonStarted as any]: (state, action: any) => ({
      ...state,
      isLoading: false,
      isFinished: false,
      status: 'clearing',
    }),
    [clearComparisonEnded as any]: (state, action: any) => ({
      ...state,
      isLoading: false,
      isFinished: true,
      status: 'cleared',
    }),
  },
  searchPageInitialState.samplesComparisonModal
)
