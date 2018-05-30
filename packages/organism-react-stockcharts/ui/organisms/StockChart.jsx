import React, {PureComponent} from 'react';
import { MultiChart, MultiCandlestick} from 'organism-react-d3-axis-chart';
import get from 'get-object-value';
import {lazyInject} from 'react-atomic-molecule';

import KChart from '../organisms/KChart';
import VolumeChart from '../organisms/VolumeChart';

class StockChart extends PureComponent
{
    state = {};
    static defaultProps = { 
        scaleW: 500,
        scaleH: 500,
        tradeRowsLocator: d => d.trades,
        tradeHighLocator: d => d.h,
        tradeLowLocator: d => d.l,
        tradeOpenLocator: d => d.o,
        tradeCloseLocator: d => d.c,
        tradeVolumeLocator: d => d.v,
        tradeDateLocator: d => d.t,
        kChartLinesLocator: d => d.lines,
        kChartAreasLocator: d => d.areas,
        defaultAttrs: {
            close: {
                stroke: '#9ecae1',
            },
            short: {
                stroke: '#1947a3',
            },
            long: {
                stroke: '#f56f0a',
            },
            quarter: {
                stroke: '#ce6dbd',
            },
            bbands1: {
                fill: '#f06292'
            },
            bbands2: {
            },
        }
    };

    constructor(props)
    {
        super(props);
        injects = lazyInject( injects, InjectStyles );
    }

    render()
    {
        const {
            data,
            scaleW,
            scaleH,
            threshold,
            hideAxis,
            tradeRowsLocator,
            tradeHighLocator,
            tradeLowLocator,
            tradeOpenLocator,
            tradeCloseLocator,
            tradeVolumeLocator,
            tradeDateLocator,
            kChartLinesLocator,
            kChartAreasLocator,
            ...props
        } = this.props;
        return (
        <MultiChart
            scaleW={scaleW}
            scaleH={scaleH}
            className="stock-chart"
            //  Init XAxis
            data={tradeRowsLocator(data)}
            valuesLocator={d => d}
            xValueLocator={tradeDateLocator}
        >
           <KChart 
                data={{
                    lines: kChartLinesLocator(data),
                    areas: kChartAreasLocator(data)
                }}
                linesLocator={d=>d.lines}
                linesValuesLocator={d=>d.values}
                xValueLocator={d=>d.x}
                yValueLocator={d=>d.y}
                areasLocator={d=>d.areas}
                areasValuesLocator={d=>d.values}
                areaY0Locator={d=>d.upper}
                areaY1Locator={d=>d.lower}
           > 
            <MultiCandlestick
                data={data}
                xValueLocator={tradeDateLocator}
                valuesLocator={tradeRowsLocator}
                tradeHighLocator={tradeHighLocator}
                tradeLowLocator={tradeLowLocator}
                tradeOpenLocator={tradeOpenLocator}
                tradeCloseLocator={tradeCloseLocator}
            />
           </KChart>
           <VolumeChart
                data={tradeRowsLocator(data)}
                xValueLocator={tradeDateLocator} 
                yValueLocator={tradeVolumeLocator}
                valuesLocator={d => d}
           />
        </MultiChart>
        );
    }
}

export default StockChart;

let injects;
const InjectStyles = {
    negativeRect: [
        {
            fill: '#a3c293'
        },
        '.stock-chart rect.negative'
    ],
    negativeLine: [
        {
            stroke: '#a3c293'
        },
        '.stock-chart line.negative'
    ],
    positiveRect: [ 
        {
            fill: '#9f3a38'
        },
        '.stock-chart rect.positive'
    ],
    positiveLine: [ 
        {
            stroke: '#9f3a38'
        },
        '.stock-chart line.positive'
    ]
};
