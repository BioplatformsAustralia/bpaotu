import React, { useState } from 'react'
import { first, join, keys, map, find } from 'lodash'
import { Nav, NavItem, NavLink, TabContent, TabPane, UncontrolledTooltip, Alert } from 'reactstrap'

import * as L from 'leaflet'
import * as MiniMap from 'leaflet-minimap'
import {
  Map,
  Marker,
  Popup,
  TileLayer,
  LayersControl,
  GeoJSON,
  FeatureGroup,
  Rectangle,
  withLeaflet,
  ScaleControl,
} from 'react-leaflet'
import PrintControlDefault from 'react-leaflet-easyprint'
import { EditControl } from 'react-leaflet-draw'
import HeatMapLegendControl from 'pages/search_page/components/heatmap_legend'
import GridCellLegendControl, {
  GridCellConstants,
} from 'pages/search_page/components/gridcell_legend'
import LatLngCoordinatesControl from 'pages/search_page/components/coordinates_control'
import GridCellSizer from 'pages/search_page/components/gridcell_sizer'
import Octicon from 'components/octicon'
import AnimateHelix from 'components/animate_helix'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  removeContextualFilter,
  changeContextualFilterOperator,
  changeContextualFilterValue,
  changeContextualFilterValue2,
  selectContextualFilter,
} from 'pages/search_page/reducers/contextual'

import FullscreenControl from 'react-leaflet-fullscreen'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import HeatmapLayer from 'react-leaflet-heatmap-layer'
import { strongLine, strongHeader } from 'utils'
import {
  aggregateSampleOtusBySite,
  aggregateSamplesByCell,
  aggregateSamplePointsBySite,
  calculateMaxes,
} from 'aggregation'

/*
Unfortunately, react-leaflet fails to load markers if the css isn't included in the html file, so
this import doesn't work. Leaving it in as a reminder.
Reference: https://github.com/PaulLeCam/react-leaflet/issues/453
*/
// import 'leaflet/dist/leaflet.css';

import 'leaflet-minimap/dist/Control.MiniMap.min.css'
import 'react-leaflet-fullscreen/dist/styles.css'
import 'react-leaflet-markercluster/dist/styles.min.css'
import 'leaflet-draw/dist/leaflet.draw.css'

import _ from 'lodash'
import numeric from 'numeric'
import Jaccard from 'jaccard-index'
const jaccard = Jaccard()

// Initial Viewport is Australia
const MapInitialViewport = {
  lat: -25.27,
  lng: 133.775,
  zoom: 4,
}

const ArcGIS = {
  url: '//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    '&copy; i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
}

//generating the map
const tileLayer = {
  url: '//cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  subdomains: 'abcd',
  maxZoom: 17,
  minZoom: 10.75,
}

// tslint:disable-next-line:max-classes-per-file
const BPAImages = (props) => {
  const tnUrl = (packageId, resourceId) =>
    join(
      [window.otu_search_config.base_url, 'private/site-image-thumbnail', packageId, resourceId],
      '/'
    )
  const rsUrl = (packageId, resourceId) =>
    join(
      [window.otu_search_config.ckan_base_url, 'dataset', packageId, 'resource', resourceId],
      '/'
    )

  return (
    <div>
      {map(this.props.siteImages || [], ({ package_id, resource_id }, index) => (
        <div key={index} className="bpaotu-map-popup-inner__images">
          <a href={rsUrl(package_id, resource_id)} target="_other">
            <img alt="Australian Microbiome" src={tnUrl(package_id, resource_id)} />
          </a>
        </div>
      ))}
    </div>
  )
}

