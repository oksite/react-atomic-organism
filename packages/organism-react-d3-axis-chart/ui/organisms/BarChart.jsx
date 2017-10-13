import React from 'react'; 
import { SemanticUI } from 'react-atomic-molecule';
import get from 'get-object-value';

import BaseChart from '../molecules/BaseChart';
import Rect from '../molecules/Rect';

const BarChart = (props) => {
    const {
        data,
        color
    } = props; 
    return (
        <BaseChart  {...props} data={[data]}>
            {(baseChart) => {
                return (
                <SemanticUI key="barchart" atom="g" className="data-group">
                {
                    get(data,['value']).map((d, k)=>{
                        const {
                            xScale,
                            yScale,
                            xValueLocator,
                            yValueLocator,
                            scaleH
                        } = baseChart;
                        const x = xScale.scaler(xValueLocator(d));
                        const y = yScale.scaler(yValueLocator(d));
                        return (
                            <Rect
                                key={k}
                                x={x}
                                y={y}
                                width={xScale.length}
                                height={scaleH - y}
                                fill={color}
                            />
                        );
                    })
                }
                </SemanticUI>
                );
            }}
        </BaseChart>
    );
}

BarChart.defaultProps = {
    data: [],
    color: '#4682B4',
};

export default BarChart;
