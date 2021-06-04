import L from 'leaflet';
import { MapControl } from 'react-leaflet';

export default class GridCellLegendControl extends MapControl {

  static outlineOpacity = 0.15;
  static outlineColor = "#000000";
  static fillOpacity = d => (d > 0.0 ? 0.5 : 0.2);
  static fillColor = d =>
    d > 0.9
    ? "#800026"
    : d > 0.8
    ? "#BD0026"
    : d > 0.7
    ? "#E31A1C"
    : d > 0.6
    ? "#FC4E2A"
    : d > 0.5
    ? "#FD8D3C"
    : d > 0.4
    ? "#FEB24C"
    : d > 0.3
    ? "#FED976"
    : d > 0.2
    ? "#FFEDA0"
    : d > 0.0
    ? "#FFFFCC"
    : "#9ECAE1";

  componentWillMount() {
    const legend = L.control({position: 'bottomleft'});
    

    legend.onAdd = function (map) {
        const div = L.DomUtil.create("div", "");
        const levels = [-0.0, 0.0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
        let labels = [];
        let from;
        let to;

        labels.push(
          '<svg width="50" height="16">'+
          '<rect width="50" height="16" style="fill:#000000; fill-opacity:1; fill-rule;evenodd; '+
            'stroke:'+GridCellLegendControl.outlineColor+'; stroke-opacity:'+GridCellLegendControl.outlineOpacity+'; stroke-width:1; stroke-linecap:round; stroke-linejoin:round"></rect>'+
          '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="11" fill="#ffffff">Gridcell</text>'+
          '</svg>'
          );
  
        for (let i = 0; i < levels.length; i++) {
          from = levels[i];
          to = levels[i + 1];
          labels.push(
          '<svg width="50" height="16">'+
          '<rect width="50" height="16" style="fill:'+GridCellLegendControl.fillColor(from>0? from +0.01:-0.0)+'; fill-opacity:'+GridCellLegendControl.fillOpacity(from + 0.01)+'; fill-rule:evenodd; '+
          'stroke:'+GridCellLegendControl.outlineColor+'; stroke-opacity:'+GridCellLegendControl.outlineOpacity+'; stroke-width:1; stroke-linecap:round; stroke-linejoin:round">'+
          '</rect>'+
          '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="11" fill="black">'+
          (to ? from + "-" + to : (from>0? ">": "<")+from) + 
          '</text>'+
          '</svg>'
          );
        }
        div.innerHTML = labels.join("");
        return div;
    };

    this.leafletElement = legend;
  }
}