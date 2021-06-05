import { first, join, keys, map, find } from 'lodash'
import * as React from 'react'
import { Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from 'reactstrap'

import * as L from 'leaflet'
import * as MiniMap from 'leaflet-minimap'
import { Map, Marker, Popup, TileLayer, LayersControl, GeoJSON, FeatureGroup, Rectangle  } from 'react-leaflet'
import { EditControl } from "react-leaflet-draw"
import HeatMapLegendControl from '../pages/search_page/components/heatmap_legend'
import GridCellLegendControl from '../pages/search_page/components/gridcell_legend'
// import LegendControl from '../pages/search_page/components/legend_control'
import { JellyfishSpinner } from "react-spinners-kit";

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fetchContextualDataForGraph } from '../reducers/contextual_data_graph'
import {
  addContextualFilter,
  removeContextualFilter,
  changeContextualFilterOperator,
  changeContextualFilterValue,
  changeContextualFilterValue2,
  changeContextualFilterValues,
  selectContextualFilter
} from '../pages/search_page/reducers/contextual'
import { search } from '../pages/search_page/reducers/search'

import FullscreenControl from 'react-leaflet-fullscreen'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import HeatmapLayer from 'react-leaflet-heatmap-layer'
// import SamplesGraph from './samples_graph'
// import { plotConfig } from '../plot'
// import * as d3 from "d3";
import { strongLine, strongHeader } from '../utils'
import {aggregateSampleOtusBySite, aggregateSamplesByCell, aggregateSamplePointsBySite, calculateMaxes} from "../aggregation"
// import {aggregateSampleContextBySite} from "../aggregation"
// import {aggregateSampleOtusBySite, aggregateSamplesByCell, aggregateSamplePointsBySite, calculateMaxes} from "../aggregation copy"
// import {responseData} from "../sampledata";

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

// Initial Viewport is Australia
const MapInitialViewport = {
  lat: -25.27,
  lng: 133.775,
  zoom: 4
}

const ArcGIS = {
  url: '//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    '&copy; i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}

//generating the map
const tileLayer = {
  url: '//cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
  attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: "abcd",
    maxZoom: 17,
    minZoom: 10.75
}

// tslint:disable-next-line:max-classes-per-file
class BPAImages extends React.Component<any, any> {
    public render() {
        const tnUrl = (packageId, resourceId) => join(
          [window.otu_search_config.base_url, 'private/site-image-thumbnail', packageId, resourceId], '/')
        const rsUrl = (packageId, resourceId) => join(
          [window.otu_search_config.ckan_base_url, 'dataset', packageId, 'resource', resourceId], '/')
        return (
            <div>
              {map(this.props.siteImages || [], ({package_id, resource_id}, index) => (
                <Row key={index}>
                  <a href={rsUrl(package_id, resource_id)} target="_other">
                    <img alt="Australian Microbiome" src={tnUrl(package_id, resource_id)} />
                  </a>
                </Row>
              ))}
            </div>
        )
    }
}


// tslint:disable-next-line:max-classes-per-file
class BPASamples extends React.Component<any, any> {
  constructor(props: any) {
    super(props)

    this.state = {
      bpadata: this.props.bpadata,
      activeTab: first(keys(this.props.bpadata))
    }

    this.toggle = this.toggle.bind(this)
  }

  public toggle(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab
      })
    }
  }

  public render() {
    return (
      <div>
        <Nav tabs={true}>
          {map(this.props.bpadata, (data, index) => (
            <NavItem key={index}>
              <NavLink
                className={index}
                onClick={() => {
                  this.toggle(index)
                }}
              >
                Sample {index}
              </NavLink>
            </NavItem>
          ))}
        </Nav>

        <TabContent activeTab={this.state.activeTab}>
          {map(this.props.bpadata, (data, index) => (
            <TabPane key={index} tabId={index}>
              <Row>
                <Col sm="12">
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
                </Col>
              </Row>
            </TabPane>
          ))}
        </TabContent>
      </div>
    )
  }
}

