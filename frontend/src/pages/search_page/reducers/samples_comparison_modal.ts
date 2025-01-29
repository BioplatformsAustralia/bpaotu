import { createActions, handleActions } from 'redux-actions'
import { searchPageInitialState } from './types'

import { executeComparison, executeCancelComparison, getComparisonSubmission } from 'api'
import { changeElementAtIndex, removeElementAtIndex } from 'reducers/utils'

import { describeSearch } from './search'
import { ComparisonSubmission, ErrorList } from './types'

import { filter, get as _get, includes, isNumber, join, last, reject, upperCase } from 'lodash'

export const {
  openSamplesComparisonModal,
  closeSamplesComparisonModal,

  samplesComparisonModalSetSelectedMethod,
  samplesComparisonModalSetSelectedFilter,
  samplesComparisonModalSetSelectedFilterExtra,

  runComparisonStarted,
  runComparisonEnded,
  comparisonSubmissionUpdateStarted,
  comparisonSubmissionUpdateEnded,
  cancelComparisonStarted,
  cancelComparisonEnded,
  clearComparisonAlert,

  samplesComparisonModalClearPlotData,
} = createActions(
  'OPEN_SAMPLES_COMPARISON_MODAL',
  'CLOSE_SAMPLES_COMPARISON_MODAL',

  'SAMPLES_COMPARISON_MODAL_SET_SELECTED_METHOD',
  'SAMPLES_COMPARISON_MODAL_SET_SELECTED_FILTER',
  'SAMPLES_COMPARISON_MODAL_SET_SELECTED_FILTER_EXTRA',

  'RUN_COMPARISON_STARTED',
  'RUN_COMPARISON_ENDED',
  'COMPARISON_SUBMISSION_UPDATE_STARTED',
  'COMPARISON_SUBMISSION_UPDATE_ENDED',
  'CANCEL_COMPARISON_STARTED',
  'CANCEL_COMPARISON_ENDED',
  'CLEAR_COMPARISON_ALERT',

  'SAMPLES_COMPARISON_MODAL_CLEAR_PLOT_DATA'
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

export const runComparison = () => (dispatch, getState) => {
  const state = getState()

  dispatch(runComparisonStarted())

  const filters = describeSearch(state)

  executeComparison(filters)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(runComparisonEnded(new ErrorList(data.data.errors)))
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

  const { submissions } = state.searchPage.samplesComparisonModal
  const submissionId = submissions[0].submissionId

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
      const stopPoll = state === 'complete' || state === 'cancelled'
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
      dispatch(comparisonSubmissionUpdateEnded(new Error('Unhandled server-side error!')))
    })
}

function alert(text, color = 'primary') {
  return { color, text }
}

const COMPARISON_ALERT_IN_PROGRESS = alert(
  'Comparison is in progress, and may take several minutes. Do not close your browser - this status will update once the search is complete.'
)
const COMPARISON_ALERT_ERROR = alert('An error occured while running comparison.', 'danger')

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
      // plotData: searchPageInitialState.samplesComparisonModal.plotData,
    }),
    [runComparisonStarted as any]: (state, action: any) => ({
      ...state,
      isLoading: true,
      isFinished: false,
      status: 'init',
    }),
    [runComparisonEnded as any]: {
      next: (state, action: any) => {
        const lastSubmission: ComparisonSubmission = {
          submissionId: action.payload.data.submission_id,
          finished: false,
          succeeded: false,
        }
        // const alerts = [COMPARISON_ALERT_IN_PROGRESS]

        return {
          ...state,
          // alerts,
          submissions: [...state.submissions, lastSubmission],
        }
      },
      throw: (state, action: any) => ({
        ...state,
        isLoading: false,
        isFinished: false,
        status: 'error',
        errors: action.payload.data.errors,
      }),
    },
    [comparisonSubmissionUpdateEnded as any]: {
      next: (state, action: any) => {
        const actionSubmissionState = action.payload.data.submission.state
        const lastSubmission = last(state.submissions)
        const newLastSubmissionState = ((submission) => {
          const { state: status, error } = action.payload.data.submission
          const newState = {
            ...submission,
            finished: status === 'complete' || status === 'error',
            succeeded: status === 'complete',
          }
          if (status === 'error') {
            newState['error'] = error
          }
          return newState
        })(lastSubmission)

        let newAlerts: any = state.alerts
        if (newLastSubmissionState['finished'] && !lastSubmission['finished']) {
          const resultUrl = action.payload.data.submission.result_url
          const COMPARISON_ALERT_SUCCESS = alert(
            'COMPARISON search executed successfully. ' +
              `Click <a target="_blank" href="${resultUrl}" className="alert-link">` +
              'here</a> to download the results.',
            'success'
          )
          newAlerts = reject([state.alerts, COMPARISON_ALERT_IN_PROGRESS])
          newAlerts.push(
            newLastSubmissionState['succeeded'] ? COMPARISON_ALERT_SUCCESS : COMPARISON_ALERT_ERROR
          )
        }

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
          const pointsJ = abundanceMatrix.points['jaccard']

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
            jaccard: sample_ids.map((s, i) => {
              return {
                text: s,
                x: pointsJ[i][0],
                xj: pointsJ[i][0] + (Math.random() * 2 - 1) * jitterAmount,
                y: pointsJ[i][1],
                yj: pointsJ[i][1] + (Math.random() * 2 - 1) * jitterAmount,
                ...contextual[s],
              }
            }),
          }
        }

        return {
          ...state,
          submissions: changeElementAtIndex(
            state.submissions,
            state.submissions.length - 1,
            (_) => newLastSubmissionState
          ),
          alerts: newAlerts,
          isLoading: isLoading,
          isFinished: isFinished,
          mem_usage: action.payload.data.mem_usage,
          timestamps: action.payload.data.submission.timestamps,
          errors: action.payload.data.errors,
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
          alerts: [COMPARISON_ALERT_ERROR],
          isLoading: false,
          status: 'error 2',
          error: action.payload.data.error,
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
    [clearComparisonAlert as any]: (state, action) => {
      const index = action.payload
      const alerts = isNumber(index)
        ? removeElementAtIndex(state.alerts, index)
        : state.alerts.filter((a) => a.color === 'danger') // never auto-remove errors
      return {
        ...state,
        alerts,
        isFinished: false,
        status: 'init',
      }
    },
  },
  searchPageInitialState.samplesComparisonModal
)
