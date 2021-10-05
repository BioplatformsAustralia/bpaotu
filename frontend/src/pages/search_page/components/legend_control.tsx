import React from 'react';
import ReactDOM from 'react-dom';
import L from 'leaflet';
import { withLeaflet, MapControl } from 'react-leaflet';

class LegendControl extends MapControl {

  createLeafletElement() {
    const content = (
      <div {...this.props}>
        {this.props.children}
      </div>
    );
    const LegendControl = L.Control.extend({
      onAdd: map => {
        let div = L.DomUtil.create('div', '');
        ReactDOM.render(content, div);
        return div;
      }
    });
    return new LegendControl({ position: "bottomleft" });
  }

}

export default withLeaflet(LegendControl)