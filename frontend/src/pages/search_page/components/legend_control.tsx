import React from 'react';
import ReactDOM from 'react-dom';
import L from 'leaflet';
import { MapControl } from 'react-leaflet';

export default class LegendControl extends MapControl {

  createLeafletElement() {
    const content = (
      <div {...this.props}>
        {this.props.children}
      </div>
    );
    const legend = L.Control.extend({
      onAdd: map => {
        let div = L.DomUtil.create('div', '');
        ReactDOM.render(content, div);
        return div;
      }
    });
    return new legend({ position: "bottomleft" });
  }

}