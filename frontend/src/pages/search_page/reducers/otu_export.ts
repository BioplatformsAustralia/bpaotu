import { createActions, handleActions } from 'redux-actions'
import { searchPageInitialState } from './types'

import { executeOtuExport, executeCancelOtuExport, getOtuExportSubmission } from 'api'
import { changeElementAtIndex, removeElementAtIndex } from 'reducers/utils'

import { describeSearch } from './search'
import { OtuExportSubmission, ErrorList } from './types'

import { get as _get, isNumber, last } from 'lodash'

export const {
  runOtuExportStarted,
  runOtuExportEnded,
  otuExportSubmissionUpdateStarted,
  otuExportSubmissionUpdateEnded,
  cancelOtuExportStarted,
  cancelOtuExportEnded,
  clearOtuExportAlert,
} = createActions(
  'RUN_OTU_EXPORT_STARTED',
  'RUN_OTU_EXPORT_ENDED',
  'OTU_EXPORT_SUBMISSION_UPDATE_STARTED',
  'OTU_EXPORT_SUBMISSION_UPDATE_ENDED',
  'CANCEL_OTU_EXPORT_STARTED',
  'CANCEL_OTU_EXPORT_ENDED',
  'CLEAR_OTU_EXPORT_ALERT'
)

const SUBMISSION_POLL_FREQUENCY_MS = 2000

export const runOtuExport = () => (dispatch, getState) => {
  const state = getState()

  dispatch(runOtuExportStarted())

  const filters = describeSearch(state)

  executeOtuExport(filters)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(runOtuExportEnded(new ErrorList(...data.data.errors)))
        return
      }
      dispatch(runOtuExportEnded(data))
      dispatch(autoUpdateOtuExportSubmission())
    })
    .catch((error) => {
      dispatch(runOtuExportEnded(new ErrorList('Unhandled server-side error!')))
    })
}

export const cancelOtuExport = () => (dispatch, getState) => {
  const state = getState()

  dispatch(cancelOtuExportStarted())

  // get the most recently added submissionId
  // (repeated calls to runOtuExport add a new submissionId)
  const { submissions } = state.searchPage.otuExport
  const submissionId = submissions[submissions.length - 1].submissionId

  executeCancelOtuExport(submissionId)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(cancelOtuExportEnded(new ErrorList(data.data.errors)))
        return
      }
      dispatch(cancelOtuExportEnded(data))
    })
    .catch((error) => {
      dispatch(cancelOtuExportEnded(new ErrorList('Unhandled server-side error!')))
    })
}

export const autoUpdateOtuExportSubmission = () => (dispatch, getState) => {
  const state = getState()
  const getLastSubmission: () => OtuExportSubmission = () =>
    last(state.searchPage.otuExport.submissions)
  const lastSubmission = getLastSubmission()

  getOtuExportSubmission(lastSubmission.submissionId)
    .then((data) => {
      dispatch(otuExportSubmissionUpdateEnded(data))

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
        setTimeout(() => dispatch(autoUpdateOtuExportSubmission()), SUBMISSION_POLL_FREQUENCY_MS)
      }
    })
    .catch((error) => {
      if (error.response && error.response.status === 504) {
        // status: 504, statusText: "Gateway Time-out"
        dispatch(
          otuExportSubmissionUpdateEnded(
            new Error(
              'Server-side error. It is possible that the result set is too large. Please run a search with fewer samples.'
            )
          )
        )
      } else {
        dispatch(otuExportSubmissionUpdateEnded(new Error('Unhandled server-side error!')))
      }
    })
}

export default handleActions(
  {
    [runOtuExportStarted as any]: (state, action: any) => ({
      ...state,
      isLoading: true,
      isFinished: false,
      status: 'init',
      errors: [],
      resultUrl: '',
    }),
    [runOtuExportEnded as any]: {
      next: (state, action: any) => {
        const lastSubmission: OtuExportSubmission = {
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
    [otuExportSubmissionUpdateEnded as any]: {
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
        let resultUrl: any = searchPageInitialState.blastSearchModal.resultUrl

        if (actionSubmissionState === 'complete') {
          isLoading = false
          isFinished = true
          resultUrl = action.payload.data.submission.result_url
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
          timestamps: action.payload.data.submission.timestamps,
          errors: errors,
          status: actionSubmissionState,
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
          isLoading: false,
          isFinished: false,
          status: 'error',
          errors: [action.payload.message],
        }
      },
    },
    [cancelOtuExportStarted as any]: (state, action: any) => ({
      ...state,
      isLoading: false,
      isFinished: false,
      status: 'cancelling',
    }),
    [cancelOtuExportEnded as any]: (state, action: any) => ({
      ...state,
      isLoading: false,
      isFinished: true,
      status: 'cancelled',
    }),
    [clearOtuExportAlert as any]: (state, action) => {
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
  searchPageInitialState.otuExport
)
