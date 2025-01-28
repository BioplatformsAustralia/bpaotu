import { groupBy, isEmpty } from 'lodash'
import * as d3 from 'd3'

// string fields that should be grouped and coloured by values
// i.e. not for fields with free text, but fields like site codes or other classifications
export const fieldsDiscrete = ['imos_site_code']

// fields that are dates but don't have the date type
// they should follow a safe format, but will need to be treated with caution
export const fieldsDate = ['collection_date']

export const isWhat = ({ selectedFilter, selectedFilterObject }) => {
  const isOntology = selectedFilterObject && selectedFilterObject.type === 'ontology'
  const isString = selectedFilterObject && selectedFilterObject.type === 'string'
  const isContinuous = selectedFilterObject && selectedFilterObject.type === 'float'
  const isDate =
    selectedFilterObject &&
    (selectedFilterObject.type === 'date' || fieldsDate.includes(selectedFilter))

  const isDiscrete = isOntology || (isString && fieldsDiscrete.includes(selectedFilter))

  return {
    isContinuous,
    isDate,
    isDiscrete,
    isOntology,
    isString,
  }
}

// Filter keys that have null values for all samples
export const filterOptionsSubset = (contextual, contextualFilters) => {
  // all key options
  const filterOptionKeys =
    Object.keys(contextual).length > 0 ? Object.keys(Object.values(contextual)[0]) : []

  // keys with all null values
  const keysWithAllNullValues = filterOptionKeys.filter((key) => {
    // Check if all samples have null value for the current key
    return Object.values(contextual).every((sample) => sample[key] === null)
  })

  // only return those with not all null values
  return filterOptionKeys
    .sort()
    .map((x) => {
      const filter = contextualFilters.find((y) => y.name === x)

      if (filter) {
        const disabled = keysWithAllNullValues.includes(filter.name)
        if (filter.type !== 'sample_id') {
          return { value: filter.name, text: filter.display_name, disabled: disabled }
        } else {
          return null
        }
      } else {
        return null
      }
    })
    .filter((x) => x != null)
}

// data will be an array of length 1
// but the size for each of the points will be different
export const processContinuous = (data, selectedFilter) => {
  const propsToKeep = ['x', 'y', 'xj', 'yj', 'text']
  const transformedObject = {}

  var dataToLoop
  var propsToLoop

  if (selectedFilter === '') {
    dataToLoop = data
    propsToLoop = propsToKeep
  } else {
    dataToLoop = data.filter((x) => x[selectedFilter] != null)
    propsToLoop = [...propsToKeep, selectedFilter]
  }

  dataToLoop.forEach((obj) => {
    propsToLoop.forEach((key) => {
      var val = obj[key]

      if (!transformedObject[key]) {
        transformedObject[key] = []
      }
      transformedObject[key].push(val)
    })
  })

  let plotDataContinuous

  // if data still needs to process then don't try to calculate everything
  if (isEmpty(transformedObject)) {
    plotDataContinuous = []
  } else {
    plotDataContinuous = [
      {
        ...transformedObject,
        type: 'scatter',
        mode: 'markers',
      },
    ]

    const desiredMinimumMarkerSize = 20
    const desiredMaximumMarkerSize = 100
    const size = transformedObject[selectedFilter]
    const maxDataValue = Math.max(...size)
    const minDataValue = Math.min(...size)
    const scaledSizes = size.map((value) => {
      const scaledValue = (value - minDataValue) / (maxDataValue - minDataValue)
      return (
        scaledValue * (desiredMaximumMarkerSize - desiredMinimumMarkerSize) +
        desiredMinimumMarkerSize
      )
    })

    plotDataContinuous[0]['marker'] = {
      size: scaledSizes,
      sizemode: 'area',
      sizeref: 0.5,
    }
  }

  return plotDataContinuous
}

