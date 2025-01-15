import { filter, get as _get, includes, isNumber, join, last, reject, upperCase } from 'lodash'
import { createActions, handleActions } from 'redux-actions'

import { executeComparison, getComparisonSubmission } from 'api'
import { changeElementAtIndex, removeElementAtIndex } from 'reducers/utils'

import { describeSearch } from './search'
import { ComparisonSubmission, ErrorList } from './types'

export const HANDLE_COMPARISON_SEQUENCE = 'HANDLE_COMPARISON_SEQUENCE'
export const HANDLE_COMPARISON_PARAMETERS = 'HANDLE_COMPARISON_PARAMETERS'
export const RUN_COMPARISON_STARTED = 'RUN_COMPARISON_STARTED'
export const RUN_COMPARISON_ENDED = 'RUN_COMPARISON_ENDED'
export const COMPARISON_SUBMISSION_UPDATE_STARTED = 'COMPARISON_SUBMISSION_UPDATE_STARTED'
export const COMPARISON_SUBMISSION_UPDATE_ENDED = 'COMPARISON_SUBMISSION_UPDATE_ENDED'
export const CLEAR_COMPARISON_ALERT = 'CLEAR_COMPARISON_ALERT'

const COMPARISON_SUBMISSION_POLL_FREQUENCY_MS = 2000

export const {
  handleComparisonSequence,
  handleComparisonParameters,

  runComparisonStarted,
  runComparisonEnded,

  comparisonSubmissionUpdateStarted,
  comparisonSubmissionUpdateEnded,

  clearComparisonAlert,
} = createActions(
  HANDLE_COMPARISON_SEQUENCE,
  HANDLE_COMPARISON_PARAMETERS,

  RUN_COMPARISON_STARTED,
  RUN_COMPARISON_ENDED,

  COMPARISON_SUBMISSION_UPDATE_STARTED,
  COMPARISON_SUBMISSION_UPDATE_ENDED,

  CLEAR_COMPARISON_ALERT
)

const comparisonInitialState = {
  alerts: [],
  isSubmitting: false,
  isFinished: false,
  submissions: [],
  status: 'init',
  mem_usage: { mem: '', swap: '', cpu: '' },
  timestamps: [],
  results: { abundanceMatrix: {}, contextual: {} },
  plotData: { jaccard: [], braycurtis: [] },
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

export const autoUpdateComparisonSubmission = () => (dispatch, getState) => {
  const state = getState()
  const getLastSubmission: () => ComparisonSubmission = () =>
    last(state.searchPage.samplesComparisonSearch.submissions)
  const lastSubmission = getLastSubmission()
  getComparisonSubmission(lastSubmission.submissionId)
    .then((data) => {
      dispatch(comparisonSubmissionUpdateEnded(data))
      const newLastSubmission = getLastSubmission()
      if (!newLastSubmission.finished) {
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
  'COMPARISON search is in progress, and may take several minutes. Do not close your browser - this status will update once the search is complete.'
)
const COMPARISON_ALERT_ERROR = alert('An error occured while running COMPARISON.', 'danger')

export default handleActions(
  {
    [runComparisonStarted as any]: (state, action: any) => ({
      ...state,
      isSubmitting: true,
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
        const alerts = [COMPARISON_ALERT_IN_PROGRESS]

        return {
          ...state,
          // status: '???',
          alerts,
          submissions: [...state.submissions, lastSubmission],
        }
      },
      throw: (state, action: any) => ({
        ...state,
        isSubmitting: false,
        isFinished: false,
        status: 'error 1',
        alerts: [COMPARISON_ALERT_ERROR],
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

        let isSubmitted: any = state.isSubmitting
        let isFinished: any = false
        let results: any = comparisonInitialState.results
        let plotData: any = {}
        if (actionSubmissionState === 'complete') {
          isSubmitted = false
          isFinished = true
          results = action.payload.data.submission.results

          const { abundanceMatrix, contextual } = results
          const sample_ids = abundanceMatrix.sample_ids
          const pointsBC = abundanceMatrix.points['braycurtis']
          const pointsJ = abundanceMatrix.points['jaccard']

          plotData = {
            braycurtis: sample_ids.map((s, i) => {
              return {
                text: s,
                x: pointsBC[i][0],
                y: pointsBC[i][1],
                ...contextual[s],
              }
            }),
            jaccard: sample_ids.map((s, i) => {
              return {
                text: s,
                x: pointsJ[i][0],
                y: pointsJ[i][1],
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
          isSubmitting: isSubmitted,
          isFinished: isFinished,
          mem_usage: action.payload.data.mem_usage,
          timestamps: action.payload.data.submission.timestamps,
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
          isSubmitting: false,
          status: 'error 2',
        }
      },
    },
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
  comparisonInitialState
)
