import React, { useState, useRef, useEffect, useMemo } from 'react'
import { first, join, keys, map, find } from 'lodash'
import { Nav, NavItem, NavLink, TabContent, TabPane, UncontrolledTooltip, Alert } from 'reactstrap'

import * as L from 'leaflet'
import * as MiniMap from 'leaflet-minimap'
import 'leaflet.fullscreen'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  LayersControl,
  GeoJSON,
  FeatureGroup,
  Rectangle,
  ScaleControl,
  useMap,
} from 'react-leaflet'
import PrintControlDefault from 'react-leaflet-easyprint'
import { EditControl } from 'react-leaflet-draw'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import HeatmapLayer from 'react-leaflet-heatmap-layer'

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

import {
  aggregateSampleOtusBySite,
  aggregateSamplesByCell,
  aggregateSamplePointsBySite,
  calculateMaxes,
} from 'aggregation'

import 'leaflet-minimap/dist/Control.MiniMap.min.css'
import 'react-leaflet-fullscreen/dist/styles.css'
import 'react-leaflet-markercluster/dist/styles.min.css'
import 'leaflet-draw/dist/leaflet.draw.css'

const MapInitialViewport = { lat: -25.27, lng: 133.775, zoom: 4 }

const ArcGIS = {
  url: '//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    '&copy; i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
}

const tileLayer = {
  url: '//cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  subdomains: 'abcd',
  maxZoom: 17,
  minZoom: 10.75,
}

// --- Popup Components ---
const BPAImages = ({ siteImages }) => {
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
      {map(siteImages || [], ({ package_id, resource_id }, index) => (
        <div key={index} className="bpaotu-map-popup-inner__images">
          <a href={rsUrl(package_id, resource_id)} target="_other">
            <img alt="Australian Microbiome" src={tnUrl(package_id, resource_id)} />
          </a>
        </div>
      ))}
    </div>
  )
}

