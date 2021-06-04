import { first, join, keys, map } from 'lodash'
import * as React from 'react'
import { Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from 'reactstrap'

import * as L from 'leaflet'
import * as MiniMap from 'leaflet-minimap'
import { Map, Marker, Popup, TileLayer, LayersControl, GeoJSON  } from 'react-leaflet'
import HeatMapLegendControl from '../pages/search_page/components/heatmap_legend'
import GridCellLegendControl from '../pages/search_page/components/gridcell_legend'

import FullscreenControl from 'react-leaflet-fullscreen'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import HeatmapLayer from 'react-leaflet-heatmap-layer'
import { strongLine, strongHeader } from '../utils'
import {aggregateSampleOtusBySite, aggregateSamplesByCell, aggregateSamplePointsBySite, calculateMaxes} from "../aggregation"

/*
Unfortunately, react-leaflet fails to load markers if the css isn't included in the html file, so
this import doesn't work. Leaving it in as a reminder.
Reference: https://github.com/PaulLeCam/react-leaflet/issues/453
*/
// import 'leaflet/dist/leaflet.css';

import 'leaflet-minimap/dist/Control.MiniMap.min.css'
import 'react-leaflet-fullscreen/dist/styles.css'
import 'react-leaflet-markercluster/dist/styles.min.css'

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
export default class SamplesMap extends React.Component<any> {
  public leafletMap
  public featureCollectionData
  public samplePoints
  public state = {
    ...MapInitialViewport,
  }

   shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.sample_otus.length > 0 && this.props.sample_otus !== nextProps.sample_otus) {
      let siteAggregatedData = aggregateSampleOtusBySite(nextProps.sample_otus);
      this.samplePoints = aggregateSamplePointsBySite(siteAggregatedData);
      // console.log("samplepoints: ", this.samplePoints)
      // console.log("samplepoints: ", nextProps.sample_otus)
      let cellAggregatedData = aggregateSamplesByCell(siteAggregatedData);
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
        console.log("selected index: ", i)
        return i
      }
    };
    return index
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

    let heatMapLayer, abundanceLayer, richnessLayer, siteCountLayer;
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
          // maxZoom={10}
          gradient={{
            0.4: 'blue',
            0.6: 'cyan',
            0.7: 'lime',
            0.8: 'yellow',
            1.0: 'red'
        }}
        />
        </LayersControl.Overlay>;
        abundanceLayer = <LayersControl.Overlay name="Gridcell: Abundance"><GeoJSON data={this.featureCollectionData} style={(feature: any) => this.layerStyle(feature, "weightedAbundance")} onEachFeature={(feature: any, layer: any) => this.onEachFeature(feature, layer)} />
        </LayersControl.Overlay>;
        richnessLayer = <LayersControl.Overlay name="Gridcell: Richness"><GeoJSON data={this.featureCollectionData} style={(feature: any) => this.layerStyle(feature, "weightedRichness")}  onEachFeature={(feature: any, layer: any) => this.onEachFeature(feature, layer)} /></LayersControl.Overlay>;
        siteCountLayer = <LayersControl.Overlay name="Gridcell: Site Count" checked><GeoJSON data={this.featureCollectionData} style={(feature: any) => this.layerStyle(feature, "weightedSites")} onEachFeature={(feature: any, layer: any) => this.onEachFeature(feature, layer)} /></LayersControl.Overlay>;
      }
    }

    return (
      <div style={{ height: '100%' }}>
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
        </Map>
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
    console.log(e)
    console.log({lat, lng, minZoom, maxZoom});
  }

  public onEachFeature(feature, layer) {
    // setting popup size constraint.
    layer.bindPopup("Loading...", {
      maxWidth: 800,
      maxHeight: 360
    });
    layer.on({
      click: this.handleGridLayerClick
    });
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

  /**
   * centralised place to store value
   */
  public getOutlineOpacity(): number {
    return 0.15;
  }

  /**
   * Resets layer outline weight and opacity to original values.
   * Values are hardcoded due to geojson.reset() not working as planned.
   * @param {*} layer
   */
  public disableHighlightLayer(layer) {
    layer.setStyle({
      weight: 1,
      opacity: this.getOutlineOpacity()
    });
  }

  public highlightLayer(layer) {
    layer.setStyle({
      weight: 5,
      opacity: 0.9
    });
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  }

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
