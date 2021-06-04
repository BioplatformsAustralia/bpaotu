import * as turf from "@turf/turf"
import {sum} from "lodash"

function aggregateSamplePointsBySite(siteAggs) {
  let samplePoints = [];
  let latlngPoints = {};
  console.time("Loading Sample Points");

  for (let siteId in siteAggs) {
    let site = siteAggs[siteId];
    const key = site.latitude+"~"+site.longitude
    const value = parseInt(site.abundance)
    // console.log("site.abundance", siteId, key, value)
    // samplePoints.push([site.latitude, site.longitude, value]);
    key in latlngPoints ? latlngPoints[key].push(value) : latlngPoints[key] = [value]
  }

  for(const [latlng, abundance] of Object.entries(latlngPoints))
  {
    const lat_lng = latlng.split("~")
    // console.log(latlng, abundance)
    let meanAbundance = sum(abundance)/abundance.length
    // console.log(lat_lng[0], lat_lng[1], abundance, abundance.length, meanAbundance)
    samplePoints.push([parseFloat(lat_lng[0]), parseFloat(lat_lng[1]), meanAbundance]);
  }

//   // const maxVal = 100/20000
//   const maxVal = 1

//   samplePoints.push([-41.445287345770616, 147.37, 20000/maxVal])
//   samplePoints.push([-41.445287345770616, 147.27, 10000/maxVal])
//   samplePoints.push([-41.445287345770616, 147.17, 5000/maxVal])

//   samplePoints.push([-42.04118904502326, 146.69, 20000/maxVal])
//   samplePoints.push([-42.04118904502326, 146.64, 5000/maxVal])
//   samplePoints.push([-42.04118904502326, 146.64, 7000/maxVal])

//   console.log("aggregateSamplePointsBySite", samplePoints.length);
  console.timeEnd("Loading Sample Points");
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
    let sampleOtus = new SampleOtus(...sample_Otus[i]);
    // if(sampleOtus.abundance!==20000)
      // console.log(sampleOtus.sampleId, sampleOtus.abundance)
    // sampleOtus.longitude = sampleOtus.longitude
    sampleOtus.longitude = _corrected_longitude(sampleOtus.longitude)
    let siteId = sampleOtus.sampleId;
    // let siteId = sampleOtus.longitude+"~"+sampleOtus.latitude;
    // if site doesn't exist set up blank site and always increment to avoid messy conditionals.
    if (!(siteId in siteAggs)) {
      siteAggs[siteId] = new SiteAggregate(sampleOtus);
    }
    let siteAgg = siteAggs[siteId];
    siteAgg.calculateAbundanceRichness(sampleOtus);
  }
  return siteAggs;
}

class SampleOtus {
  constructor(latitude, longitude, sampleId, richness, abundance) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.sampleId = sampleId;
    this.richness = richness;
    this.abundance = abundance;
  }
}

class SiteAggregate {
  constructor(sampleOtus) {
    this.latitude = sampleOtus.latitude;
    this.longitude = sampleOtus.longitude;
    this.richness = 0;
    this.abundance = 0;
  }

