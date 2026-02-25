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

import { LoadingSpinner } from 'pages/mags_page/components'
import { MarkerPopup } from 'components/samples_map'

// so we can pass props from parent component as well as use redux
interface OwnProps {
  sampleId: any
}

// import type { RootState } from 'app/store' // instead of `any` below:
interface SamplesState {
  data: any[]
  isLoading: boolean
  hasLoaded: boolean
}
interface RootStateLike {
  magsPage: {
    samples: SamplesState
  }
}

type Props = OwnProps

const MagsMap: React.FC<Props> = ({ sampleId }) => {
  const samples = useSelector((state: RootStateLike) => state.magsPage.samples)
  const sampleRecord = samples.data.find((x) => Object.keys(x.bpadata).includes(sampleId))

  const [position, setPosition] = useState<[number, number]>([0, 0])
  const [zoom, setZoom] = useState(8)

  useEffect(() => {
    if (!sampleRecord) return

    setPosition([sampleRecord.lat, sampleRecord.lng])
  }, [sampleRecord, setPosition])

  const renderMap = () => {
    const loading = Boolean(samples.isLoading || !samples.hasLoaded)
    if (loading) {
      return <LoadingSpinner text="Loading Sample data" />
    }

    return (
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
          <LayersControl.Overlay name="Sample" checked>
            <CircleMarker
              color="red"
              fillColor="transparent"
              center={position}
              radius={12}
              weight={3}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Sites" checked>
            <MarkerClusterGroup>
              {samples.data.map((marker, index) => {
                return (
                  <Marker key={`marker-${index}`} position={marker}>
                    <Popup minWidth={540} maxHeight={480} className="bpaotu-map-popup">
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
    )
  }

  return (
    <Card>
      <CardHeader tag="h5">Map</CardHeader>
      <CardBody>
        <div style={{ height: '600px' }}>{renderMap()}</div>
      </CardBody>
    </Card>
  )
}

export default MagsMap