// tslint:disable-next-line:max-classes-per-file
class SamplesMap extends React.Component<any> {
  public leafletMap
  public drawFeatureGroupRef
  public featureCollectionData
  public samplePoints
  public siteAggregatedData
  readonly lat_filter="latitude"
  readonly lng_filter="longitude"

  public state = {
    ...MapInitialViewport,
  }

   shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.sample_otus.length > 0 && this.props.sample_otus !== nextProps.sample_otus) {
      this.siteAggregatedData = aggregateSampleOtusBySite(nextProps.sample_otus);
      this.samplePoints = aggregateSamplePointsBySite(this.siteAggregatedData);
      // console.log("samplepoints length: ", this.samplePoints.length)
      // console.log("samplepoints: ", this.samplePoints)
      // console.log("samplepoints: ", nextProps.sample_otus)
      let cellAggregatedData = aggregateSamplesByCell(this.siteAggregatedData);
      this.featureCollectionData = this.makeFeatureCollection(cellAggregatedData)
      return true;
    }
    if(this.props.markers !== nextProps.markers) {
      return true;
    }
    return false;
  }

  public findFilterIndex = (data, name) => {
    let index = 0
    for (var i = 0; i < data.length; i++) {
      index = data[i].name === name ? i : data.length
    };
    return index
  }

  public findFilterValueIndex = (data, name, value, value2) => {
    let index = -1
    for (var i = 0; i < data.length; i++) {
      if(data[i].name === name && data[i].value === value && data[i].value2 === value2) {
        return i
      }
    };
    return index
  }

  handleZoomstart = (map, maxZoom, defaultZoom, position) => {
    // console.log(map && map.leafletElement);
    // console.log(map.leafletElement.getZoom());
    const currentZoom = this.leafletMap?this.leafletMap.leafletElement.getZoom():4
    const v = 1 / Math.pow(2,Math.max(0, Math.min(maxZoom - currentZoom, 12)));
    return {maxZoom, currentZoom, defaultZoom, v, "intensity":v*1000, position}
  };

  initDrawElement = () => {
    if(this.drawFeatureGroupRef){
      const drawElement = this.drawFeatureGroupRef.leafletElement;
      if (Object.keys(drawElement._layers).length > 1) {
        this.deleteDrawElement(drawElement)
      }
    }
    // Add rectangle for selected latitude/longitude filter
    // var rectangle: [number, number][] = [[-68.91358710757541, 170.0654944469245], [9.621922751599145, 211.90709902792318]]
    var rectangle: [number, number][] = []
    const lat = find(this.props.filters.contextual.filters, latlng => latlng.name === this.lat_filter)
    const lng = find(this.props.filters.contextual.filters, latlng => latlng.name === this.lng_filter)
    if(lat && lng){
      rectangle = [[lat.value, lng.value], [lat.value2, lng.value2]]
    }
    return rectangle
  }

  deleteDrawElement = (drawElement) => {
    const drawnItems = drawElement._layers;
    Object.keys(drawnItems).forEach((layerid, index) => {
      if (index > 0) return;
      const layer = drawnItems[layerid];
      drawElement.removeLayer(layer);
      let lat_value, lat_value2, lng_value, lng_value2
      let points = layer._latlngs;
      for(let index in points){
        for(let point of Object.values(points[index])){
          // console.log("point", point, point["lat"], point["lng"])
          lat_value = lat_value < point["lat"] ? lat_value : point["lat"];
          lat_value2 = lat_value2 > point["lat"] ? lat_value2 : point["lat"];
          lng_value = lng_value < point["lng"] ? lng_value : point["lng"];
          lng_value2 = lng_value2 > point["lng"] ? lng_value2 : point["lng"];
        }
      }

      const index_lat = this.findFilterValueIndex(this.props.filters.contextual.filters, this.lat_filter, lat_value, lat_value2)
      this.props.removeContextualFilter(index_lat)
      
      const index_lng = this.findFilterValueIndex(this.props.filters.contextual.filters, this.lng_filter, lng_value, lng_value2)
      this.props.removeContextualFilter(index_lng)
      // console.log("deleting draw element:", {lat_value, lat_value2, lng_value, lng_value2})
    });
  }

  createDrawElement = (layer) => {
    let lat_value, lat_value2, lng_value, lng_value2
    let points = layer._latlngs;
    // console.log("points", points)
    for(let index in points){
      for(let point of Object.values(points[index])){
        lat_value = lat_value < point["lat"] ? lat_value : point["lat"];
        lat_value2 = lat_value2 > point["lat"] ? lat_value2 : point["lat"];
        lng_value = lng_value < point["lng"] ? lng_value : point["lng"];
        lng_value2 = lng_value2 > point["lng"] ? lng_value2 : point["lng"];
      }
    }
    // console.log("creating draw element:", {lat_value, lat_value2, lng_value, lng_value2})

    const lat_index = this.findFilterIndex(this.props.filters.contextual.filters, this.lat_filter)
    this.props.selectContextualFilter(lat_index, this.lat_filter)
    this.props.changeContextualFilterOperator(lat_index,'')
    this.props.changeContextualFilterValue(lat_index, lat_value)
    this.props.changeContextualFilterValue2(lat_index, lat_value2)

    const lng_index = this.findFilterIndex(this.props.filters.contextual.filters, this.lng_filter)
    this.props.selectContextualFilter(lng_index, this.lng_filter)
    this.props.changeContextualFilterOperator(lng_index,'')
    this.props.changeContextualFilterValue(lng_index, lng_value)
    this.props.changeContextualFilterValue2(lng_index, lng_value2)
  }

  public render() {
    const position: [number, number] = [this.state.lat, this.state.lng]
    // let samplePoints = []
    // for (var x of this.props.markers){
    //   var abundance = 0.0;
    //   if (typeof(x['abundance']) !== "undefined" && x['abundance'])
    //     abundance = x['abundance']; 
    //   console.log(x['lat'], x['lng'], "abud:", abundance)
    //   samplePoints.push([x['lat'], x['lng'], abundance]);
    // }
   
    // let sampleOtus = responseData.sample_otu_data;
    // let sampleContexts = responseData.sample_contextual_data;
    // let siteAggregatedData = aggregateSampleOtusBySite(sampleOtus);
    // let cellAggregatedData = aggregateSamplesByCell(siteAggregatedData, sampleContexts);
    // let samplePoints = aggregateSamplePointsBySite(siteAggregatedData)

    let heatMapLayer, abundanceLayer, richnessLayer, siteCountLayer, selectedRectangleBounds;
    // let plotLayer;
    if (!this.props.isLoading) 
    {
      // console.log("this.props.isLoading completed.....")
      if (this.samplePoints) 
      {
        heatMapLayer = <LayersControl.Overlay name="Heatmap: Abundance" checked>
        <HeatmapLayer
          fitBoundsOnLoad
          fitBoundsOnUpdate
          points={this.samplePoints}
          longitudeExtractor={m => m[1]}
          latitudeExtractor={m => m[0]}
          intensityExtractor={m => m[2]}
          // max={3}
          radius={30}
          // maxZoom={18}
          gradient={{
            0.4: 'blue',
            0.6: 'cyan',
            0.7: 'lime',
            0.8: 'yellow',
            1.0: 'red'
        }}
        />
        </LayersControl.Overlay>;
        abundanceLayer = <LayersControl.Overlay name="Gridcell: Abundance"><GeoJSON data={this.featureCollectionData} style={(feature: any) => this.layerStyle(feature, "weightedAbundance")} onEachFeature={(feature: any, layer: any) => this.onEachFeature(feature, layer)} /></LayersControl.Overlay>;
        richnessLayer = <LayersControl.Overlay name="Gridcell: Richness"><GeoJSON data={this.featureCollectionData} style={(feature: any) => this.layerStyle(feature, "weightedRichness")}  onEachFeature={(feature: any, layer: any) => this.onEachFeature(feature, layer)} /></LayersControl.Overlay>;
        siteCountLayer = <LayersControl.Overlay name="Gridcell: Site Count" checked><GeoJSON data={this.featureCollectionData} style={(feature: any) => this.layerStyle(feature, "weightedSites")} onEachFeature={(feature: any, layer: any) => this.onEachFeature(feature, layer)} /></LayersControl.Overlay>;
        // let sampleContextLookup = aggregateSampleContextBySite(this.props.markers);
        // plotLayer = <SamplesGraph siteAggregatedData={this.siteAggregatedData} sampleContextLookup={sampleContextLookup} leafletMap={this.leafletMap} />;
      }
    }

    const rectangle = this.initDrawElement()
    if(rectangle.length>0){
          selectedRectangleBounds = <Rectangle bounds={rectangle} />
        }

    const loadingstyle= {
      display: 'flex',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center'
    };

    return (
      <div style={{ height: '100%' }}>
        {
        this.props.isLoading
        ? 
        <div style={loadingstyle}>
            <JellyfishSpinner size={300} color="#999" loading={this.props.contextualIsLoading} />
        </div>
        :
        <>
        <div className="text-center">
          {this.props.isLoading ? 'Processing...' : `Showing ${this.props.markers.length} sample locations`}
        </div>
        <Map
          className="space-above"
          center={position}
          zoom={this.state.zoom}
          ref={m => {
            this.leafletMap = m
          }}
          minZoom={3}
          maxZoom={18}
          onclick={this.handleClick}
        >
          <FullscreenControl position="topright" />
          <FeatureGroup ref={drawFeatureGroupRef => {
                this.drawFeatureGroupRef = drawFeatureGroupRef
            }}>
            <EditControl
              position='topright'
              onDeleted={e => {
                this.deleteDrawElement(e.layers)
                this.props.fetchSamples()
              }}
              onCreated={e => {
                const layer = e.layer;
                if (e.layerType === 'rectangle') {
                  // Delete existing rectangle and keep the newly drawn rectangle
                  const drawElement = this.drawFeatureGroupRef.leafletElement;
                  if (Object.keys(drawElement._layers).length > 1) {
                    this.deleteDrawElement(drawElement)
                  }
                  this.createDrawElement(layer)
                  this.props.fetchSamples()
                }
              }}
              // onEdited={e => {
              //   e.layers.eachLayer(a => {
              //     console.log(a.toGeoJSON())
              //     this.props.updatePlot({
              //         feature: a.toGeoJSON()
              //     });
              //   });
              // }}
              edit={{ 
                edit: false,
                // remove: true,
                // save: false,
                // cancel: false
              }}
              draw={{
                marker: false,
                circlemarker: false,
                circle: false,
                // rectangle: false,
                polygon: false,
                polyline: false
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
                        <Popup minWidth={640} maxHeight={480}>
                        <div>
                            <BPAImages siteImages={marker.site_images} />
                            <BPASamples bpadata={marker.bpadata} />
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
          <GridCellLegendControl />
          <HeatMapLegendControl />
          {/* {plotLayer} */}
          {/* <LegendControl>
            <div>
              <svg width="50" height="16">
                <rect width="50" height="16" style={{fill:"#000000", fillOpacity:1, fillRule:"evenodd", stroke:"#000000", strokeOpacity:0.15, strokeWidth:1, strokeLinecap:"round", strokeLinejoin:"round"}}></rect>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="#ffffff">{'Heatmap'}</text>
              </svg>
              <svg width="500" height="16">
              <defs>
                <linearGradient id="linear" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="blue"/>
                  <stop offset="40%" stopColor="cyan"/>
                  <stop offset="60%" stopColor="lime"/>
                  <stop offset="70%" stopColor="yellow"/>
                  <stop offset="80%" stopColor="red"/>
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="500" height="16" fill="url(#linear)" />
              </svg>
            </div>
          </LegendControl> */}
          {/* <LegendControl>
            <div>
              <svg width="50" height="16">
                <rect width="50" height="16" style={{fill:"#000000", fillOpacity:1, fillRule:"evenodd", stroke:"#000000", strokeOpacity:0.15, strokeWidth:1, strokeLinecap:"round", strokeLinejoin:"round"}}></rect>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="#ffffff">{'Gridcell'}</text>
              </svg>
              <svg width="50" height="16">
                <rect width="50" height="16" style={{fill:"#9ECAE1", fillOpacity:0.5, fillRule:"evenodd", stroke:"#000000", strokeOpacity:0.15, strokeWidth:1, strokeLinecap:"round", strokeLinejoin:"round"}}></rect>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="#000000">{'<0'}</text>
              </svg>
              <svg width="50" height="16">
                <rect width="50" height="16" style={{fill:"#9ECAE1", fillOpacity:0.5, fillRule:"evenodd", stroke:"#000000", strokeOpacity:0.15, strokeWidth:1, strokeLinecap:"round", strokeLinejoin:"round"}}></rect>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="#000000">{'0-0.2'}</text>
              </svg>
              <svg width="50" height="16">
                <rect width="50" height="16" style={{fill:"#FFEDA0", fillOpacity:0.5, fillRule:"evenodd", stroke:"#000000", strokeOpacity:0.15, strokeWidth:1, strokeLinecap:"round", strokeLinejoin:"round"}}></rect>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="#000000">{'0.2-0.3'}</text>
              </svg>
              <svg width="50" height="16">
                <rect width="50" height="16" style={{fill:"#FED976", fillOpacity:0.5, fillRule:"evenodd", stroke:"#000000", strokeOpacity:0.15, strokeWidth:1, strokeLinecap:"round", strokeLinejoin:"round"}}></rect>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="#000000">{'0.3-0.4'}</text>
              </svg>
              <svg width="50" height="16">
                <rect width="50" height="16" style={{fill:"#FEB24C", fillOpacity:0.5, fillRule:"evenodd", stroke:"#000000", strokeOpacity:0.15, strokeWidth:1, strokeLinecap:"round", strokeLinejoin:"round"}}></rect>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="#000000">{'0.4-0.5'}</text>
              </svg>
              <svg width="50" height="16">
                <rect width="50" height="16" style={{fill:"#FD8D3C", fillOpacity:0.5, fillRule:"evenodd", stroke:"#000000", strokeOpacity:0.15, strokeWidth:1, strokeLinecap:"round", strokeLinejoin:"round"}}></rect>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="#000000">{'0.5-0.6'}</text>
              </svg>
              <svg width="50" height="16">
                <rect width="50" height="16" style={{fill:"#FC4E2A", fillOpacity:0.5, fillRule:"evenodd", stroke:"#000000", strokeOpacity:0.15, strokeWidth:1, strokeLinecap:"round", strokeLinejoin:"round"}}></rect>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="#000000">{'0.6-0.7'}</text>
              </svg>
              <svg width="50" height="16">
                <rect width="50" height="16" style={{fill:"#E31A1C", fillOpacity:0.5, fillRule:"evenodd", stroke:"#000000", strokeOpacity:0.15, strokeWidth:1, strokeLinecap:"round", strokeLinejoin:"round"}}></rect>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="#000000">{'0.7-0.8'}</text>
              </svg>
              <svg width="50" height="16">
                <rect width="50" height="16" style={{fill:"#BD0026", fillOpacity:0.5, fillRule:"evenodd", stroke:"#000000", strokeOpacity:0.15, strokeWidth:1, strokeLinecap:"round", strokeLinejoin:"round"}}></rect>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="#000000">{'0.8-0.9'}</text>
              </svg>
              <svg width="50" height="16">
                <rect width="50" height="16" style={{fill:"#800026", fillOpacity:0.5, fillRule:"evenodd", stroke:"#000000", strokeOpacity:0.15, strokeWidth:1, strokeLinecap:"round", strokeLinejoin:"round"}}></rect>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fill="#000000">{'>0.9'}</text>
              </svg>
            </div>
          </LegendControl> */}
        </Map>
        </>
        }
      </div>
    )
  }

  public componentDidMount() {
    this.setUpMiniMap()
    this.props.fetchSamples()
  }

  public setUpMiniMap() {
    // There is no port of the MiniMap plugin to React so we use the JS plugin directly and wire it up manually using a `ref` to the L.Map object
    const layer = new L.TileLayer(ArcGIS.url, {
      minZoom: 0,
      maxZoom: 13,
      attribution: ArcGIS.attribution
    })
    new MiniMap(layer, { toggleDisplay: true }).addTo(this.leafletMap.leafletElement)
  }

  public handleClick = (e) => {
    const { lat, lng } = e.latlng;
    const maxZoom = e.sourceTarget._layersMaxZoom
    const minZoom = e.sourceTarget._layersMinZoom
    // console.log(e)
    console.log({lat, lng, minZoom, maxZoom, ...this.handleZoomstart(this.leafletMap, maxZoom, this.state.zoom, [this.state.lat, this.state.lng])});
  }

  public onEachFeature(feature, layer) {
    // setting popup size constraint.
    layer.bindPopup("Loading...", {
      // layer.bindPopup(feature.properties.popupContent, {
      maxWidth: 800,
      maxHeight: 360
    });
    layer.on({
      // mouseover: this.handleGridLayerMouseOver,
      // mouseout: this.handleGridLayerMouseOut,
      // select: this.highlightLayer,
      click: this.handleGridLayerClick
    });
    // console.log(layer.feature);
  }

  /**
   * Function called when layer is selected.
   * @param {*} e
   */
  public handleGridLayerClick(e) {
    var layer = e.target;
    let popup = layer.getPopup();
    let popupContent =
      strongHeader("Sites per grid cell", layer.feature.properties.sites.length) +
      strongHeader("Richness per grid cell", layer.feature.properties.richness) +
      strongHeader("Abundance per grid cell", layer.feature.properties.abundance) +
      "<br />" +
      strongHeader("Std Richness per grid cell <span style='fontSize:16px' title='Std Richness per grid cell = Richness per grid cell / Sites per grid cell'>&#128712;</span>", layer.feature.properties.stdCellRichness) +
      strongHeader("Std Abundance per grid cell <span style='fontSize:16px' title='Std Abundance per grid cell = Abundance per grid cell / Sites per grid cell'>&#128712;</span>", layer.feature.properties.stdCellAbundance) +
      "<br />" +
      strongHeader("Max Sites per grid cell", layer.feature.properties.maxSites) +
      strongHeader("Max Std Richness per grid cell", layer.feature.properties.maxRichness) +
      strongHeader("Max Std Abundance per grid cell", layer.feature.properties.maxAbundance) +
      "<br />" +
      strongHeader("Wtd Sites per grid cell <span style='fontSize:16px' title='Wtd Sites per grid cell = Sites per grid cell / Max Sites per grid cell'>&#128712;</span>", layer.feature.properties.weightedSites) +
      strongHeader("Wtd Richness per grid cell <span style='fontSize:16px' title='Wtd Richness per grid cell = Std Richness per grid cell / Max Std Richness per grid cell'>&#128712;</span>", layer.feature.properties.weightedRichness) +
      strongHeader("Wtd Abundance per grid cell <span style='fontSize:16px' title='Wtd Abundance per grid cell = Std Abundance per grid cell / Max Std Abundance per grid cell'>&#128712;</span>", layer.feature.properties.weightedAbundance) +
      "<br />" +
      strongHeader(
        "Longitude",
        layer.feature.properties.coordinates[0][0] + " to " + layer.feature.properties.coordinates[2][0]
      ) +
      strongHeader(
        "Latitude",
        layer.feature.properties.coordinates[0][1] + " to " + layer.feature.properties.coordinates[2][1]
      ) +
      "<br />";
    //list all sites within the cell.properties
    popupContent += strongLine("Sites in cell: ") + "<ul>";
    for (let i in layer.feature.properties.sites) {
      let siteId = layer.feature.properties.sites[i];
      popupContent += "<li>" + siteId + "</li>";
    }
    popupContent += "</ul><br />";
    popup.setContent(popupContent);
    // popup.bindPopup(popup);
  }

  // public handleGridLayerMouseOver(e) {
  //   // TODO: Should be in plot file.
  //   let layer = e.target;
  //   layer.feature.properties.sites.forEach(siteId => {
  //     // console.log("#_" + siteId);
  //     let circle = d3.selectAll("#_" + siteId);
  //     circle
  //       .transition()
  //       .duration(250)
  //       .attr("r", plotConfig.activeCircleRadius);
  //   });
  // }
  
  // /**
  //  * highlights plot circles that are within a grid cell layer.
  //  * @param   {layer event}  e  some layer event
  //  * @return  {void}
  //  */
  // public handleGridLayerMouseOut(e) {
  //   // TODO: Should be in plot file.
  //   let layer = e.target;
  //   layer.feature.properties.sites.forEach(siteId => {
  //     let circle = d3.selectAll("#_" + siteId);
  //     circle
  //       .transition()
  //       .duration(250)
  //       .attr("r", plotConfig.inactiveCircleRadius);
  //   });
  // }

  // /**
  //  * centralised place to store value
  //  */
  // public getOutlineOpacity(): number {
  //   return 0.15;
  // }

  // /**
  //  * Resets layer outline weight and opacity to original values.
  //  * Values are hardcoded due to geojson.reset() not working as planned.
  //  * @param {*} layer
  //  */
  // public disableHighlightLayer(layer) {
  //   layer.setStyle({
  //     weight: 1,
  //     opacity: this.getOutlineOpacity()
  //   });
  // }

  // public highlightLayer(layer) {
  //   layer.setStyle({
  //     weight: 5,
  //     opacity: 0.9
  //   });
  //   if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
  //     layer.bringToFront();
  //   }
  // }

  public layerStyle(feature, property) {
    
    return {
      fillColor: GridCellLegendControl.fillColor(feature.properties[property]),
      weight: 1,
      opacity: GridCellLegendControl.outlineOpacity,
      color: GridCellLegendControl.outlineColor,
      fillOpacity: GridCellLegendControl.fillOpacity(feature.properties[property])
    };
  }

  public makeFeatureCollection(cellAggs: any) {
    let maxes = calculateMaxes(cellAggs);
    let featureCollection: GeoJSON.FeatureCollection<any> = {
      type: "FeatureCollection",
      features: []
    };
    for (let key in cellAggs) {
      let cell = cellAggs[key];
      
      let stdCellRichness = cell.richness / cell.sites.length;
      let stdCellAbundance = cell.abundance / cell.sites.length;
      let countCellSites = cell.sites.length;

      let weightedRichness = stdCellRichness / maxes.richness;
      let weightedAbundance = stdCellAbundance / maxes.abundance;
      let weightedSites = countCellSites / maxes.sites;
      
      featureCollection.features.push({
        type: "Feature",
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
          coordinates: cell.coordinates
        },
        geometry: {
          type: "Polygon",
          coordinates: [cell.coordinates]
        }
      });
    }
    return featureCollection;
  }
}

function mapStateToProps(state) {
  return {
    filters: state.searchPage.filters,
    dataDefinitions: state.contextualDataDefinitions.filters,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
      {
        addContextualFilter,
        selectContextualFilter,
        removeContextualFilter,
        changeContextualFilterOperator,
        changeContextualFilterValue,
        changeContextualFilterValue2,
        changeContextualFilterValues,
        search,
        fetchContextualDataForGraph,
      },
      dispatch
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SamplesMap)