  calculateAbundanceRichness(sampleOtus) {
    this.abundance += parseInt(sampleOtus.abundance);
    this.richness += parseInt(sampleOtus.richness);
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
  var bbbox = [max[0]+detailLevel, max[1]+detailLevel, min[0]-detailLevel, min[1]-detailLevel];
  var options = {units: 'degrees'};
  var gridFeatures = turf.squareGrid(bbbox, detailLevel, options);
  var polyFeatures = {}

  turf.featureEach(gridFeatures, function (currentFeature, featureIndex) {
    let bbox = turf.bbox(currentFeature)
    let poly = turf.bboxPolygon(bbox);
    polyFeatures[featureIndex] = poly
  });

  // console.time("polyFeatures");
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
  // console.timeEnd("polyFeatures");
  return cellAggs;
}

// function aggregateSamplesByCell1(siteAggs) {
//   let detailLevel = 5;
//   // setting up grid parameters
//   // makeGrid(detailLevel, siteAggs);
//   // console.log("aggregate by cell");
//   // let start = [164.71222, -33.977509];
//   // let end = [178.858982, -49.66352];

//   // let start = [113.338953078, -43.6345972634];
//   // let end = [153.569469029, -10.6681857235];

//   // let start = [72.2460938, -55.3228175];
//   // let end = [168.2249543, -9.0882278];

//   // let end = [54.4599425793, -74.2985233187];
//   // let start = [197.1943175793, 9.4812549404];

//   // start = [191.38388, 0.00383]
//   // end = [74.1272, -68.60012912]

//   // start = [191.38388, 0.00383]
//   // end = [-174.784083, -68.60012912]

//   // console.log(start, end)
//   // console.log("test"); 
//   let [start, end] = calculateCellBounds(siteAggs)
//   // console.log("start, end: ", start, end)

//   // let latOffset = (start[0] - end[0]) / detailLevel;
//   // let lngOffset = (end[1] - start[1]) / detailLevel;
//   let latOffset = (start[1] - end[1]) / detailLevel;
//   let lngOffset = (start[0] - end[0]) / detailLevel;
//   // console.log("latOffset", latOffset, "lngOffset", lngOffset)

//   // // const hardBounds = L.latLngBounds(start, end);
//   // // const northWest = hardBounds.getNorthWest();
//   // // const northEast = hardBounds.getNorthEast();
//   // // const southWest = hardBounds.getSouthWest();
//   // // console.log("hardbounds", northWest, northEast, southWest)
  
//   // // NOTE: alternative way of calculating is incorrectly plotting. some strange offset.
//   // // const northWest = L.latLng(start[0], start[1]);
//   // // const northEast = L.latLng(start[0], end[1]);
//   // // const southWest = L.latLng(end[0], start[1]);
//   // console.log("start", northWest, northEast, southWest)

//   // let latOffset = (northWest.lat - southWest.lat) / detailLevel;
//   // let lngOffset = (northWest.lng - northEast.lng) / detailLevel;
//   // console.log("latOffset", latOffset, "lngOffset", lngOffset)
//   // // latOffset 1.954278 lngOffset -1.1433993186666667
  
//   // using the params for generating the keys
//   let cellAggs = {};
//   for (let siteId in siteAggs) {
//     let site = siteAggs[siteId];
//     let x = site.longitude;
//     let y = site.latitude;
//     let cellKey = generateCellKey(x, y, start, lngOffset, latOffset);
//     // if doesn't exist, create the cell.
//     if (!(cellKey in cellAggs)) {
//       cellAggs[cellKey] = {
//         abundance: 0,
//         richness: 0,
//         sites: [],
//         // otus: [],
//         coordinates: calculateCellCoordinates(
//           cellKey,
//           start,
//           lngOffset,
//           latOffset
//         )
//       };
//     }
//     // Adding values that are allowed to overlap/accumulate.
//     let cell = cellAggs[cellKey];
//     cell.abundance += site.abundance;
//     cell.richness += site.richness;
//     cell.sites.push(siteId);
//     for (let key in cellAggs) {
//       let cellAgg = cellAggs[key];
//       cellAgg["siteCount"] = cellAgg.sites.length;
//     }
//     // console.log(cell.coordinates)
//   }
//   // console.log("aggregateSamplesByCell1", cellAggs)
//   return cellAggs;
  
//   function calculateCellCoordinates(key, start, latOffset, lngOffset) {
//     // can use the key + grid start to reverse engineer the coordinates
//     let offsets = parseInt(key);
//     let yFactor = Math.floor(offsets / detailLevel);
//     // let yFactor = offsets / detailLevel;
//     let xFactor = offsets % detailLevel;
//     let cellStartX = start[0] + lngOffset * xFactor;
//     let cellStartY = start[1] - latOffset * yFactor;
//     // order: topleft, topright, bottomright, bottomleft
//     return [
//       [cellStartX, cellStartY],
//       [cellStartX + lngOffset, cellStartY],
//       [cellStartX + lngOffset, cellStartY - latOffset],
//       [cellStartX, cellStartY - latOffset]
//     ];
//   }

//   function generateCellKey(x, y, start, latOffset, lngOffset) {
//     let lngDiff = Math.abs(x) - Math.abs(start[0]);
//     let colIndex = Math.floor(lngDiff / lngOffset);
//     let latDiff = Math.abs(y) - Math.abs(start[1]);
//     let rowIndex = Math.floor(latDiff / latOffset);
//     let cellKey = rowIndex * detailLevel + colIndex;
//     return cellKey;
//   }
// }


// function calculateCellBoundingBox(siteAggs) {
//   var bounds = {}, latitude, longitude;
//   for (let siteId in siteAggs) {
//     let site = siteAggs[siteId];
//     longitude = site.longitude;
//     latitude  = site.latitude;
//     // Update the bounds recursively by comparing the current xMin/xMax and yMin/yMax with the current coordinate
//     bounds.xMin = bounds.xMin < longitude ? bounds.xMin : longitude;
//     bounds.xMax = bounds.xMax > longitude ? bounds.xMax : longitude;
//     bounds.yMin = bounds.yMin < latitude ? bounds.yMin : latitude;
//     bounds.yMax = bounds.yMax > latitude ? bounds.yMax : latitude;
//   }
//   // console.log("bounds: "+bounds.xMax +", "+bounds.yMax+", "+bounds.xMin +", "+bounds.yMin)
//   return bounds;
// }

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
  // (116.48699, -29.85744, 115.25452, -32.99188)
}

