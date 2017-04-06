import React from 'react'; 
import {
    SemanticUI
} from 'react-atomic-molecule';

import Axis from '../organisms/Axis';

const YAxis = ({length, ...props}) =>
{
    return (
        <Axis
            path={`M-1,0H0V${length}H-1`}
            x="0"
            textAttr={{
                dy: '.32em',
                x: -9,
                style: {
                    textAnchor: 'end' 
                }
            }}
            lineAttr={{
                x2: -6,
                y2: 0
            }}
            {...props}
        />
    );
}

export default YAxis;
