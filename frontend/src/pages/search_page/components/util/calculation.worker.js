// calculation.worker.js
self.addEventListener('message', (event) => {
  const { data } = event
  const { arg_data, arg_sample_ids, func } = data

  func(arg_data, arg_sample_ids, self.postMessage)

  // Send the result back to the main thread
  self.postMessage({ type: 'result', result: '/* your calculation result */' })
})
