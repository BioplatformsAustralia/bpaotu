import { get as _get, isNumber, join, last, reject } from 'lodash'
import { executeSubmitToGalaxy, executeWorkflowOnGalaxy, getGalaxySubmission } from 'api'
import { ErrorList, GalaxySubmission, searchPageInitialState } from './types'

import { createActions, handleActions } from 'redux-actions'
import { changeElementAtIndex, removeElementAtIndex } from 'reducers/utils'
import { describeSearch } from './search'

const GALAXY_SUBMISSION_POLL_FREQUENCY_MS = 5000

export const {
  submitToGalaxyStarted,
  submitToGalaxyEnded,

  galaxySubmissionUpdateStarted,
  galaxySubmissionUpdateEnded,

  clearGalaxyAlert,
} = createActions(
  'SUBMIT_TO_GALAXY_STARTED',
  'SUBMIT_TO_GALAXY_ENDED',

  'GALAXY_SUBMISSION_UPDATE_STARTED',
  'GALAXY_SUBMISSION_UPDATE_ENDED',

  'CLEAR_GALAXY_ALERT'
)

export const submitToGalaxy = () => (dispatch, getState) => {
  const state = getState()

  dispatch(submitToGalaxyStarted())

  const filters = describeSearch(state)

  executeSubmitToGalaxy(filters)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(submitToGalaxyEnded(new ErrorList(data.data.errors)))
        return
      }
      dispatch(submitToGalaxyEnded(data))
      dispatch(autoUpdateGalaxySubmission())
    })
    .catch((error) => {
      dispatch(submitToGalaxyEnded(new ErrorList('Unhandled server-side error!')))
    })
}

export const workflowOnGalaxy = () => (dispatch, getState) => {
  const state = getState()

  dispatch(submitToGalaxyStarted())

  const filters = describeSearch(state)

  executeWorkflowOnGalaxy(filters)
    .then((data) => {
      if (_get(data, 'data.errors', []).length > 0) {
        dispatch(submitToGalaxyEnded(new ErrorList(data.data.errors)))
        return
      }
      dispatch(
        submitToGalaxyEnded({
          ...data,
          isWorkflowSubmission: true,
        })
      )
      dispatch(autoUpdateGalaxySubmission())
    })
    .catch((error) => {
      dispatch(submitToGalaxyEnded(new ErrorList('Unhandled server-side error!')))
    })
}

export const autoUpdateGalaxySubmission = () => (dispatch, getState) => {
  const getLastSubmission: () => GalaxySubmission = () =>
    last(getState().searchPage.galaxy.submissions)
  const lastSubmission = getLastSubmission()

  getGalaxySubmission(lastSubmission.submissionId)
    .then((data) => {
      dispatch(galaxySubmissionUpdateEnded(data))
      const newLastSubmission = getLastSubmission()
      if (!newLastSubmission.finished) {
        setTimeout(
          () => dispatch(autoUpdateGalaxySubmission()),
          GALAXY_SUBMISSION_POLL_FREQUENCY_MS
        )
      }
    })
    .catch((error) => {
      dispatch(galaxySubmissionUpdateEnded(new Error('Unhandled server-side error!')))
    })
}

function alert(text, color = 'primary') {
  return { color, text }
}

function resetPasswordAlert() {
  const linkToReset = `${window.otu_search_config.galaxy_base_url}/user/reset_password?use_panels=True`
  const GALAXY_ALERT_USER_CREATED = alert(
    'An account has been created for you on Galaxy Australia.' +
      `Please <a target="_blank" href="${linkToReset}" className="alert-link">reset your password</a>, ` +
      'using the same email address you have registered with the Bioplatforms Data Portal.',
    'success'
  )
  return GALAXY_ALERT_USER_CREATED
}

const GALAXY_ALERT_IN_PROGRESS = alert(
  'Submission to Galaxy in Progress... Depending on your selection, this may take up to several minutes. Please leave the window open during the transfer as it will contain a direct link to your data in Galaxy Australia when completed.'
)
const GALAXY_ALERT_IN_PROGRESS_EMAIL = alert(
  'Submission to Galaxy in Progress... You can close this window. You’ll be sent an email when the job is finished with a link to the plot.'
)
const GALAXY_ALERT_ERROR = alert('An error occured while submiting to Galaxy.', 'danger')

function gettingStartedAlert(showWorkflowGuide) {
  const pdf = showWorkflowGuide
    ? 'Galaxy Australia - Krona Visualisation Quick Start Guide.pdf'
    : 'Galaxy Australia - Quick Start Guide.pdf'
  const url = join(
    [window.otu_search_config.static_base_url, 'bpaotu', 'rdc', encodeURIComponent(pdf)],
    '/'
  )
  return alert(
    `If you are new to Galaxy Australia, please see this <a target="_blank" href="${url}">Getting started guide</a>`,
    'success'
  )
}

export default handleActions(
  {
    [submitToGalaxyStarted as any]: (state, action) => ({
      ...state,
      alerts: [],
      isSubmitting: true,
    }),
    [submitToGalaxyEnded as any]: {
      next: (state, action: any) => {
        const lastSubmission: GalaxySubmission = {
          submissionId: action.payload.data.submission_id,
          userCreated: action.payload.data.user_created,
          finished: false,
          succeeded: false,
        }
        const alerts = [
          action.payload.isWorkflowSubmission
            ? GALAXY_ALERT_IN_PROGRESS_EMAIL
            : GALAXY_ALERT_IN_PROGRESS,
          gettingStartedAlert(action.payload.isWorkflowSubmission),
        ]
        if (lastSubmission.userCreated) {
          alerts.push(resetPasswordAlert())
        }
        return {
          alerts,
          submissions: [...state.submissions, lastSubmission],
          isSubmitting: false,
        }
      },
      throw: (state, action) => ({
        ...state,
        isSubmitting: false,
      }),
    },
    [galaxySubmissionUpdateEnded as any]: {
      next: (state, action: any) => {
        const lastSubmission = last(state.submissions)
        const newLastSubmissionState = ((submission) => {
          const { state: status, error, history_id } = action.payload.data.submission
          const newState = {
            ...submission,
            historyId: history_id,
            finished: status === 'ok' || status === 'error',
            succeeded: status === 'ok',
          }
          if (status === 'error') {
            newState['error'] = error
          }
          return newState
        })(lastSubmission)

        let newAlerts: any = state.alerts

        if (newLastSubmissionState['finished'] && !lastSubmission['finished']) {
          const linkToHistory = `${window.otu_search_config.galaxy_base_url}/histories/view?id=${newLastSubmissionState['historyId']}`
          const GALAXY_ALERT_SUCCESS = alert(
            'Successfully submitted to Galaxy.' +
              ` File uploaded to your <a target="_blank" href="${linkToHistory}" className="alert-link">` +
              'Galaxy history.</a>',
            'success'
          )
          newAlerts = reject(state.alerts, GALAXY_ALERT_IN_PROGRESS)
          newAlerts.push(
            newLastSubmissionState['succeeded'] ? GALAXY_ALERT_SUCCESS : GALAXY_ALERT_ERROR
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
          alerts: [GALAXY_ALERT_ERROR],
        }
      },
    },
    [clearGalaxyAlert as any]: (state, action) => {
      const index = action.payload
      const alerts = isNumber(index)
        ? removeElementAtIndex(state.alerts, index)
        : state.alerts.filter((a) => a.color === 'danger') // never auto-remove errors
      return {
        ...state,
        alerts,
      }
    },
  },
  searchPageInitialState.galaxy
)