/**
 * Makes grid array for cells. Each cell starts off with only containing coordinates.
 * @param {*} detailLevel
 */
// function makeGrid(detailLevel, siteAggs) {
//   //Hard coded bounds and offsets.
//   // const gridStart = [164.71222, -33.977509];
//   // const gridEnd = [178.858982, -49.66352];
//   // const gridStart = [113.338953078, -43.6345972634];
//   // const gridEnd = [153.569469029, -10.6681857235];
//   // const gridStart = [72.2460938, -55.3228175];
//   // const gridEnd = [168.2249543, -9.0882278];


//   let [gridStart, gridEnd] = calculageCellBounds(siteAggs)
//   console.log(gridStart, gridEnd)

//   let latOffset = (gridStart[0] - gridEnd[0]) / detailLevel;
//   let lngOffset = (gridEnd[1] - gridStart[1]) / detailLevel;
//   // console.log("latOffset", latOffset, "lngOffset", lngOffset)

//   // const gridStart = [191.38388, 0.00383]
//   // const gridEnd = [74.1272, -68.60012912]

//   // const hardBounds = L.latLngBounds(gridStart, gridEnd);
//   // let northWest = hardBounds.getNorthWest();
//   // let northEast = hardBounds.getNorthEast();
//   // let southWest = hardBounds.getSouthWest();
//   // const latOffset = (northWest.lat - southWest.lat) / detailLevel;
//   // const lngOffset = (northEast.lng - northWest.lng) / detailLevel;
//   // // console.log(latOffset, lngOffset);

//   // // The bounds method seems to make the rectangle less distorted
//   // // const latOffset = (gridStart[1] - gridEnd[1]) / detailLevel;
//   // // const lngOffset = (gridEnd[0] - gridStart[0]) / detailLevel;

//   let gridCells = [];
//   let cellStart = gridStart;
//   for (let i = 0; i < detailLevel; i++) {
//     for (let j = 0; j < detailLevel; j++) {
//       //create rectangle polygon.
//       const cell = makeCell();
//       gridCells.push(cell);
//       cellStart = incrementLongitude();
//     }
//     cellStart = resetLongitudeDecrementLatitude();
//   }

//   let grid = {
//     start: gridStart,
//     lngOffset: lngOffset,
//     latOffset: latOffset,
//     detailLevel: detailLevel,
//     cells: gridCells
//   };
//   return grid;

//   function incrementLongitude() {
//     return [cellStart[0] + lngOffset, cellStart[1]];
//   }

//   function resetLongitudeDecrementLatitude() {
//     return [cellStart[0] - lngOffset * detailLevel, cellStart[1] - latOffset];
//   }

//   function makeCell() {
//     let topLeft = [cellStart[0], cellStart[1]];
//     let topRight = [cellStart[0] + lngOffset, cellStart[1]];
//     let bottomRight = [cellStart[0] + lngOffset, cellStart[1] - latOffset];
//     let bottomLeft = [cellStart[0], cellStart[1] - latOffset];
//     let cell = [topLeft, topRight, bottomRight, bottomLeft];
//     cell = {
//       coordinates: cell,
//       abundance: 0,
//       richness: 0,
//       cellSpecies: {},
//       cellSites: [],
//       hasSamples: false
//     };
//     return cell;
//   }
// }

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
      // console.log(cell.coordinates, " cellcount: ", cell.sites.length)
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
