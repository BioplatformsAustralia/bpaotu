import { filter, get as _get, includes, isNumber, join, last, reject, upperCase } from 'lodash'
import { createActions, handleActions } from 'redux-actions'

import { executeBlast, executeCancelBlast, getBlastSubmission } from 'api'
import { changeElementAtIndex, removeElementAtIndex } from 'reducers/utils'

import { describeSearch } from './search'
import { BlastSubmission, ErrorList, searchPageInitialState } from './types'

export const HANDLE_BLAST_SEQUENCE = 'HANDLE_BLAST_SEQUENCE'
export const HANDLE_BLAST_PARAMETERS = 'HANDLE_BLAST_PARAMETERS'
export const RUN_BLAST_STARTED = 'RUN_BLAST_STARTED'
export const RUN_BLAST_ENDED = 'RUN_BLAST_ENDED'
export const BLAST_SUBMISSION_UPDATE_STARTED = 'BLAST_SUBMISSION_UPDATE_STARTED'
export const BLAST_SUBMISSION_UPDATE_ENDED = 'BLAST_SUBMISSION_UPDATE_ENDED'
export const CANCEL_BLAST_STARTED = 'CANCEL_BLAST_STARTED'
export const CANCEL_BLAST_ENDED = 'CANCEL_BLAST_ENDED'
export const CLEAR_BLAST_ALERT = 'CLEAR_BLAST_ALERT'

const BLAST_SUBMISSION_POLL_FREQUENCY_MS = 5000

export const {
  handleBlastSequence,
  handleBlastParameters,

  runBlastStarted,
  runBlastEnded,
  blastSubmissionUpdateStarted,
  blastSubmissionUpdateEnded,
  cancelBlastStarted,
  cancelBlastEnded,

  clearBlastAlert,
} = createActions(
  HANDLE_BLAST_SEQUENCE,
  HANDLE_BLAST_PARAMETERS,

  RUN_BLAST_STARTED,
  RUN_BLAST_ENDED,
  BLAST_SUBMISSION_UPDATE_STARTED,
  BLAST_SUBMISSION_UPDATE_ENDED,
  CANCEL_BLAST_STARTED,
  CANCEL_BLAST_ENDED,

  CLEAR_BLAST_ALERT
)

export const runBlast = () => (dispatch, getState) => {
  const state = getState()

  dispatch(runBlastStarted())

  const filters = describeSearch(state)
  const searchParameters = state.searchPage.blastSearch.blastParams
  const searchString = state.searchPage.blastSearch.sequenceValue

  executeBlast(searchString, searchParameters, filters)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(runBlastEnded(new ErrorList(data.data.errors)))
        return
      }
      dispatch(runBlastEnded(data))
      dispatch(autoUpdateBlastSubmission())
    })
    .catch((error) => {
      dispatch(runBlastEnded(new ErrorList('Unhandled server-side error!')))
    })
}

export const cancelBlast = () => (dispatch, getState) => {
  const state = getState()

  dispatch(cancelBlastStarted())

  // get the most recently added submissionId
  // (repeated calls to runBlast add a new submissionId)
  const { submissions } = state.searchPage.blastSearch
  const submissionId = submissions[submissions.length - 1].submissionId

  executeCancelBlast(submissionId)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(cancelBlastEnded(new ErrorList(data.data.errors)))
        return
      }
      dispatch(cancelBlastEnded(data))
    })
    .catch((error) => {
      dispatch(cancelBlastEnded(new ErrorList('Unhandled server-side error!')))
    })
}

export const autoUpdateBlastSubmission = () => (dispatch, getState) => {
  const getLastSubmission: () => BlastSubmission = () =>
    last(getState().searchPage.blastSearch.submissions)
  const lastSubmission = getLastSubmission()
  getBlastSubmission(lastSubmission.submissionId)
    .then((data) => {
      dispatch(blastSubmissionUpdateEnded(data))

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
        setTimeout(() => dispatch(autoUpdateBlastSubmission()), BLAST_SUBMISSION_POLL_FREQUENCY_MS)
      }
    })
    .catch((error) => {
      dispatch(blastSubmissionUpdateEnded(new Error('Unhandled server-side error!')))
    })
}
function alert(text, color = 'primary') {
  return { color, text }
}

