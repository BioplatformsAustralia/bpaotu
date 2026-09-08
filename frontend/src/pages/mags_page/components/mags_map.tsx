import React from 'react'
import { useSelector } from 'react-redux'

import { Map, Marker, Popup, TileLayer, LayersControl, CircleMarker } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import FullscreenControl from 'react-leaflet-fullscreen'

import { Card, CardBody, CardHeader } from 'reactstrap'

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

const MagsMap = ({ sampleId }: Props) => {
  const samples = useSelector((state: RootStateLike) => state.magsPage.samples)
  const sampleRecord = samples.data.find((x) => Object.keys(x.bpadata).includes(sampleId))

  const zoom = 8

  const renderMap = () => {
    const loading = Boolean(samples.isLoading || !samples.hasLoaded)

    if (loading) {
      return <LoadingSpinner text="Loading Sample data" />
    }

    if (!sampleRecord) {
      return <div>Sample {sampleId} was not found</div>
    }

    // lat and lng are mandatory fields on the sample
    const position: [number, number] = [sampleRecord.lat, sampleRecord.lng]

    return (
      <Map minZoom={2} center={position} zoom={zoom}>
        <FullscreenControl position="topright" />
        <LayersControl>
          <LayersControl.BaseLayer name="Basemap" checked>
            <TileLayer url={tileLayer.url} attribution={tileLayer.attribution} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer url={ArcGIS.url} attribution={ArcGIS.attribution} />
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
