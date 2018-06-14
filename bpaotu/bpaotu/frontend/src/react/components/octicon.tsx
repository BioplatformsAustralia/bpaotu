import * as React from 'react';
import * as octicons from 'octicons';

const style = {
    display: 'inline-block',
    verticalAlign: 'middle',
    paddingTop: 8,
}

export default (props) =>  {
    let width = 20;
    if (props.size === 'larger') width = 32;
    if (props.size === 'large') width = 48;
    const options = { width };
    return (
        <div style={style}
            dangerouslySetInnerHTML={{ __html: octicons[props.name].toSVG(options)}}>
        </div>
    );
}