const BLAST_ALERT_IN_PROGRESS = alert(
  'BLAST search is in progress, and may take several minutes. Do not close your browser - this status will update once the search is complete.'
)
const BLAST_ALERT_ERROR = alert('An error occured while running BLAST.', 'danger')

export default handleActions(
  {
    [handleBlastSequence as any]: (state, action: any) => ({
      ...state,
      sequenceValue: join(
        filter(upperCase(action.payload), (ch) => includes('GATC', ch)),
        ''
      ),
    }),
    [handleBlastParameters as any]: (state, action: any) => {
      return {
        ...state,
        blastParams: { ...state.blastParams, [action.payload.param]: action.payload.value },
      }
    },
    [runBlastStarted as any]: (state, action: any) => ({
      ...state,
      isSubmitting: true,
      isFinished: false,
      imageSrc: '',
      status: 'init',
    }),
    [runBlastEnded as any]: {
      next: (state, action: any) => {
        const lastSubmission: BlastSubmission = {
          submissionId: action.payload.data.submission_id,
          finished: false,
          succeeded: false,
        }
        const alerts = [BLAST_ALERT_IN_PROGRESS]

        return {
          ...state,
          sequenceValue: state.sequenceValue,
          blastParams: state.blastParams,
          alerts,
          imageSrc: state.imageSrc,
          submissions: [...state.submissions, lastSubmission],
        }
      },
      throw: (state, action: any) => ({
        ...state,
        isSubmitting: false,
        isFinished: false,
        alerts: [BLAST_ALERT_ERROR],
        imageSrc: '',
        status: 'error',
      }),
    },
    [blastSubmissionUpdateEnded as any]: {
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
            newState['error'] = error
          }
          return newState
        })(lastSubmission)

        let isSubmitting: any = state.isSubmitting
        let isFinished: any = false
        let resultUrl: any = searchPageInitialState.blastSearch.resultUrl
        let imageSrc: any = searchPageInitialState.blastSearch.imageSrc
        let newAlerts: any = state.alerts

        // if (action.payload.data.submission.result_url) {
        //   isSubmitting = false
        //   isFinished = true
        // }

        if (actionSubmissionState === 'complete') {
          isSubmitting = false
          isFinished = true
          resultUrl = action.payload.data.submission.result_url
          const resultImg64 = action.payload.data.submission.image_contents
          if (resultImg64) {
            imageSrc = `data:image/png;base64,${resultImg64}`
          }

          const hasResults = action.payload.data.submission.row_count > 0

          let alertContent = 'BLAST search executed successfully. '

          if (hasResults) {
            alertContent =
              alertContent +
              `Click <a target="_blank" href="${resultUrl}" className="alert-link">here</a> to download the results.`
          } else {
            alertContent = alertContent + 'No results were found for the given sequence.'
          }

          const BLAST_ALERT_SUCCESS = alert(alertContent, 'success')
          newAlerts = reject([state.alerts, BLAST_ALERT_IN_PROGRESS])
          newAlerts.push(
            newLastSubmissionState['succeeded'] ? BLAST_ALERT_SUCCESS : BLAST_ALERT_ERROR
          )
        }

        return {
          ...state,
          submissions: changeElementAtIndex(
            state.submissions,
            state.submissions.length - 1,
            (_) => newLastSubmissionState
          ),
          alerts: newAlerts,
          isSubmitting: isSubmitting,
          isFinished: isFinished,
          isCancelled: !!actionSubmission.cancelled,
          status: actionSubmissionState,
          imageSrc: imageSrc,
          resultUrl: resultUrl,
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
          alerts: [BLAST_ALERT_ERROR],
          imageSrc: '',
          isSubmitting: false,
        }
      },
    },
    [cancelBlastStarted as any]: (state, action: any) => ({
      ...state,
      isSubmitting: false,
      isFinished: false,
      status: 'cancelling',
    }),
    [cancelBlastEnded as any]: (state, action: any) => ({
      ...state,
      isSubmitting: false,
      isFinished: true,
      status: 'cancelled',
    }),
    [clearBlastAlert as any]: (state, action) => {
      const index = action.payload
      const alerts = isNumber(index)
        ? removeElementAtIndex(state.alerts, index)
        : state.alerts.filter((a) => a.color === 'danger') // never auto-remove errors
      return {
        ...state,
        alerts,
        imageSrc: '',
        isFinished: false,
      }
    },
  },
  searchPageInitialState.blastSearch
)