const BPASamples = ({ bpadata }) => {
  const [activeTab, setActiveTab] = useState(first(keys(bpadata)))

  return (
    <div className="bpaotu-samples">
      <div className="bpaotu-samples__tabs">
        <Nav tabs className="flex-nowrap">
          {map(bpadata, (_data, index) => (
            <NavItem key={index}>
              <NavLink
                className={index === activeTab ? 'active' : ''}
                onClick={() => setActiveTab(index)}
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

const MarkerPopup = ({ marker }) => {
  const [activeTab, setActiveTab] = useState('1')
  if (!marker.site_images || marker.site_images.length === 0)
    return <BPASamples bpadata={marker.bpadata} />

  return (
    <>
      <Nav tabs>
        <NavItem>
          <NavLink className={activeTab === '1' ? 'active' : ''} onClick={() => setActiveTab('1')}>
            Samples
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={activeTab === '2' ? 'active' : ''} onClick={() => setActiveTab('2')}>
            Images
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent activeTab={activeTab} className="bpaotu-map-popup-inner__tab-content">
        <TabPane tabId="1" className="bpaotu-map-popup-inner__sample-pane">
          <BPASamples bpadata={marker.bpadata} />
        </TabPane>
        <TabPane tabId="2" className="bpaotu-map-popup-inner__image-pane">
          <BPAImages siteImages={marker.site_images} />
        </TabPane>
      </TabContent>
    </>
  )
}

const FullscreenControlWrapper = () => {
  const map = useMap()
  React.useEffect(() => {
    const control = new L.Control.Fullscreen({ position: 'topright' })
    map.addControl(control)
    return () => {
      map.removeControl(control)
    }
  }, [map])
  return null
}

// --- Main Map ---
const SamplesMap = (props) => {
  const [viewport, setViewport] = useState(MapInitialViewport)
  const [gridcellSize, setGridcellSize] = useState(2)
  const [isLoading, setIsLoading] = useState(false)

  const leafletMapRef = useRef(null)
  const drawFeatureGroupRef = useRef(null)
  const [samplePoints, setSamplePoints] = useState<any>(null)
  const [featureCollectionData, setFeatureCollectionData] = useState<any>(null)
  const [siteAggregatedData, setSiteAggregatedData] = useState<any>(null)

  // --- Memoized Aggregations ---
  useEffect(() => {
    if (props.sample_otus.length > 0) {
      const siteData = aggregateSampleOtusBySite(props.sample_otus)
      setSiteAggregatedData(siteData)
      setSamplePoints(aggregateSamplePointsBySite(siteData))
    } else {
      setSamplePoints(null)
      setFeatureCollectionData(null)
      setSiteAggregatedData(null)
    }
  }, [props.sample_otus])

  useEffect(() => {
    if (samplePoints && siteAggregatedData) {
      const cellAggs = aggregateSamplesByCell(siteAggregatedData, gridcellSize)
      setFeatureCollectionData(makeFeatureCollection(cellAggs))
    }
  }, [samplePoints, siteAggregatedData, gridcellSize])

  // --- MiniMap setup ---
  useEffect(() => {
    if (leafletMapRef.current) {
      const mapObj = leafletMapRef.current
      const layer = new L.TileLayer(ArcGIS.url, {
        minZoom: 0,
        maxZoom: 13,
        attribution: ArcGIS.attribution,
      })
      new MiniMap(layer, { toggleDisplay: true }).addTo(mapObj)
    }
    props.fetchSamples()
  }, [])

  // --- Feature Collection Generator ---
  const makeFeatureCollection = (cellAggs) => {
    const maxes = calculateMaxes(cellAggs)
    return {
      type: 'FeatureCollection',
      features: Object.keys(cellAggs).map((key) => {
        const cell = cellAggs[key]
        const stdRichness = cell.richness / cell.sites.length
        const stdAbundance = cell.abundance / cell.sites.length
        const weightedRichness = stdRichness / maxes.richness
        const weightedAbundance = stdAbundance / maxes.abundance
        const weightedSites = cell.sites.length / maxes.sites
        return {
          type: 'Feature',
          properties: {
            id: key,
            weightedAbundance,
            weightedRichness,
            weightedSites,
            maxRichness: maxes.richness,
            maxAbundance: maxes.abundance,
            stdCellRichness: stdRichness,
            stdCellAbundance: stdAbundance,
            maxSites: maxes.sites,
            richness: cell.richness,
            abundance: cell.abundance,
            sites: cell.sites,
            otus: cell.otus,
            coordinates: cell.coordinates,
          },
          geometry: { type: 'Polygon', coordinates: [cell.coordinates] },
        }
      }),
    }
  }

  // --- Grid Layer Styling ---
  const layerStyle = (feature, property) => ({
    fillColor: GridCellConstants.fillColor(feature.properties[property]),
    weight: 1,
    opacity: GridCellConstants.outlineOpacity,
    color: GridCellConstants.outlineColor,
    fillOpacity: GridCellConstants.fillOpacity(feature.properties[property]),
  })

  // --- Draw/Rectangle Handlers ---
  const initDrawElement = () => {
    if (!drawFeatureGroupRef.current) return []
    const drawElement = drawFeatureGroupRef.current
    const drawnItems = drawElement._layers
    if (Object.keys(drawnItems).length > 1) {
      Object.keys(drawnItems).forEach(
        (layerid, index) => index > 0 && drawElement.removeLayer(drawnItems[layerid])
      )
    }
    const lat = find(props.filters.contextual.filters, (f) => f.name === 'latitude')
    const lng = find(props.filters.contextual.filters, (f) => f.name === 'longitude')
    if (lat && lng)
      return [
        [lat.value, lng.value],
        [lat.value2, lng.value2],
      ]
    return []
  }

  const createDrawElement = (layer) => {
    let latMin, latMax, lngMin, lngMax
    for (const row of layer._latlngs) {
      for (const point of Object.values(row) as L.LatLng[]) {
        latMin = latMin < point.lat ? latMin : point.lat
        latMax = latMax > point.lat ? latMax : point.lat
        lngMin = lngMin < point.lng ? lngMin : point.lng
        lngMax = lngMax > point.lng ? lngMax : point.lng
      }
    }
    const latIndex = props.filters.contextual.filters.findIndex((f) => f.name === 'latitude')
    const lngIndex = props.filters.contextual.filters.findIndex((f) => f.name === 'longitude')
    props.selectContextualFilter(latIndex, 'latitude')
    props.changeContextualFilterValue(latIndex, latMin)
    props.changeContextualFilterValue2(latIndex, latMax)
    props.selectContextualFilter(lngIndex, 'longitude')
    props.changeContextualFilterValue(lngIndex, lngMin)
    props.changeContextualFilterValue2(lngIndex, lngMax)
  }

  // --- JSX ---
  // const position: [number, number] = [viewport.lat, viewport.lng]
  const position: L.LatLngExpression = [viewport.lat, viewport.lng]

  const rectangleBounds = initDrawElement()
  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    background: 'rgba(0,0,0,0.5)',
    zIndex: 99999,
  }

  return (
    <div style={{ height: '100%' }}>
      <MapContainer
        center={position}
        zoom={viewport.zoom}
        minZoom={2}
        style={{ height: '100%' }}
        ref={leafletMapRef}
      >
        <FullscreenControlWrapper />
        <PrintControlDefault
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
        <FeatureGroup ref={drawFeatureGroupRef}>
          <EditControl
            position="topright"
            onCreated={(e) => {
              if (e.layerType === 'rectangle') createDrawElement(e.layer)
            }}
            edit={{ edit: false }}
            draw={{
              marker: false,
              circlemarker: false,
              circle: false,
              polygon: false,
              polyline: false,
            }}
          />
          {rectangleBounds.length > 0 && <Rectangle bounds={rectangleBounds} />}
        </FeatureGroup>

        <LayersControl>
          <LayersControl.BaseLayer name="Base">
            <TileLayer url={ArcGIS.url} attribution={ArcGIS.attribution} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OSM" checked>
            <TileLayer url={tileLayer.url} attribution={tileLayer.attribution} />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay name="Sites" checked>
            <MarkerClusterGroup>
              {props.markers.map((marker, i) => (
                <Marker key={`marker-${i}`} position={marker}>
                  <Popup minWidth={640} maxHeight={480}>
                    <MarkerPopup marker={marker} />
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </LayersControl.Overlay>

          {samplePoints && (
            <>
              <LayersControl.Overlay name="Heatmap: Abundance" checked>
                <HeatmapLayer
                  fitBoundsOnLoad
                  fitBoundsOnUpdate
                  points={samplePoints}
                  longitudeExtractor={(m) => m[1]}
                  latitudeExtractor={(m) => m[0]}
                  intensityExtractor={(m) => m[2]}
                  radius={30}
                  gradient={{ 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }}
                />
              </LayersControl.Overlay>
              {featureCollectionData && (
                <>
                  <LayersControl.Overlay name="Gridcell: Abundance">
                    <GeoJSON
                      data={featureCollectionData}
                      style={(f) => layerStyle(f, 'weightedAbundance')}
                    />
                  </LayersControl.Overlay>
                  <LayersControl.Overlay name="Gridcell: Richness">
                    <GeoJSON
                      data={featureCollectionData}
                      style={(f) => layerStyle(f, 'weightedRichness')}
                    />
                  </LayersControl.Overlay>
                  <LayersControl.Overlay name="Gridcell: Site Count" checked>
                    <GeoJSON
                      data={featureCollectionData}
                      style={(f) => layerStyle(f, 'weightedSites')}
                    />
                  </LayersControl.Overlay>
                </>
              )}
            </>
          )}
        </LayersControl>
      </MapContainer>
    </div>
  )
}

const mapStateToProps = (state) => ({
  filters: state.searchPage.filters,
  dataDefinitions: state.contextualDataDefinitions.filters,
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      selectContextualFilter,
      removeContextualFilter,
      changeContextualFilterOperator,
      changeContextualFilterValue,
      changeContextualFilterValue2,
    },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)(SamplesMap)
