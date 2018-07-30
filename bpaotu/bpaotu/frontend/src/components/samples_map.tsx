import * as React from 'react';
import * as _ from 'lodash';
import { TabContent, TabPane, Nav, NavItem, NavLink, CardTitle, CardText, Row, Col, Card, Button } from 'reactstrap';

import {
    Map,
    Marker,
    TileLayer,
    Tooltip,
    Popup
} from 'react-leaflet';
import FullscreenControl from 'react-leaflet-fullscreen';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import * as MiniMap from 'leaflet-minimap';
import * as L from 'leaflet';

/*
Unfortunately, react-leaflet fails to load markers if the css isn't included in the html file, so
this import doesn't work. Leaving it in as a reminder.
Reference: https://github.com/PaulLeCam/react-leaflet/issues/453
*/
//import 'leaflet/dist/leaflet.css';

import 'react-leaflet-markercluster/dist/styles.min.css';
import 'leaflet-minimap/dist/Control.MiniMap.min.css';


// Initial Viewport is Australia
const MapInitialViewport = {
    lat: -25.27,
    lng: 133.775,
    zoom: 4,
}

const ArcGIS = {
    url: "//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&amp;copy; i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
}

class BPASamples extends React.Component<any, any> {
    constructor(props: any) {
        super(props);

        this.state = {
            bpadata: this.props.bpadata,
            activeTab: _.first(_.keys(this.props.bpadata))
        };

        this.toggle = this.toggle.bind(this);
    }

    toggle(tab) {
      if (this.state.activeTab !== tab) {
        this.setState({
          activeTab: tab
        });
      }
    }

    public render() {
        return (
            <div>
                <Nav tabs>
                {
                    _.map(this.props.bpadata, (data, index) => (
                        <NavItem key={index}>
                            <NavLink
                                className={ index }
                                onClick={() => { this.toggle(index); }}>
                                    Sample { index }
                            </NavLink>
                        </NavItem>
                    ))
                }
                </Nav>

                <TabContent activeTab={ this.state.activeTab }>
                {
                    _.map(this.props.bpadata, (data, index) => (
                        <TabPane key={index} tabId={index}>
                            <Row>
                              <Col sm="12">
                                <table>
                                {
                                    _.map(data, (d, k) => (
                                        <tr><th>{k}:</th><td>{d}</td></tr>
                                    ))

                                }
                                </table>
                              </Col>
                            </Row>
                        </TabPane>
                    ))
                }
                </TabContent>
            </div>
        );
    }
}

export default class SamplesMap extends React.Component<any> {
    leafletMap;
    state = {
        ...MapInitialViewport,
    }

    render() {
        const position: [number, number] = [this.state.lat, this.state.lng];

        return (
            <div style={{ height: '100%' }}>
                <div className="text-center">{this.props.isLoading ? 'Processing...' : `Showing ${this.props.markers.length} samples`}</div>
                <Map className="space-above" center={position} zoom={this.state.zoom} ref={m => { this.leafletMap = m }}>
                    <FullscreenControl position="topright" />
                    <TileLayer url={ArcGIS.url} attribution={ArcGIS.attribution} />
                    <MarkerClusterGroup>
                        {this.props.markers.map((marker, index) =>
                            <Marker key={`marker-${index}`} position={marker}>

                                <Popup minWidth={640} maxHeight={200}>
                                    <div>
                                        <BPASamples bpadata={marker.bpadata} />
                                    </div>
                                </Popup>
                            </Marker>
                        )}
                    </MarkerClusterGroup>
                </Map>
            </div>
        );
    }

    componentDidMount() {
        this.setUpMiniMap();
        this.props.fetchSamples();
    }

    setUpMiniMap() {
        // There is no port of the MiniMap plugin to React so we use the JS plugin directly and wire it up manually using a `ref` to the L.Map object
        const layer = new L.TileLayer(ArcGIS.url, {
            minZoom: 0,
            maxZoom: 13,
            attribution: ArcGIS.attribution,
        });
        new MiniMap(layer, { toggleDisplay: true }).addTo(this.leafletMap.leafletElement);
    }
}