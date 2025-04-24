import L from 'leaflet'
import { withLeaflet, MapControl } from 'react-leaflet'

class LatLngCoordinatesControl extends MapControl {
  createLeafletElement() {
    const LatLngCoordinatesControl = L.Control.extend({
      _pos: null,

      options: {
        position: 'bottomleft',
        separator: ' : ',
        emptyString: '',
        lngFirst: false,
        numDigits: 5,
        lngFormatter: undefined,
        latFormatter: undefined,
        formatter: undefined,
        prefix: '',
        wrapLng: true,
      },

      onRemove: function (map) {
        map.off('mousemove', this._onMouseMove)
      },

      onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition')
        L.DomEvent.disableClickPropagation(this._container)
        map.on('mousemove', this._onMouseMove, this)
        this._container.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'
        this._container.style.fontSize = '11px'
        this._container.innerHTML = this.options.emptyString
        return this._container
      },

      getLatLng: function () {
        return this._pos
      },

      _onMouseMove: function (e) {
        this._pos = e.latlng.wrap()
        var lngValue = this.options.wrapLng ? e.latlng.wrap().lng : e.latlng.lng
        var latValue = e.latlng.lat
        var lng
        var lat
        var value
        var prefixAndValue

        if (this.options.formatter) {
          prefixAndValue = this.options.formatter(lngValue, latValue)
        } else {
          lng = this.options.lngFormatter
            ? this.options.lngFormatter(lngValue)
            : L.Util.formatNum(lngValue, this.options.numDigits)
          lat = this.options.latFormatter
            ? this.options.latFormatter(latValue)
            : L.Util.formatNum(latValue, this.options.numDigits)
          value = this.options.lngFirst
            ? lng + this.options.separator + lat
            : lat + this.options.separator + lng
          prefixAndValue = this.options.prefix + ' ' + value
        }

        this._container.innerHTML = prefixAndValue
      },
    })
    return new LatLngCoordinatesControl()
  }
}

export default withLeaflet(LatLngCoordinatesControl)
