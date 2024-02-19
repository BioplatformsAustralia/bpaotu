import React from 'react'
import _ from 'lodash'
import numeric from 'numeric'
import BrayCurtis from './BrayCurtis'
import Jaccard from 'jaccard-index'
const jaccard = Jaccard()

export const executeSampleSitesComparisonProcessing = async (args) => {
  const { abundanceMatrix, contextual, plotData, selectedMethod } = args

  if (plotData[selectedMethod].length) {
    console.log(`Using cached ${selectedMethod} plot data`)
    // it should just update automatically because
    // SamplesComparisonModal component will re-render with a changed selectedMethod

    return plotData
  } else {
    await new Promise((r) => setTimeout(r, 50)) // let renderer catch up
    console.log(`Calculating ${selectedMethod} plot data`)

    // setProcessingStarted() // modal isnt updated in time for this to display
    const data = abundanceMatrix.matrix
    const sample_ids = abundanceMatrix.sample_ids
    const processedData =
      selectedMethod === 'jaccard'
        ? getJaccardDistanceMatrix(data, sample_ids)
        : getBrayCurtisDistanceMatrix(data, sample_ids)

    const mds = classicMDS(processedData.matrix, 2)
    const positions = numeric.transpose(mds)

    console.log('processedData', processedData)
    console.log('contextual', contextual)

    const newPlotDataMethod = processedData.samples.map((s, i) => {
      return {
        text: s,
        x: positions[0][i],
        y: positions[1][i],
        ...contextual[s], // TODO: only include some (or better: only include some in response)
      }
    })

    const newPlotData = {
      ...plotData,
      [selectedMethod]: newPlotDataMethod,
    }

    return newPlotData
  }
}

export const sparseToJaccardMatrix = (data) => {
  const maxSampleIndex = _.max(data.map((d) => d[1])) // : number
  const matrix = new Array(maxSampleIndex + 1).fill(0).map(() => [])
  data.forEach((elm, idx) => {
    const [taxonIdx, sampleIdx, abundance] = elm
    matrix[sampleIdx].push(taxonIdx)
    // denseData[sampleIdx][taxonIdx] = abundance;
  })
  return matrix
}

export const sparseToDense = (data, transformValue = (val) => val) => {
  try {
    const maxSampleIndex = _.max(data.map((d) => d[1])) // : number
    const maxTaxonIndex = _.max(data.map((d) => d[0])) // : number
    const denseData = new Array(maxSampleIndex + 1)
      .fill(0)
      .map(() => new Array(maxTaxonIndex + 1).fill(0))

    data.forEach((elm, idx) => {
      const [taxonIdx, sampleIdx, abundance] = elm
      // console.log(`abundance ${abundance}  ${transformValue(abundance)}`)
      denseData[sampleIdx][taxonIdx] = transformValue(abundance)
    })

    return denseData
  } catch (err) {
    console.log(err)
  }
}

export const getJaccardDistanceMatrix = (sparseMatrix, samples) => {
  console.log('getJaccardDistanceMatrix')
  // let samples = Object.keys(data)

  // create a dataframe
  const data = sparseToJaccardMatrix(sparseMatrix)
  const matrix = [...data.map(() => new Array(data.length))]

  console.log(`Processing ${data.length} records...`)
  for (let i = 0; i < data.length; i++) {
    if (i % 100 === 0) {
      console.log(`Processed ${i} records`)
    }
    const res = matrix[i]
    res[i] = 0 // dist to self always 0
    // const sample1 = samples[i]
    for (let j = i + 1; j < data.length; j++) {
      //   const sample2 = samples[j]
      let idx = jaccard.index(data[i], data[j]) /* || 0 */ // * 10000;

      res[j] = idx || 0
      matrix[j][i] = idx || 0
    }
  }
  return {
    matrix,
    samples,
  }
}

export const getBrayCurtisDistanceMatrix = (sparseMatrix, samples) => {
  console.log('getBrayCurtisDistanceMatrix')

  // Scale abundances, see https://github.com/gbif/edna-tool-ui/issues/2#issuecomment-1717637957
  const transformAbundance = (val) => Math.pow(val, 1 / 4)

  // create a dataframe
  const vectors = sparseToDense(sparseMatrix, transformAbundance)
  const matrix = [...vectors.map(() => new Array(vectors.length))]

  try {
    const brayCurtis = new BrayCurtis(vectors)
    for (let i = 0; i < vectors.length; i++) {
      const res = matrix[i]
      res[i] = 0 // dist to self always 0
      // const sample1 = samples[i]
      for (let j = i + 1; j < vectors.length; j++) {
        //  const sample2 = samples[j]
        let idx = brayCurtis.calculateSimilarityBetweenVectors(i, j)

        res[j] = idx
        matrix[j][i] = idx
      }
    }
    return {
      matrix,
      samples,
    }
    // console.log(brayCurtis)
  } catch (err) {
    console.log(err)
  }
}

/// given a matrix of distances between some points, returns the
/// point coordinates that best approximate the distances using
/// classic multidimensional scaling
export const classicMDS = (distances, dimensions) => {
  dimensions = dimensions || 2

  // square distances
  var M = numeric.mul(-0.5, numeric.pow(distances, 2))

  // double centre the rows/columns
  function mean(A) {
    return numeric.div(numeric.add.apply(null, A), A.length)
  }
  var rowMeans = mean(M),
    colMeans = mean(numeric.transpose(M)),
    totalMean = mean(rowMeans)

  for (var i = 0; i < M.length; ++i) {
    for (var j = 0; j < M[0].length; ++j) {
      M[i][j] += totalMean - rowMeans[i] - colMeans[j]
    }
  }

  // take the SVD of the double centred matrix, and return the
  // points from it
  var ret = numeric.svd(M),
    eigenValues = numeric.sqrt(ret.S)
  return ret.U.map(function (row) {
    return numeric.mul(row, eigenValues).splice(0, dimensions)
  })
}
