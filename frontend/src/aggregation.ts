import * as turf from '@turf/turf'
import { sum } from 'lodash'

function aggregateSamplePointsBySite(siteAggs: Array<SiteAggregate>) {
  let samplePoints = []
  let latlngPoints: { [index: string]: any } = {}

  for (const site of siteAggs) {
    const key: string = site.latitude + '~' + site.longitude
    const value: number = site.abundance
    key in latlngPoints ? latlngPoints[key].push(value) : (latlngPoints[key] = [value])
  }
  for (const [latlng, abundance] of Object.entries(latlngPoints)) {
    const lat_lng = latlng.split('~')
    let meanAbundance = sum(abundance) / abundance.length
    samplePoints.push([parseFloat(lat_lng[0]), parseFloat(lat_lng[1]), meanAbundance])
  }
  return samplePoints
}

function aggregateSampleContextBySite(samples) {
  let sampleContextLookup = {}
  for (let x of samples) {
    if (typeof x['bpadata'] !== 'undefined' && x['bpadata']) {
      for (const [key, sampleContext] of Object.entries(x['bpadata'])) {
        sampleContextLookup[key] = sampleContext
      }
    }
  }
  return sampleContextLookup
}

/**
 * Iterates the sample otu json response and sums the values by site
 * @param {*} sampleOtus
 */
function aggregateSampleOtusBySite(sample_Otus) {
  let siteAggs: Array<SiteAggregate> = []
  for (let i in sample_Otus) {
    let sampleOtus = new SampleOtus(
      sample_Otus[i][0],
      sample_Otus[i][1],
      sample_Otus[i][2],
      parseInt(sample_Otus[i][3]),
      parseInt(sample_Otus[i][4])
    )
    if (isNaN(sampleOtus.abundance)) {
      // No Abundance_20k for sample OTU
      continue
    }
    let siteAgg = new SiteAggregate(sampleOtus)
    siteAgg.calculateAbundanceRichness(sampleOtus)
    siteAggs.push(siteAgg)
  }
  return siteAggs
}

class SampleOtus {
  latitude: number
  longitude: number
  sampleId: string
  richness: number
  abundance: number

  constructor(
    latitude: number,
    longitude: number,
    sampleId: string,
    richness: number,
    abundance: number
  ) {
    this.latitude = latitude
    this.longitude = longitude
    this.sampleId = sampleId
    this.richness = richness
    this.abundance = abundance
  }
}

class SiteAggregate {
  latitude: number
  longitude: number
  richness: number
  abundance: number
  siteID: string

  constructor(sampleOtus: SampleOtus) {
    this.latitude = sampleOtus.latitude
    this.longitude = sampleOtus.longitude
    this.richness = 0
    this.abundance = 0
    this.siteID = sampleOtus.sampleId
  }

  calculateAbundanceRichness(sampleOtus: SampleOtus) {
    this.abundance += sampleOtus.abundance
    this.richness += sampleOtus.richness
  }
}

function aggregateSamplesByCell(siteAggs, detailLevel) {
  let cellAggs = {}
  if (siteAggs.length === 0) {
    return cellAggs
  }
  let [min, max] = calculateCellBounds(siteAggs)

  // Add buffer of detailLevel for bounds
  max = [max[0] + detailLevel, max[1] + detailLevel]
  min = [min[0] - detailLevel, min[1] - detailLevel]

  // calculate width/height of bounding box
  let xLength = Math.abs(max[0] - min[0])
  let yLength = Math.abs(max[1] - min[1])

  // Check if detailLevel is higher than width/height of the bounding box
  let xyLength = xLength > yLength ? yLength : xLength
  detailLevel = detailLevel > xyLength ? xyLength : detailLevel

  // Calculate cell counts
  const xCellCnt = Math.floor(xLength / detailLevel)
  const yCellCnt = Math.floor(yLength / detailLevel)

  let siteValues = []
  for (let site of siteAggs) {
    siteValues.push([site.longitude, site.latitude])
  }

  // Create polygon if site exists
  var polyFeatures: { [index: string]: any } = {}
  for (let x = 0; x < xCellCnt; x++) {
    for (let y = 0; y < yCellCnt; y++) {
      const x1 = min[0] + x * detailLevel
      const y1 = min[1] + y * detailLevel
      const x2 = x1 + detailLevel
      const y2 = y1 + detailLevel
      let poly = turf.bboxPolygon([x1, y1, x2, y2])
      for (let site of siteValues) {
        if (turf.booleanPointInPolygon(site, poly)) {
          polyFeatures[x + '_' + y] = poly
          break
        }
      }
    }
  }

  for (const [featureIndex, poly] of Object.entries(polyFeatures)) {
    let removeList = []
    for (let site of siteAggs) {
      if (turf.booleanPointInPolygon([site.longitude, site.latitude], poly)) {
        if (cellAggs[featureIndex] === undefined) {
          cellAggs[featureIndex] = {
            abundance: 0,
            richness: 0,
            sites: [],
            coordinates: poly.geometry.coordinates[0],
          }
        }
        let cell = cellAggs[featureIndex]
        cell.abundance += parseInt(site.abundance)
        cell.richness += parseInt(site.richness)
        cell.sites.push(site.siteID)
      } else removeList.push(site)
      siteAggs = removeList
    }
  }
  return cellAggs
}

function calculateCellBounds(siteAggs: Array<SiteAggregate>) {
  let xseries = []
  let yseries = []

  for (const site of siteAggs) {
    xseries.push(site.longitude)
    yseries.push(site.latitude)
  }
  const xmax = Math.max(...xseries)
  const ymax = Math.max(...yseries)
  const xmin = Math.min(...xseries)
  const ymin = Math.min(...yseries)

  return [
    [xmin, ymin],
    [xmax, ymax],
  ]
}

/**
 * Calculates the maximum values within a cell
 * @param {*} cellAggs
 */
function calculateMaxes(cellAggs) {
  let abundance = 0
  let richness = 0
  let sites = 0
  for (let key in cellAggs) {
    let cell = cellAggs[key]
    if (cell.abundance / cell.sites.length > abundance) {
      abundance = cell.abundance / cell.sites.length
    }
    if (cell.richness / cell.sites.length > richness) {
      richness = cell.richness / cell.sites.length
    }
    if (cell.sites.length > sites) {
      sites = cell.sites.length
    }
  }
  return {
    abundance,
    richness,
    sites,
  }
}

export {
  aggregateSampleOtusBySite,
  aggregateSamplesByCell,
  aggregateSamplePointsBySite,
  aggregateSampleContextBySite,
  calculateMaxes,
}
