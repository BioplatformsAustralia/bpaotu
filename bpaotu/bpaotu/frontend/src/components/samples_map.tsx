import { first, keys, map } from 'lodash'
import * as React from 'react'
import { Button, Card, CardText, CardTitle, Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from 'reactstrap'

import * as L from 'leaflet'
import * as MiniMap from 'leaflet-minimap'
import { Map, Marker, Popup, TileLayer, Tooltip } from 'react-leaflet'
import FullscreenControl from 'react-leaflet-fullscreen'
import MarkerClusterGroup from 'react-leaflet-markercluster'

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
    '&amp;copy; i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}

class BPAImages extends React.Component<any, any> {
    constructor(props: any) {
        super(props)

        let imgs = []
        for (let _i=0; _i<Object.keys(this.props.img_urls).length; _i++) {
            console.log(_i);
            imgs.push(<img src={`/process_img/${this.props.lat}/${this.props.lng}/${_i}`} />)
        }

        this.state = {
            img: imgs
        }
    }

    public render() {
        return (
            <div>
                {this.state.img}
            </div>
        )
    }
}

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
                    {map(data, (d, k) => (
                      <tr>
                        <th>{k}:</th>
                        <td>{d}</td>
                      </tr>
                    ))}
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
  public state = {
    ...MapInitialViewport
  }

  public render() {
    const position: [number, number] = [this.state.lat, this.state.lng]

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
        >
          <FullscreenControl position="topright" />
          <TileLayer url={ArcGIS.url} attribution={ArcGIS.attribution} />
          <MarkerClusterGroup>
            {this.props.markers.map((marker, index) => (
              <Marker key={`marker-${index}`} position={marker}>
                  <Popup minWidth={480} maxHeight={360}>
                  <div>
                      <BPASamples bpadata={marker.bpadata} />
                      <hr />
                      <BPAImages lat={marker.lat} lng={marker.lng} img_urls={marker.img_urls} />
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
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
}
