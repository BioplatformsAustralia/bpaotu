import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { executeBlastOtuSearch, executeBlast, executeCancelBlast, getBlastSubmission } from 'api'

import { handleSimpleAPIResponse, changeElementAtIndex, removeElementAtIndex } from 'reducers/utils'

import { describeSearch } from './search'
import { BlastSubmission, ErrorList, searchPageInitialState } from './types'
import { filter, includes, isNumber, join, last, reject, upperCase } from 'lodash'

const BLAST_SUBMISSION_POLL_FREQUENCY_MS = 5000

export const fetchBlastModalSamples = createAsyncThunk(
  'blast/fetchSamples',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state: any = getState()
    const filters = describeSearch(state)

    try {
      const result = await executeBlastOtuSearch(filters)
      if (result && result.data && result.data.errors && result.data.errors.length > 0) {
        return rejectWithValue(result.data.errors)
      }
      return result.data
    } catch (err) {
      return rejectWithValue(['Unhandled server-side error'])
    }
  }
)

export const runBlast = createAsyncThunk(
  'blast/run',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state: any = getState()

    const filters = describeSearch(state)
    const params = state.searchPage.blastSearchModal.blastParams
    const sequence = state.searchPage.blastSearchModal.sequenceValue

    try {
      const result = await executeBlast(sequence, params, filters)
      if (result && result.data && result.data.errors && result.data.errors.length > 0) {
        return rejectWithValue(data.data.errors)
      }
      return result
    } catch (err) {
      return rejectWithValue(['Unhandled server-side error'])
    }
  }
)

export const cancelBlast = createAsyncThunk(
  'blast/cancel',
  async (_, { getState, rejectWithValue }) => {
    const state: any = getState()

    // get the most recently added submissionId
    // (repeated calls to runBlast add a new submissionId)
    const submissions = state.searchPage.blastSearchModal.submissions
    const submissionId = submissions[submissions.length - 1].submissionId

    try {
      const result = await executeCancelBlast(submissionId)
      if (result && result.data && result.data.errors && result.data.errors.length > 0) {
        return rejectWithValue(data.data.errors)
      }
      return result
    } catch (err) {
      return rejectWithValue(['Unhandled server-side error'])
    }
  }
)

export const autoUpdateBlastSubmission = createAsyncThunk(
  'blast/poll',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state: any = getState()
    const lastSub = last(state.searchPage.blastSearchModal.submissions)

    try {
      const data = await getBlastSubmission(lastSub.submissionId)

      // previous way was this:
      // const newLastSubmission = getLastSubmission()
      // const continuePoll = !newLastSubmission.finished
      //
      // however, we need to check the state immediately to prevent another API call
      // because newLastSubmission.finished will lag due to race condition

      const submissionState = data.data.submission.state

      const stop =
        submissionState === 'complete' ||
        submissionState === 'cancelled' ||
        submissionState === 'error'

      if (!stop) {
        setTimeout(() => dispatch(autoUpdateBlastSubmission()), BLAST_SUBMISSION_POLL_FREQUENCY_MS)
      }

      return data
    } catch (err) {
      return rejectWithValue(['Unhandled server-side error'])
    }
  }
)

function alert(text: string, color = 'primary') {
  return { text, color }
}

const BLAST_ALERT_IN_PROGRESS = alert(
  'BLAST search is in progress, and may take several minutes. Do not close your browser - this status will update once the search is complete.'
)

const BLAST_ALERT_ERROR = alert('An error occured while running BLAST.', 'danger')

