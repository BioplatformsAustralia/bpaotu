import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  Map,
  Marker,
  Popup,
  TileLayer,
  LayersControl,
  GeoJSON,
  FeatureGroup,
  Rectangle,
  ScaleControl,
  CircleMarker,
} from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import FullscreenControl from 'react-leaflet-fullscreen'

import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from 'reactstrap'

import { ArcGIS, tileLayer } from 'app/map'

// so we can pass props from parent component as well as use redux
interface OwnProps {
  item: any
}

// import type { RootState } from 'app/store' // instead of `any` below:
interface SamplesState {
  data: any[]
}
interface RootStateLike {
  magsPage: {
    samples: SamplesState
  }
}

type Props = OwnProps

// interface StateProps {
//   samples: any
// }
// type Props = OwnProps & StateProps

const MarkerPopup: React.FC<{ marker: any }> = ({ marker }) => {
  const sampleIds = Object.keys(marker.bpadata)

  return (
    <div>
      <p>
        Lat: {marker.lat}
        <br />
        Lng: {marker.lng}
      </p>
      <p>Samples: ({sampleIds.length})</p>
      <ul>
        {sampleIds.map((x) => (
          <li>{marker.bpadata[x]['Sample ID']}</li>
        ))}
      </ul>
    </div>
  )
}

const MagsMap: React.FC<Props> = ({ item }) => {
  const samples = useSelector((state: RootStateLike) => state.magsPage.samples)

  // const dispatch = useDispatch()
  // const onSomething = () => dispatch(doSomething(payload))

  const position: [number, number] = [item.lat, item.lng]
  const [zoom, setZoom] = useState(8)

  return (
    <Card>
      <CardHeader tag="h5">Map</CardHeader>
      <CardBody>
        <div style={{ height: '600px' }}>
          <Map
            minZoom={2}
            maxBounds={[
              [90, 180],
              [-90, -180],
            ]}
            center={position}
            zoom={zoom}
          >
            <FullscreenControl position="topright" />
            <LayersControl>
              <LayersControl.BaseLayer name="Base">
                <TileLayer url={ArcGIS.url} attribution={ArcGIS.attribution} />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="OSM" checked>
                <TileLayer url={tileLayer.url} attribution={tileLayer.attribution} />
              </LayersControl.BaseLayer>
              <LayersControl.Overlay name="Item" checked>
                <CircleMarker
                  center={[item.lat, item.lng]}
                  radius={12}
                  color="red"
                  fillColor="transparent"
                  weight={3}
                />
              </LayersControl.Overlay>
              <LayersControl.Overlay name="Sites" checked>
                <MarkerClusterGroup>
                  {samples.data.map((marker, index) => {
                    return (
                      <Marker key={`marker-${index}`} position={marker}>
                        <Popup minWidth={640} maxHeight={480} className="bpaotu-map-popup">
                          <div className="bpaotu-map-popup-inner">
                            <MarkerPopup marker={marker} />
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}
                </MarkerClusterGroup>
              </LayersControl.Overlay>
            </LayersControl>
          </Map>
        </div>
      </CardBody>
    </Card>
  )
}

export default MagsMap

// const mapStateToProps = (state: any): StateProps => ({
//   samples: state.magsPage.samples,
// })

// const mapDispatchToProps = (dispatch) => {
//   return bindActionCreators(
//     {
//       //
//     },
//     dispatch
//   )
// }

// export default connect<StateProps, {}, OwnProps>(mapStateToProps)(MagsMap)