// data will be an array with an element for each group that is displayed
// also processes no filter selected
export const processDiscrete = (
  data,
  contextualFilters,
  selectedFilter,
  selectedFilterObject,
  selectedFilterExtra,
  markerSize
) => {
  const { isOntology, isString, isDiscrete, isDate } = isWhat({
    selectedFilter,
    selectedFilterObject,
  })

  const addValueToTransformedKeyData = isDate

  // If date, then we want to group by the selected date function
  // for most filtering, just group by the value of the property
  // if extra instructions given, then use that (i.e. date)

  const selectedDateFilterFunction = (x) => {
    // TODO handle bad data

    // collection_date:
    //
    // MIXs def: The time of sampling, either as an instance (single point in time) or interval.
    // In case no exact time is available, the date/time can be right truncated
    // i.e. all of these are valid times:
    // 2008-01-23T19:23:10+00:00; 2008-01-23T19:23:10; 2008-01-23; 2008-01; 2008;
    // Except: 2008-01; 2008 all are ISO8601 compliant.
    // For AM samples without a time stamp, values are truncated to a datestamp."

    const date = new Date(x[selectedFilter])

    switch (selectedFilterExtra) {
      case 'year':
        return date.getFullYear()
      case 'month':
        // There are issues with ordering of the legend with this approach
        //
        // var months = [
        //   '01 January',
        //   '02 February',
        //   '03 March',
        //   '04 April',
        //   '05 May',
        //   '06 June',
        //   '07 July',
        //   '08 August',
        //   '09 September',
        //   '10 October',
        //   '11 November',
        //   '12 December',
        // ]
        //
        // return months[date.getMonth()]
        return date.getMonth() + 1
      case 'season':
        const month = date.getMonth() + 1

        if ([12, 1, 2].includes(month)) return 'Summer'
        if ([3, 4, 5].includes(month)) return 'Autumn'
        if ([6, 7, 8].includes(month)) return 'Winter'
        if ([9, 10, 11].includes(month)) return 'Spring'
    }
  }

  // either access the selected prop, or use date filter function
  const iteratee = isDate ? selectedDateFilterFunction : selectedFilter

  const plotDataGrouped = groupBy(data, iteratee)
  const groupValues = Object.keys(plotDataGrouped).filter((x) => x !== 'null')

  function makeColourScale(schemeName, numColours) {
    const categoricalSchemes = {
      Category10: d3.schemeCategory10,
      Accent: d3.schemeAccent,
      Dark2: d3.schemeDark2,
      Set1: d3.schemeSet1,
      Set2: d3.schemeSet2,
      Set3: d3.schemeSet3,
      Paired: d3.schemePaired,
      Pastel1: d3.schemePastel1,
      Pastel2: d3.schemePastel2,
    }

    const continuousSchemes = {
      Viridis: d3.interpolateViridis,
      Plasma: d3.interpolatePlasma,
      Inferno: d3.interpolateInferno,
      Cividis: d3.interpolateCividis,
      Turbo: d3.interpolateTurbo,
      Rainbow: d3.interpolateRainbow,
    }

    // For categorical schemes
    if (categoricalSchemes[schemeName]) {
      const scale = categoricalSchemes[schemeName]
      return numColours <= scale.length
        ? scale.slice(0, numColours)
        : d3.scaleOrdinal(scale).range() // Repeat if more colors needed
    }

    // For continuous schemes (interpolate)
    if (continuousSchemes[schemeName]) {
      const interpolator = continuousSchemes[schemeName]
      return Array.from({ length: numColours }, (_, i) =>
        d3.rgb(interpolator(i / (numColours - 1))).toString()
      )
    }

    throw new Error('Invalid color scheme name')
  }

  colourScaleLength = isDate && selectedFilterExtra === 'month'

  const colourScale = makeColourScale('Viridis', groupValues.length)
  console.log('colourScale', colourScale)

  const transformedData = groupValues.map((key, index) => {
    const keyData = plotDataGrouped[key]
    const propsToKeep = ['x', 'y', 'xj', 'yj', 'text']

    const transformedKeyData = {
      ...Object.fromEntries(propsToKeep.map((prop) => [prop, []])),
      value: addValueToTransformedKeyData ? [] : undefined,
      // add value key if we are providing all values manually (for when toolstip value differs from group, i.e. date -> year or season)
    }

    // extract all properties dynamically
    keyData.forEach((item) => {
      Object.keys(item).forEach((prop) => {
        if (propsToKeep.includes(prop)) {
          if (!transformedKeyData[prop]) {
            transformedKeyData[prop] = []
          }
          transformedKeyData[prop].push(item[prop])
        }
      })

      // add the raw value if needed
      if (selectedFilter && addValueToTransformedKeyData) {
        transformedKeyData['value'].push(item[selectedFilter])
      }
    })

    let name

    if (selectedFilterObject) {
      // test isDate and isDiscrete before isString (because both also satisfy isString)
      if (isDate) {
        name = key
      } else if (isOntology) {
        const entry = selectedFilterObject.values.find((x) => parseInt(x[0]) === parseInt(key))
        name = entry[1]
        if (name === '') {
          name = 'N/A'
        }
      } else if (isDiscrete) {
        // possibly extra steps feature could be added
        name = key
      } else if (isString) {
        name = key
      }
    } else {
      // no contextual filter is chosen
      // i.e. will be plotted as a discrete field with no categories
      // console.log('processDiscrete no filter chosen')
    }

    const groupObject = {
      ...transformedKeyData,
      name: name,
      type: 'scatter',
      mode: 'markers',
      marker: { size: markerSize },
    }

    if (isDate) {
      if (selectedFilterExtra === 'season') {
        const colourMapSeason = {
          Winter: '#1f77b4', // muted blue
          Spring: '#2ca02c', // cooked asparagus green
          Autumn: '#d62728', // brick red
          Summer: '#ff7f0e', // safety orange
        }

        groupObject.marker.color = colourMapSeason[name]
      }

      if (selectedFilterExtra === 'month') {
        // use default (or another set based scheme), rather than a continuous one
        // because the wraparound from 12(Dec) to 1(Jan) is very sharp
      }

      if (selectedFilterExtra === 'year') {
        groupObject.marker.color = colourScale[index]
      }
    }

    if (isDiscrete) {
      groupObject.marker.color = colourScale[index]
    }

    return groupObject
  })

  console.log('Object.keys(transformedData)', Object.keys(transformedData))

  // TODO: does the order here matter?
  // Could order by months if selectedFilterExtra === 'month'
  // Or order by alphabetical if isDiscrete

  return transformedData
}
