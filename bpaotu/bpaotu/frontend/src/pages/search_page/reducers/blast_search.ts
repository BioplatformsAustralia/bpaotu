import { get as _get, isNumber, filter, includes, join, last, upperCase, reject } from 'lodash'
import { executeBlast, getBlastSubmission } from '../../../api'
import { ErrorList, BlastSubmission } from './types'
import { createActions, handleActions } from 'redux-actions'
import { changeElementAtIndex, removeElementAtIndex } from '../../../reducers/utils'
import { describeSearch } from './search'

export const HANDLE_BLAST_SEQUENCE = 'HANDLE_BLAST_SEQUENCE'
export const RUN_BLAST_STARTED = 'RUN_BLAST_STARTED'
export const RUN_BLAST_ENDED = 'RUN_BLAST_ENDED'
export const BLAST_SUBMISSION_UPDATE_STARTED = 'BLAST_SUBMISSION_UPDATE_STARTED'
export const BLAST_SUBMISSION_UPDATE_ENDED = 'BLAST_SUBMISSION_UPDATE_ENDED'
export const CLEAR_BLAST_ALERT = 'CLEAR_BLAST_ALERT'

const BLAST_SUBMISSION_POLL_FREQUENCY_MS = 5000

export const {
  handleBlastSequence,

  runBlastStarted,
  runBlastEnded,

  blastSubmissionUpdateStarted,
  blastSubmissionUpdateEnded,

  clearBlastAlert
} = createActions(
  HANDLE_BLAST_SEQUENCE,

  RUN_BLAST_STARTED,
  RUN_BLAST_ENDED,

  BLAST_SUBMISSION_UPDATE_STARTED,
  BLAST_SUBMISSION_UPDATE_ENDED,

  CLEAR_BLAST_ALERT
)

const blastInitialState = {
  sequenceValue: '',
  alerts: [],
  isSubmitting: false,
  submissions: []
}

export const runBlast = () => (dispatch, getState) => {
  const state = getState()

  dispatch(runBlastStarted())

  const filters = describeSearch(state.searchPage.filters)
  const search_string = state.searchPage.blastSearch.sequenceValue

  executeBlast(search_string, filters)
    .then(data => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(runBlastEnded(new ErrorList(data.data.errors)))
        return
      }
      console.log(data)
      dispatch(runBlastEnded(data))
      dispatch(autoUpdateBlastSubmission())
    })
    .catch(error => {
      dispatch(runBlastEnded(new ErrorList('Unhandled server-side error!')))
    })
}
export const autoUpdateBlastSubmission = () => (dispatch, getState) => {
  console.log(getState().searchPage.blastSearch.submissions)
  const getLastSubmission: (() => BlastSubmission) = () => last(getState().searchPage.blastSearch.submissions)
  const lastSubmission = getLastSubmission()
  console.log(lastSubmission)
  console.log(lastSubmission.submissionId)

  getBlastSubmission(lastSubmission.submissionId)
    .then(data => {
      console.log(data)
      dispatch(blastSubmissionUpdateEnded(data))
      const newLastSubmission = getLastSubmission()
      if (!newLastSubmission.finished) {
        setTimeout(() => dispatch(autoUpdateBlastSubmission()), BLAST_SUBMISSION_POLL_FREQUENCY_MS)
      }
    })
    .catch(error => {
      dispatch(blastSubmissionUpdateEnded(new Error('Unhandled server-side error!')))
    })
}
function alert(text, color = 'primary') {
  return { color, text }
}

const BLAST_ALERT_IN_PROGRESS = alert('BLAST search is in Progress ...')
const BLAST_ALERT_ERROR = alert('An error occured while running BLAST.', 'danger')

export default handleActions(
  {
    [handleBlastSequence as any]: (state, action: any) => ({
      ...state,
      sequenceValue: join(filter(upperCase(action.payload), ch => includes('GATC', ch)), ''),
      alerts: [],
      isSubmitting: false,
      submissions: []
    }),
    [runBlastStarted as any]: (state, action: any) => ({
      ...state,
      sequenceValue: state.sequenceValue,
      alerts: [],
      isSubmitting: true,
      submissions: []
    }),
    [runBlastEnded as any]: {
      next: (state, action: any) => {
        const lastSubmission: BlastSubmission = {
          submissionId: action.payload.data.submission_id,
          finished: false,
          succeeded: false
        }
        console.log(lastSubmission)
        const alerts = [BLAST_ALERT_IN_PROGRESS]
        console.log(alerts)
        console.log(state.sequenceValue)
        return {
          ...state,
          sequenceValue: state.sequenceValue,
          alerts,
          submissions: [...state.submissions, lastSubmission],
          isSubmitting: false
        }
      },
      throw: (state, action) => ({
        ...state,
        isSubmitting: false
      })
    },
    [blastSubmissionUpdateEnded as any]: {
      next: (state, action: any) => {
        const lastSubmission = last(state.submissions)
        const newLastSubmissionState = (submission => {
          const { state: status, error } = action.payload.data.submission
          const newState = {
            ...submission,
            finished: status === 'ok' || status === 'error',
            succeeded: status === 'ok'
          }
          if (status === 'error') {
            newState.error = error
          }
          return newState
        })(lastSubmission)

        let newAlerts: any = state.alerts

        if (newLastSubmissionState.finished && !lastSubmission.finished) {
          const linkToHistory = `${window.otu_search_config.blast_submission_endpoint}`
          const BLAST_ALERT_SUCCESS = alert(
            'BLAST search executed successfully.' +
              ` File uploaded to your <a target="_blank" href="${linkToHistory}" className="alert-link">` +
              'BLAST history.</a>',
            'success'
          )
          newAlerts = reject([state.alerts, BLAST_ALERT_IN_PROGRESS])
          newAlerts.push(newLastSubmissionState.succeeded ? BLAST_ALERT_SUCCESS : BLAST_ALERT_ERROR)
        }
        return {
          ...state,
          submissions: changeElementAtIndex(
            state.submissions,
            state.submissions.length - 1,
            _ => newLastSubmissionState
          ),
          alerts: newAlerts
        }
      },
      throw: (state, action) => {
        const lastSubmission = last(state.submissions)
        return {
          ...state,
          submissions: changeElementAtIndex(state.submissions, state.submissions.length - 1, submission => ({
            ...submission,
            finished: true,
            succeeded: false,
            error: action.error
          })),
          alerts: [BLAST_ALERT_ERROR]
        }
      }
    },
    [clearBlastAlert as any]: (state, action) => {
      const index = action.payload
      const alerts = isNumber(index)
        ? removeElementAtIndex(state.alerts, index)
        : state.alerts.filter(a => a.color === 'danger') // never auto-remove errors
      return {
        ...state,
        alerts
      }
    }
  },
  blastInitialState
)
