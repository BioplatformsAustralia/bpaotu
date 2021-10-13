import React from 'react'
import ReactDOM from 'react-dom'
import L from 'leaflet'
import { Container, Row, Col, UncontrolledTooltip } from 'reactstrap'
import { withLeaflet, MapControl } from 'react-leaflet'
import ReactSlider from "react-slider"
import styled from 'styled-components';
import Octicon from '../../../components/octicon'

const StyledSlider = styled(ReactSlider)`
    width: 450px;
    height: 16px;
`;

const StyledThumb = styled.div`
    margin: 0px 0px 0px 0px;
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
    margin: 0px 0px 0px 0px;
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
    margin: 0px -30px 0px -15px;
    height: 20px;
    padding: 0px 15px 0px 5px;
    line-height: 20px;
    font-size: 11px;
    color: #fff;
    background-color: #000;
    border: #000
`;

class GridCellSizer extends MapControl<any> {

    createLeafletElement(props) {
        
        const content = (
            <>
            <Container fluid={true} >
                <Row>
                    <Col xs="auto">
                        <StyledLabel id="GridCellResizeTip">Gridcell Size <Octicon size="medium" name="info" /></StyledLabel>
                    </Col>
                    <Col>
                        <StyledSlider
                            defaultValue={props.gridcellSize}
                            min={0.25}
                            max={10} 
                            step={0.25}
                            renderTrack={Track}
                            renderThumb={Thumb}
                            renderMark={Mark}
                            marks={[0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                            onAfterChange={(val) => {props.setGridcellSize(val)}}
                        />
                    </Col>
                </Row>
            </Container>
            <UncontrolledTooltip target="GridCellResizeTip" trigger="hover" placement="auto">
                Grid size refers to degrees lat X degrees lon (i.e., a size of one will produce a grid of 1 degree x 1 degree).  
                Small grid sizes ({'<1'}) will take some time to resolve at the global scale (up to 3 min) , and are likely not required at this scale.
                Small grid sizes will resolve much more quickly when a region of interest is chosen before selecting the grid size.  
                A region of interest may be selected using the region selection tool ('Draw a rectangle') on the top right end of the map page.
            </UncontrolledTooltip>
            </>
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