import React from 'react'

export const executeSampleSitesComparisonProcessing = async (args) => {
  const { abundanceMatrix, contextual, plotData, selectedMethod } = args

  const sample_ids = abundanceMatrix.sample_ids
  const points = abundanceMatrix.points[selectedMethod]

  const newPlotDataMethod = sample_ids.map((s, i) => {
    return {
      text: s,
      x: points[i][0],
      y: points[i][1],
      ...contextual[s],
    }
  })

  const newPlotData = {
    ...plotData,
    [selectedMethod]: newPlotDataMethod,
  }

  return newPlotData
}