// tslint:disable-next-line:max-classes-per-file
const BPASamples = (props) => {
  const { bpadata } = props
  const [activeTab, setActiveTab] = useState(first(keys(bpadata)))

  const toggle = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab)
    }
  }

  return (
    <div className="bpaotu-samples">
      <div className="bpaotu-samples__tabs">
        <Nav tabs={true} className="flex-nowrap">
          {map(bpadata, (data, index) => (
            <NavItem key={index}>
              <NavLink
                className={index === activeTab ? 'active' : ''}
                onClick={() => {
                  toggle(index)
                }}
              >
                Sample {index}
              </NavLink>
            </NavItem>
          ))}
        </Nav>
      </div>

      <TabContent activeTab={activeTab} className="bpaotu-samples__tab-content">
        {map(bpadata, (data, index) => (
          <TabPane key={index} tabId={index}>
            <table>
              <tbody>
                {map(data, (d, k) => (
                  <tr key={k}>
                    <th>{k}:</th>
                    <td>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabPane>
        ))}
      </TabContent>
    </div>
  )
}

const MarkerPopup = (props) => {
  const [activeTab, setActiveTab] = useState('1')

  if (!props.marker.site_images || props.marker.site_images.length === 0) {
    return <BPASamples bpadata={props.marker.bpadata} />
  }

  const toggle = (tab) => {
    if (activeTab !== tab) setActiveTab(tab)
  }

  return (
    <>
      <Nav tabs>
        <NavItem>
          <NavLink
            className={activeTab === '1' ? 'active' : ''}
            onClick={() => {
              toggle('1')
            }}
          >
            Samples
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === '2' ? 'active' : ''}
            onClick={() => {
              toggle('2')
            }}
          >
            Images
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent activeTab={activeTab} className="bpaotu-map-popup-inner__tab-content">
        <TabPane tabId="1" className="bpaotu-map-popup-inner__sample-pane">
          <BPASamples bpadata={props.marker.bpadata} />
        </TabPane>
        <TabPane tabId="2" className="bpaotu-map-popup-inner__image-pane">
          <BPAImages siteImages={props.marker.site_images} />
        </TabPane>
      </TabContent>
    </>
  )
}

// tslint:disable-next-line:max-classes-per-file
class SamplesMap extends React.Component<any> {
  public leafletMap
  public drawFeatureGroupRef
  public featureCollectionData
  public samplePoints
  public siteAggregatedData
  readonly lat_filter = 'latitude'
  readonly lng_filter = 'longitude'
  readonly default_gridcellSize = 2

  public state = {
    ...MapInitialViewport,
    gridcellSize: this.default_gridcellSize,
    isLoading: false,
  }

  public setGridcellSize(cellSize) {
    this.setState({
      isLoading: true,
    })
    setTimeout(() => {
      this.setState({
        gridcellSize: cellSize,
        isLoading: false,
      })
    }, 1)
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.sample_otus.length > 0 && this.props.sample_otus !== nextProps.sample_otus) {
      this.samplePoints = null
      this.featureCollectionData = null
      return true
    }
    if (this.state.gridcellSize !== nextState.gridcellSize) {
      this.featureCollectionData = null
      return true
    }
    if (this.state.isLoading !== nextState.isLoading) {
      return true
    }
    if (this.props.markers !== nextProps.markers) {
      return true
    }
    return false
  }

  public findFilterIndex = (data, name) => {
    let index = 0
    for (var i = 0; i < data.length; i++) {
      index = data[i].name === name ? i : data.length
    }
    return index
  }

  public findFilterValueIndex = (data, name, value, value2) => {
    let index = -1
    for (var i = 0; i < data.length; i++) {
      if (data[i].name === name && data[i].value === value && data[i].value2 === value2) {
        return i
      }
    }
    return index
  }

  handleZoomstart = (map, maxZoom, defaultZoom, position) => {
    const currentZoom = this.leafletMap ? this.leafletMap.leafletElement.getZoom() : 4
    const v = 1 / Math.pow(2, Math.max(0, Math.min(maxZoom - currentZoom, 12)))
    return { maxZoom, currentZoom, defaultZoom, v, intensity: v * 1000, position }
  }

  initDrawElement = () => {
    if (this.drawFeatureGroupRef) {
      const drawElement = this.drawFeatureGroupRef.leafletElement
      const drawnItems = drawElement._layers
      if (Object.keys(drawnItems).length > 1) {
        Object.keys(drawnItems).forEach((layerid, index) => {
          if (index > 0) return
          const layer = drawnItems[layerid]
          drawElement.removeLayer(layer)
        })
      }
    }

    // Add rectangle for selected latitude/longitude filter
    var rectangle: [number, number][] = []
    const lat = find(
      this.props.filters.contextual.filters,
      (latlng) => latlng.name === this.lat_filter
    )
    const lng = find(
      this.props.filters.contextual.filters,
      (latlng) => latlng.name === this.lng_filter
    )
    if (lat && lng) {
      rectangle = [
        [lat.value, lng.value],
        [lat.value2, lng.value2],
      ]
    }
    return rectangle
  }

  deleteDrawElement = (drawElement) => {
    const drawnItems = drawElement._layers
    Object.keys(drawnItems).forEach((layerid, index) => {
      if (index > 0) return
      const layer = drawnItems[layerid]
      drawElement.removeLayer(layer)
      let lat_value, lat_value2, lng_value, lng_value2
      let points = layer._latlngs
      for (let index in points) {
        for (let point of Object.values(points[index])) {
          lat_value = lat_value < point['lat'] ? lat_value : point['lat']
          lat_value2 = lat_value2 > point['lat'] ? lat_value2 : point['lat']
          lng_value = lng_value < point['lng'] ? lng_value : point['lng']
          lng_value2 = lng_value2 > point['lng'] ? lng_value2 : point['lng']
        }
      }

      const index_lat = this.findFilterValueIndex(
        this.props.filters.contextual.filters,
        this.lat_filter,
        lat_value,
        lat_value2
      )
      this.props.removeContextualFilter(index_lat)
      const index_lng = this.findFilterValueIndex(
        this.props.filters.contextual.filters,
        this.lng_filter,
        lng_value,
        lng_value2
      )
      this.props.removeContextualFilter(index_lng)
    })
  }

  createDrawElement = (layer) => {
    let lat_value, lat_value2, lng_value, lng_value2
    let points = layer._latlngs
    for (let index in points) {
      for (let point of Object.values(points[index])) {
        lat_value = lat_value < point['lat'] ? lat_value : point['lat']
        lat_value2 = lat_value2 > point['lat'] ? lat_value2 : point['lat']
        lng_value = lng_value < point['lng'] ? lng_value : point['lng']
        lng_value2 = lng_value2 > point['lng'] ? lng_value2 : point['lng']
      }
    }

    const lat_index = this.findFilterIndex(this.props.filters.contextual.filters, this.lat_filter)
    this.props.selectContextualFilter(lat_index, this.lat_filter)
    this.props.changeContextualFilterOperator(lat_index, '')
    this.props.changeContextualFilterValue(lat_index, lat_value)
    this.props.changeContextualFilterValue2(lat_index, lat_value2)

    const lng_index = this.findFilterIndex(this.props.filters.contextual.filters, this.lng_filter)
    this.props.selectContextualFilter(lng_index, this.lng_filter)
    this.props.changeContextualFilterOperator(lng_index, '')
    this.props.changeContextualFilterValue(lng_index, lng_value)
    this.props.changeContextualFilterValue2(lng_index, lng_value2)
  }

  public render() {
    if (this.props.sample_otus.length > 0 && !this.samplePoints) {
      this.siteAggregatedData = aggregateSampleOtusBySite(this.props.sample_otus)
      this.samplePoints = aggregateSamplePointsBySite(this.siteAggregatedData)
    }
    if (this.samplePoints && !this.featureCollectionData) {
      let cellAggregatedData = aggregateSamplesByCell(
        this.siteAggregatedData,
        this.state.gridcellSize
      )
      this.featureCollectionData = this.makeFeatureCollection(cellAggregatedData)
    }
    console.log('this.props', this.props)

    const PrintControl: any = withLeaflet(PrintControlDefault)
    const loadingstyle = {
      display: 'flex',
      height: '100%',
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      background: 'rgba(0,0,0,0.5)',
      zIndex: 99999,
    } as React.CSSProperties
    const position: [number, number] = [this.state.lat, this.state.lng]
    let heatMapLayer,
      abundanceLayer,
      richnessLayer,
      siteCountLayer,
      selectedRectangleBounds,
      loadingSpinner,
      mapControls
    if (this.props.isLoading || this.state.isLoading) {
      loadingSpinner = (
        <div style={loadingstyle}>
          <AnimateHelix />
        </div>
      )
    } else {
      if (this.samplePoints) {
        heatMapLayer = (
          <LayersControl.Overlay name="Heatmap: Abundance" checked>
            <HeatmapLayer
              fitBoundsOnLoad
              fitBoundsOnUpdate
              points={this.samplePoints}
              longitudeExtractor={(m) => m[1]}
              latitudeExtractor={(m) => m[0]}
              intensityExtractor={(m) => m[2]}
              // max={3}
              radius={30}
              // maxZoom={18}
              gradient={{
                0.4: 'blue',
                0.6: 'cyan',
                0.7: 'lime',
                0.8: 'yellow',
                1.0: 'red',
              }}
            />
          </LayersControl.Overlay>
        )
        abundanceLayer = (
          <LayersControl.Overlay name="Gridcell: Abundance">
            <GeoJSON
              data={this.featureCollectionData}
              style={(feature: any) => this.layerStyle(feature, 'weightedAbundance')}
              onEachFeature={(feature: any, layer: any) => this.onEachFeature(feature, layer)}
            />
          </LayersControl.Overlay>
        )
        richnessLayer = (
          <LayersControl.Overlay name="Gridcell: Richness">
            <GeoJSON
              data={this.featureCollectionData}
              style={(feature: any) => this.layerStyle(feature, 'weightedRichness')}
              onEachFeature={(feature: any, layer: any) => this.onEachFeature(feature, layer)}
            />
          </LayersControl.Overlay>
        )
        siteCountLayer = (
          <LayersControl.Overlay name="Gridcell: Site Count" checked>
            <GeoJSON
              data={this.featureCollectionData}
              style={(feature: any) => this.layerStyle(feature, 'weightedSites')}
              onEachFeature={(feature: any, layer: any) => this.onEachFeature(feature, layer)}
            />
          </LayersControl.Overlay>
        )
        mapControls = (
          <>
            <GridCellSizer
              gridcellSize={this.state.gridcellSize}
              setGridcellSize={(val) => this.setGridcellSize(val)}
            />
            <GridCellLegendControl />
            <HeatMapLegendControl />
            <LatLngCoordinatesControl />
            <ScaleControl position="bottomleft" />
          </>
        )
      }
      loadingSpinner = <></>
    }

    const rectangle = this.initDrawElement()
    if (rectangle.length > 0) {
      selectedRectangleBounds = <Rectangle bounds={rectangle} />
    }

    return (
      <div style={{ height: '100%' }}>
        <div className="text-center" style={{ margin: '-12px 0px' }}>
          {this.props.isLoading || this.state.isLoading ? (
            <Alert color="info">
              Processing...
              {this.state.isLoading &&
                ` Gridcell calculation may take a while depending on the number of sample locations. `}
              {` Please wait. Once completed, map will automatically refresh.`}
            </Alert>
          ) : (
            <Alert color="success">
              Showing {this.props.sample_otus.length} samples in {this.props.markers.length} sample
              locations{' '}
              <span id="tipShowSample">
                <Octicon name="info" />
              </span>
              <UncontrolledTooltip target="tipShowSample" placement="auto">
                {
                  'Results displayed in map view are based on samples being randomly sub-sampled to 20K reads. Selecting samples in map view will retrieve full OTU tables (non-subsampled data) and may also include additional samples containing less than 20K reads.'
                }
              </UncontrolledTooltip>
            </Alert>
          )}
        </div>
        <Map
          center={position}
          zoom={this.state.zoom}
          ref={(m) => {
            this.leafletMap = m
          }}
          minZoom={2}
          // maxBounds={[[90, 180], [-90, -180]]}
          onclick={this.handleClick}
        >
          <FullscreenControl position="topright" />
          <PrintControl
            position="topright"
            sizeModes={['Current', 'A4Portrait', 'A4Landscape']}
            defaultSizeTitles={{
              Current: 'Current Size',
              A4Landscape: 'A4 Landscape',
              A4Portrait: 'A4 Portrait',
            }}
            hideControlContainer={false}
            title="Export as PNG"
            exportOnly
          />
          <FeatureGroup
            ref={(drawFeatureGroupRef) => {
              this.drawFeatureGroupRef = drawFeatureGroupRef
            }}
          >
            <EditControl
              position="topright"
              onDeleted={(e) => {
                this.setGridcellSize(this.default_gridcellSize)
                this.deleteDrawElement(e.layers)
                this.props.fetchSamples()
              }}
              onCreated={(e) => {
                const layer = e.layer
                if (e.layerType === 'rectangle') {
                  // Delete existing rectangle and keep the newly drawn rectangle
                  const drawElement = this.drawFeatureGroupRef.leafletElement
                  if (Object.keys(drawElement._layers).length > 1) {
                    this.deleteDrawElement(drawElement)
                  }
                  this.createDrawElement(layer)
                  this.props.fetchSamples()
                }
              }}
              edit={{
                edit: false,
              }}
              draw={{
                marker: false,
                circlemarker: false,
                circle: false,
                polygon: false,
                polyline: false,
              }}
            />
            {selectedRectangleBounds}
          </FeatureGroup>
          <LayersControl>
            <LayersControl.BaseLayer name="Base" checked>
              <TileLayer url={ArcGIS.url} attribution={ArcGIS.attribution} />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="OSM">
              <TileLayer url={tileLayer.url} attribution={tileLayer.attribution} />
            </LayersControl.BaseLayer>
            <LayersControl.Overlay name="Sites" checked>
              <MarkerClusterGroup>
                {this.props.markers.map((marker, index) => (
                  <Marker key={`marker-${index}`} position={marker}>
                    <Popup minWidth={640} maxHeight={480} className="bpaotu-map-popup">
                      <div className="bpaotu-map-popup-inner">
                        <MarkerPopup marker={marker} />
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </LayersControl.Overlay>
            {heatMapLayer}
            {siteCountLayer}
            {abundanceLayer}
            {richnessLayer}
          </LayersControl>
          {loadingSpinner}
          {mapControls}
        </Map>
        <div
          onClick={() => {
            console.log('samplePoints', this.samplePoints)
            console.log('siteAggregatedData', this.siteAggregatedData)
            console.log('markers', this.props.markers)
            console.log('abundance_matrix', this.props.abundance_matrix)
          }}
        >
          Debug click
        </div>
        <div
          onClick={() => {
            // const sparseMatrix = this.getSparseMatrix(
            //   this.props.abundance_matrix.matrix,
            //   this.props.abundance_matrix.otu_ids
            // )
            // console.log('sparseMatrix', sparseMatrix)

            const processedData = this.getJaccardDistanceMatrix(
              this.props.abundance_matrix.matrix,
              this.props.abundance_matrix.sample_ids
            )
            console.log('processedData', processedData)

            const mds = this.classicMDS(processedData.matrix, 2)
            console.log('mds', mds)

            const positions = numeric.transpose(mds)
            console.log('positions', positions)

            const plotData = processedData.samples.map((s, i) => {
              return { Sample: s, x: positions[0][i], y: positions[1][i] }
            })
            console.log('plotData', plotData)
          }}
        >
          Abundance to Jaccard click
        </div>
      </div>
    )
  }

  getSparseMatrix = (matrix, indices) => {
    return matrix

    // const data = matrix
    // // const indices = indices // f.get('observation/matrix/indices').to_array()
    // const indptr = f.get('observation/matrix/indptr').to_array()

    // let indptrIdx = 0
    // let numRows = indptr[indptrIdx + 1] - indptr[indptrIdx]
    // const sparseMatrix = data.map((d, idx) => {
    //   let res = [indptrIdx, indices[idx], d]
    //   numRows--
    //   if (numRows === 0) {
    //     indptrIdx++
    //     numRows = indptr[indptrIdx + 1] - indptr[indptrIdx]
    //   }
    //   return res
    // })
    // const idx = Number(sampleIndex)
    // return !isNaN(idx) ? sparseMatrix.filter((row) => row[1] === idx) : sparseMatrix
  }

  // sparseToJaccardMatrix = (data) => {
  //   const sampleIdsCol = data.map((d) => d[1])
  //   const sampleIds = sampleIdsCol.sort().filter((el, i, a) => i === a.indexOf(el))

  //   const maxSampleIndex = sampleIds.length - 1
  //   const matrix = new Array(maxSampleIndex + 1).fill(0).map(() => [])

  //   data.forEach((elm, idx) => {
  //     const [taxonIdx, sampleId, abundance] = elm
  //     const sampleIdx = sampleIds.indexOf(sampleId)
  //     matrix[sampleIdx].push(taxonIdx)
  //     // denseData[sampleIdx][taxonIdx] = abundance;
  //   })

  //   return matrix
  // }

  sparseToJaccardMatrix = (data) => {
    const maxSampleIndex: number = _.max(data.map((d) => d[1]))
    const matrix = new Array(maxSampleIndex + 1).fill(0).map(() => [])
    data.forEach((elm, idx) => {
      const [taxonIdx, sampleIdx, abundance] = elm
      matrix[sampleIdx].push(taxonIdx)
      // denseData[sampleIdx][taxonIdx] = abundance;
    })
    return matrix
  }

  getJaccardDistanceMatrix = (sparseMatrix, samples) => {
    console.log('getJaccardDistanceMatrix')
    // let samples = Object.keys(data)

    // create a dataframe
    const data = this.sparseToJaccardMatrix(sparseMatrix)
    const matrix = [...data.map(() => new Array(data.length))]

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

  /// given a matrix of distances between some points, returns the
  /// point coordinates that best approximate the distances using
  /// classic multidimensional scaling
  classicMDS = (distances, dimensions) => {
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

  public componentDidMount() {
    this.setUpMiniMap()
    this.props.fetchSamples()
  }

  public setUpMiniMap = () => {
    // There is no port of the MiniMap plugin to React so we use the JS plugin directly and wire it up manually using a `ref` to the L.Map object
    const layer = new L.TileLayer(ArcGIS.url, {
      minZoom: 0,
      maxZoom: 13,
      attribution: ArcGIS.attribution,
    })
    new MiniMap(layer, { toggleDisplay: true }).addTo(this.leafletMap.leafletElement)
  }

  public handleClick = (e) => {
    // const { lat, lng } = e.latlng;
    // const maxZoom = e.sourceTarget._layersMaxZoom
    // const minZoom = e.sourceTarget._layersMinZoom
  }

  public onEachFeature(feature, layer) {
    // setting popup size constraint.
    layer.bindPopup('Loading...', {
      // layer.bindPopup(feature.properties.popupContent, {
      maxWidth: 800,
      maxHeight: 360,
    })
    layer.on({
      click: this.handleGridLayerClick,
    })
  }

  /**
   * Function called when layer is selected.
   * @param {*} e
   */
  public handleGridLayerClick = (e) => {
    var layer = e.target
    let popup = layer.getPopup()
    let popupContent =
      strongHeader('Sites per grid cell', layer.feature.properties.sites.length) +
      strongHeader('Richness per grid cell', layer.feature.properties.richness) +
      strongHeader('Abundance per grid cell', layer.feature.properties.abundance) +
      '<br />' +
      strongHeader(
        "Std Richness per grid cell <span style='fontSize:16px' title='Std Richness per grid cell = Richness per grid cell / Sites per grid cell'>&#9432;</span>",
        layer.feature.properties.stdCellRichness
      ) +
      strongHeader(
        "Std Abundance per grid cell <span style='fontSize:16px' title='Std Abundance per grid cell = Abundance per grid cell / Sites per grid cell'>&#9432;</span>",
        layer.feature.properties.stdCellAbundance
      ) +
      '<br />' +
      strongHeader('Max Sites per grid cell', layer.feature.properties.maxSites) +
      strongHeader('Max Std Richness per grid cell', layer.feature.properties.maxRichness) +
      strongHeader('Max Std Abundance per grid cell', layer.feature.properties.maxAbundance) +
      '<br />' +
      strongHeader(
        "Wtd Sites per grid cell <span style='fontSize:16px' title='Wtd Sites per grid cell = Sites per grid cell / Max Sites per grid cell'>&#9432;</span>",
        layer.feature.properties.weightedSites
      ) +
      strongHeader(
        "Wtd Richness per grid cell <span style='fontSize:16px' title='Wtd Richness per grid cell = Std Richness per grid cell / Max Std Richness per grid cell'>&#9432;</span>",
        layer.feature.properties.weightedRichness
      ) +
      strongHeader(
        "Wtd Abundance per grid cell <span style='fontSize:16px' title='Wtd Abundance per grid cell = Std Abundance per grid cell / Max Std Abundance per grid cell'>&#9432;</span>",
        layer.feature.properties.weightedAbundance
      ) +
      '<br />' +
      strongHeader(
        'Longitude',
        layer.feature.properties.coordinates[0][0] +
          ' to ' +
          layer.feature.properties.coordinates[2][0]
      ) +
      strongHeader(
        'Latitude',
        layer.feature.properties.coordinates[0][1] +
          ' to ' +
          layer.feature.properties.coordinates[2][1]
      ) +
      '<br />'
    //list all sites within the cell.properties
    popupContent += strongLine('Sites in cell: ') + '<ul>'
    for (let i in layer.feature.properties.sites) {
      let siteId = layer.feature.properties.sites[i]
      popupContent += '<li>' + siteId + '</li>'
    }
    popupContent += '</ul><br />'
    popup.setContent(popupContent)
    // popup.bindPopup(popup);
  }

  public layerStyle = (feature, property) => {
    return {
      fillColor: GridCellConstants.fillColor(feature.properties[property]),
      weight: 1,
      opacity: GridCellConstants.outlineOpacity,
      color: GridCellConstants.outlineColor,
      fillOpacity: GridCellConstants.fillOpacity(feature.properties[property]),
    }
  }

  public makeFeatureCollection = (cellAggs: any) => {
    let maxes = calculateMaxes(cellAggs)
    let featureCollection: GeoJSON.FeatureCollection<any> = {
      type: 'FeatureCollection',
      features: [],
    }
    for (let key in cellAggs) {
      let cell = cellAggs[key]

      let stdCellRichness = cell.richness / cell.sites.length
      let stdCellAbundance = cell.abundance / cell.sites.length
      let countCellSites = cell.sites.length

      let weightedRichness = stdCellRichness / maxes.richness
      let weightedAbundance = stdCellAbundance / maxes.abundance
      let weightedSites = countCellSites / maxes.sites

      featureCollection.features.push({
        type: 'Feature',
        properties: {
          id: key,
          weightedAbundance,
          weightedRichness,
          weightedSites,
          maxRichness: maxes.richness,
          maxAbundance: maxes.abundance,
          stdCellRichness: stdCellRichness,
          stdCellAbundance: stdCellAbundance,
          maxSites: maxes.sites,
          richness: cell.richness,
          abundance: cell.abundance,
          sites: cell.sites,
          otus: cell.otus,
          coordinates: cell.coordinates,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [cell.coordinates],
        },
      })
    }
    return featureCollection
  }
}

const mapStateToProps = (state) => {
  return {
    filters: state.searchPage.filters,
    dataDefinitions: state.contextualDataDefinitions.filters,
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      selectContextualFilter,
      removeContextualFilter,
      changeContextualFilterOperator,
      changeContextualFilterValue,
      changeContextualFilterValue2,
    },
    dispatch
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(SamplesMap)
