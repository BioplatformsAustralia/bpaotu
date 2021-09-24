import React from 'react'
import ReactDOM from 'react-dom'
import L from 'leaflet'
import { Container, Row, Col } from 'reactstrap'
import { withLeaflet, MapControl } from 'react-leaflet'
import ReactSlider from "react-slider"
import styled from 'styled-components';

const StyledSlider = styled(ReactSlider)`
    width: 465px;
    height: 16px;
`;

const StyledThumb = styled.div`
    margin: 0px 0px 0px -15px;
    height: 20px;
    line-height: 20px;
    font-size: 10px;
    width: 20px;
    text-align: center;
    background-color: #000;
    color: #fff;
    cursor: grab;
`;

const Thumb = (props, state) => <StyledThumb {...props}>{state.valueNow}</StyledThumb>;

const StyledTrack = styled.div`
    top: 3px;
    bottom: 0px;
    margin: 0px 0px 0px -15px;
    background: ${props => props.index === 2 ? '#f00' : props.index === 1 ? '#041e48' : '#17c496'};
`;

const Track = (props, state) => <StyledTrack {...props} index={state.index} />;

const StyledMark = styled.span`
    top: 7px;
    margin: 0px 0px 0px 10px;
    background: #fff;
`;

const Mark = (props) => <StyledMark {...props}  />;

const StyledLabel = styled.div`
    margin: 0px -15px;
    height: 20px;
    padding: 0px 5px;
    line-height: 20px;
    font-size: 11px;
    color: #fff;
    background-color: #000;
    border: #000
`;

class GridCellSizer extends MapControl<any> {

    createLeafletElement(opts) {
        
        const content = (
            <Container fluid={true}>
                <Row>
                    <Col xs="auto">
                        <StyledLabel>Gridcell Size</StyledLabel>
                    </Col>
                    <Col >
                        <StyledSlider
                            defaultValue={this.props.gridcellSize}
                            min={0.25}
                            max={25} 
                            step={0.25}
                            renderTrack={Track}
                            renderThumb={Thumb}
                            renderMark={Mark}
                            marks
                            onAfterChange={(val) => {this.props.setGridcellSize(val)}}
                        />
                    </Col>
                </Row>
                </Container>
        );
        const GridCellSizer:any = L.Control.extend({
            onAdd: map => {
                let div = L.DomUtil.create('div', '');
                ReactDOM.render(content, div);
                return div;
            }
        });
        return new GridCellSizer({ position: "bottomleft" });
    }
}

export default withLeaflet(GridCellSizer)