export const blastSearchModalSlice = createSlice({
  name: 'blastSearchModal',
  initialState: searchPageInitialState.blastSearchModal,
  reducers: {
    openBlastModal(state) {
      state.isOpen = true
    },
    closeBlastModal(state) {
      state.isOpen = false
    },
    handleBlastSequence(state, action: PayloadAction<string>) {
      state.sequenceValue = join(
        filter(upperCase(action.payload), (ch) => includes('GATC', ch)),
        ''
      )
    },
    handleBlastParameters(state, action: PayloadAction<{ param: string; value: any }>) {
      const { param, value } = action.payload
      state.blastParams[param] = value
    },
    clearBlastAlert(state, action: PayloadAction<number | undefined>) {
      const index = action.payload
      if (isNumber(index)) {
        state.alerts = removeElementAtIndex(state.alerts, index)
      } else {
        state.alerts = state.alerts.filter((a) => a.color === 'danger')
      }
      state.isFinished = false
      state.imageSrc = ''
    },
  },

  extraReducers: (builder) => {
    // Fetch samples
    builder
      .addCase(fetchBlastModalSamples.pending, (state) => {
        state.isLoading = true
        state.rowsCount = -1
      })
      .addCase(fetchBlastModalSamples.fulfilled, (state, action) => {
        state.isLoading = false
        state.rowsCount = action.payload.rowsCount
      })
      .addCase(fetchBlastModalSamples.rejected, (state) => {
        state.isLoading = false
      })

    // Run BLAST
    builder
      .addCase(runBlast.pending, (state) => {
        state.isSubmitting = true
        state.isFinished = false
        state.imageSrc = ''
        state.status = 'init'
      })
      .addCase(runBlast.fulfilled, (state, action) => {
        const sub: BlastSubmission = {
          submissionId: action.payload.data.submission_id,
          finished: false,
          succeeded: false,
        }

        state.submissions.push(sub)
        state.alerts = [BLAST_ALERT_IN_PROGRESS]
      })
      .addCase(runBlast.rejected, (state, action) => {
        state.isSubmitting = false
        state.isFinished = false
        state.alerts = [BLAST_ALERT_ERROR]
        state.status = 'error'
      })

    // Cancel BLAST
    builder.addCase(cancelBlast.pending, (state) => {
      state.isSubmitting = false
      state.isFinished = false
      state.status = 'cancelling'
    })

    builder.addCase(cancelBlast.fulfilled, (state) => {
      state.isSubmitting = false
      state.isFinished = true
      state.status = 'cancelled'
    })

    // Poll updates
    builder
      .addCase(autoUpdateBlastSubmission.fulfilled, (state, action) => {
        const data = action.payload.data
        const submission = data.submission
        const status = submission.state

        const lastSubmission = last(state.submissions)
        const updated = {
          ...lastSubmission,
          finished: status === 'complete' || status === 'error',
          succeeded: status === 'complete',
          error: status === 'error' ? submission.error : undefined,
        }

        state.submissions[state.submissions.length - 1] = updated

        if (status === 'complete') {
          state.isSubmitting = false
          state.isFinished = true
          state.resultUrl = submission.result_url
          state.imageSrc = submission.image_contents
            ? `data:image/png;base64,${submission.image_contents}`
            : ''

          const hasResults = submission.row_count > 0

          let text = 'BLAST search executed successfully. '
          if (hasResults) {
            text += `Click <a target="_blank" href="${submission.result_url}" className="alert-link">here</a> to download the results.`
          } else {
            text += 'No results were found for the given sequence.'
          }

          const successAlert = alert(text, 'success')
          state.alerts = reject([state.alerts, BLAST_ALERT_IN_PROGRESS])
          state.alerts.push(updated.succeeded ? successAlert : BLAST_ALERT_ERROR)
        }

        state.status = status
        state.isCancelled = !!submission.cancelled
      })
      .addCase(autoUpdateBlastSubmission.rejected, (state, action) => {
        state.alerts = [BLAST_ALERT_ERROR]
        state.imageSrc = ''
        state.isSubmitting = false
      })
  },
})

export const {
  openBlastModal,
  closeBlastModal,
  clearBlastAlert,
  handleBlastSequence,
  handleBlastParameters,
} = blastSearchModalSlice.actions

export default blastSearchModalSlice.reducer
