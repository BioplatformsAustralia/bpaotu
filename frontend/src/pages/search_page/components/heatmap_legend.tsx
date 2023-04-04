import L from 'leaflet'
import { withLeaflet, MapControl } from 'react-leaflet'
class HeatMapLegendControl extends MapControl {
  outlineOpacity = 1
  outlineColor = 'transparent'
  fillOpacity = (d) => (d > 0.0 ? 1 : 1)
  fillColor = (d) =>
    d > 0.8
      ? 'red'
      : d > 0.7
      ? 'yellow'
      : d > 0.6
      ? 'lime'
      : d > 0.4
      ? 'cyan'
      : d > 0.0
      ? 'blue'
      : 'blue'

  createLeafletElement() {
    const HeatMapLegendControl = L.Control.extend({
      onAdd: (map) => {
        const div = L.DomUtil.create('div', '')
        let labels = []

        labels.push(
          '<svg width="50" height="16">' +
            '<rect width="50" height="16" style="fill:#000000; fill-opacity:1; fill-rule;evenodd; ' +
            'stroke:' +
            this.outlineColor +
            '; stroke-opacity:' +
            this.outlineOpacity +
            '; stroke-width:1; stroke-linecap:round; stroke-linejoin:round"></rect>' +
            '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="11" fill="#ffffff">Heatmap</text>' +
            '</svg>' +
            '<svg width="500" height="16">' +
            '<defs>' +
            '<linearGradient id="linear" x1="0%" y1="0%" x2="100%" y2="0%">' +
            '<stop offset="0%" stop-color="blue"/>' +
            '<stop offset="40%"  stop-color="cyan"/>' +
            '<stop offset="60%" stop-color="lime"/>' +
            '<stop offset="70%" stop-color="yellow"/>' +
            '<stop offset="80%" stop-color="red"/>' +
            '</linearGradient>' +
            '</defs>' +
            '<rect x="0" y="0" width="500" height="16" fill="url(#linear)" />' +
            '</svg>'
        )
        div.innerHTML = labels.join('')
        return div
      },
    })
    return new HeatMapLegendControl({ position: 'bottomleft' })
  }
}

export default withLeaflet(HeatMapLegendControl)
