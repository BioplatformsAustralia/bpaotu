import * as turf from "@turf/turf"
import {sum} from "lodash"

function aggregateSamplePointsBySite(siteAggs) {
  let samplePoints = [];
  let latlngPoints: { [index: string]: any } = {};

  for (let siteId in siteAggs) {
    let site = siteAggs[siteId];
    const key: string = site.latitude+"~"+site.longitude
    const value: number = parseInt(site.abundance)
    key in latlngPoints ? latlngPoints[key].push(value) : latlngPoints[key] = [value]
  }
  for(const [latlng, abundance] of Object.entries(latlngPoints))
  {
    const lat_lng = latlng.split("~")
    let meanAbundance = sum(abundance)/abundance.length
    samplePoints.push([parseFloat(lat_lng[0]), parseFloat(lat_lng[1]), meanAbundance]);
  }
  return samplePoints;
}

function aggregateSampleContextBySite(samples) {
  let sampleContextLookup = {};
  for (let x of samples){
    if (typeof(x['bpadata']) !== "undefined" && x['bpadata']){
      for (const [key, sampleContext] of Object.entries(x['bpadata'])) {
          // console.log(x['lat'], x['lng'], "sampleContext.id", key, "sampleContext:", sampleContext)
          sampleContextLookup[key] = sampleContext;
      }
    }
  }
  return sampleContextLookup;
}

/**
 * Iterates the sample otu json response and sums the values by site
 * @param {*} sampleOtus
 */
function aggregateSampleOtusBySite(sample_Otus) {
  let siteAggs = {};
  for (let i in sample_Otus) {
    let sampleOtus = new SampleOtus(sample_Otus[i][0], sample_Otus[i][1], sample_Otus[i][2], parseInt(sample_Otus[i][3]), parseInt(sample_Otus[i][4]));
    sampleOtus.longitude = _corrected_longitude(sampleOtus.longitude)
    let siteId = sampleOtus.sampleId;
    if (!(siteId in siteAggs)) {
      siteAggs[siteId] = new SiteAggregate(sampleOtus);
    }
    let siteAgg = siteAggs[siteId];
    siteAgg.calculateAbundanceRichness(sampleOtus);
  }
  return siteAggs;
}

class SampleOtus {

    latitude: number
    longitude: number
    sampleId: string
    richness: number
    abundance: number

  constructor(latitude: number, longitude: number, sampleId: string, richness: number, abundance: number) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.sampleId = sampleId;
    this.richness = richness;
    this.abundance = abundance;
  }
}

class SiteAggregate {
    latitude: number
    longitude: number
    richness: number
    abundance: number

  constructor(sampleOtus: SampleOtus) {
    this.latitude = sampleOtus.latitude;
    this.longitude = sampleOtus.longitude;
    this.richness = 0;
    this.abundance = 0;
  }

  calculateAbundanceRichness(sampleOtus: SampleOtus) {
    this.abundance += sampleOtus.abundance;
    this.richness += sampleOtus.richness;
  }
}

function aggregateSamplesByCell(siteAggs) {
  let cellAggs = {};
  let detailLevel = 2;
  let [max, min] = calculateCellBounds(siteAggs)
  let xMax = Math.abs(max[0])-Math.abs(min[0])
  let yMax = Math.abs(max[0])-Math.abs(min[1])
  let xyMax = xMax > yMax ? yMax : xMax
  detailLevel = detailLevel > xyMax ? xyMax : detailLevel
  // console.log("max, min: ", max, min, "xMax:", xMax, "yMax:", yMax, "detailLevel:", detailLevel, "xyMax:", xyMax)
  var bbbox: [number, number, number, number] = [max[0]+detailLevel, max[1]+detailLevel, min[0]-detailLevel, min[1]-detailLevel];
  var options: { [index: string]: any } =  {units: 'degrees'};
  var gridFeatures = turf.squareGrid(bbbox, detailLevel, options);
  var polyFeatures: { [index: string]: any } = {}

  turf.featureEach(gridFeatures, function (currentFeature, featureIndex) {
    let bbox = turf.bbox(currentFeature)
    let poly = turf.bboxPolygon(bbox);
    polyFeatures[featureIndex] = poly
  });

  for (let siteId in siteAggs) {
    let site = siteAggs[siteId];
    let pt = turf.point([site.longitude, site.latitude]);
    for (const [featureIndex, poly] of Object.entries(polyFeatures)) {
      let conta = false;
      if(turf.booleanPointInPolygon(pt, poly)) {
      // if(turf.booleanContains(poly, pt)) {
        conta = true
        if ((cellAggs[featureIndex] === undefined)) {
        // if (!(featureIndex in cellAggs)) {
          cellAggs[featureIndex] = {
            abundance: 0,
            richness: 0,
            sites: [],
            coordinates:  poly.geometry.coordinates[0]
          };
        }
        // Adding values that are allowed to overlap/accumulate.
        let cell = cellAggs[featureIndex];
        cell.abundance += parseInt(site.abundance);
        cell.richness += parseInt(site.richness);
        cell.sites.push(siteId);
      }
      if(conta)
        break
    }
  }
  return cellAggs;
}

function calculateCellBounds(siteAggs) {
  let xseries = [];
  let yseries = [];

  for (let siteId in siteAggs) {
    let site = siteAggs[siteId];
    xseries.push(site.longitude);
    yseries.push(site.latitude);
  }
  const xmax = Math.max(...xseries);
  const ymax = Math.max(...yseries);
  const xmin = Math.min(...xseries);
  const ymin = Math.min(...yseries);

  return [[xmax, ymax], [xmin, ymin]];
}

export function _corrected_longitude(lng) {
  if (lng < 0) {
    lng += 360
  }
  return lng
}

/**
 * Calculates the maximum values within a cell
 * @param {*} cellAggs
 */
function calculateMaxes(cellAggs) {
  let abundance = 0;
  let richness = 0;
  let sites = 0;
  for (let key in cellAggs) {
    let cell = cellAggs[key];
    if (cell.abundance/cell.sites.length > abundance) {
      abundance = cell.abundance/cell.sites.length;
    }
    if (cell.richness/cell.sites.length > richness) {
      richness = cell.richness/cell.sites.length;
    }
    if (cell.sites.length > sites) {
      sites = cell.sites.length;
    }
  }
  return {
    abundance,
    richness,
    sites
  };
}

export { aggregateSampleOtusBySite, aggregateSamplesByCell, aggregateSamplePointsBySite, aggregateSampleContextBySite, calculateMaxes };
