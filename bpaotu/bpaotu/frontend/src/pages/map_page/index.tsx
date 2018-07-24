import { noop, isEmpty } from 'lodash';
import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { fetchSampleMapSamples } from './reducers';
import SamplesMap from '../../components/samples_map';

const MapPage = props => {
    const mapContainerHeight = window.innerHeight - 220 * 2 + 'px';
    const fetchSamples = isEmpty(props.markers) ? props.fetchSamples : noop;

    return (
        <div style={{ height: mapContainerHeight }}>
            <SamplesMap fetchSamples={fetchSamples} isLoading={props.isLoading} markers={props.markers} />
        </div>
    );
};

function mapStateToProps(state) {
    return {
        isLoading: state.mapPage.isLoading,
        markers: state.mapPage.samples,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        fetchSamples: fetchSampleMapSamples
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MapPage);
