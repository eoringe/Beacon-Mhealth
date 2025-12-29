import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G, Polyline } from 'react-native-svg';

export function GrowthLineChart({ data, width, height, color, label, unit, isDark }) {
    const padding = { top: 30, bottom: 50, left: 50, right: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find min and max values
    const xValues = data.map(d => d.x);
    const yValues = data.map(d => d.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    // Add padding to y-axis range
    let yPadding = (yMax - yMin) * 0.1;
    if (yPadding === 0) yPadding = yMax * 0.1 || 10; // Default padding if flat line
    const yRangeMin = Math.max(0, yMin - yPadding);
    const yRangeMax = yMax + yPadding;

    // Scale functions
    const scaleX = (x) => {
        if (xMax === xMin) return chartWidth / 2; // Center if single point
        return ((x - xMin) / (xMax - xMin)) * chartWidth;
    };
    const scaleY = (y) => {
        if (yRangeMax === yRangeMin) return chartHeight / 2;
        return chartHeight - ((y - yRangeMin) / (yRangeMax - yRangeMin)) * chartHeight;
    };

    // Generate points for polyline
    const points = data.map(d => `${scaleX(d.x)},${scaleY(d.y)}`).join(' ');

    // Generate y-axis ticks
    const yTicks = 5;
    const yTickStep = (yRangeMax - yRangeMin) / yTicks;
    const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => yRangeMin + i * yTickStep);

    // Generate x-axis ticks
    const xTicks = Math.min(6, data.length);
    const xTickStep = Math.floor(data.length / xTicks);
    const xTickData = data.filter((_, i) => i % xTickStep === 0 || i === data.length - 1);

    const gridColor = isDark ? '#2D333B' : '#E5E5E5';
    const textColor = isDark ? '#9AA0A6' : '#666666';

    return (
        <View style={styles.container}>
            <Svg width={width} height={height}>
                <G x={padding.left} y={padding.top}>
                    {/* Grid lines */}
                    {yTickValues.map((tick, i) => (
                        <Line
                            key={`grid-${i}`}
                            x1={0}
                            y1={scaleY(tick)}
                            x2={chartWidth}
                            y2={scaleY(tick)}
                            stroke={gridColor}
                            strokeWidth="1"
                            strokeDasharray="4,4"
                        />
                    ))}

                    {/* Y-axis */}
                    <Line x1={0} y1={0} x2={0} y2={chartHeight} stroke={gridColor} strokeWidth="2" />

                    {/* X-axis */}
                    <Line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke={gridColor} strokeWidth="2" />

                    {/* Y-axis labels */}
                    {yTickValues.map((tick, i) => (
                        <SvgText
                            key={`y-label-${i}`}
                            x={-10}
                            y={scaleY(tick) + 4}
                            fontSize="11"
                            fill={textColor}
                            textAnchor="end"
                        >
                            {tick.toFixed(1)}
                        </SvgText>
                    ))}

                    {/* X-axis labels */}
                    {xTickData.map((d, i) => (
                        <SvgText
                            key={`x-label-${i}`}
                            x={scaleX(d.x)}
                            y={chartHeight + 20}
                            fontSize="11"
                            fill={textColor}
                            textAnchor="middle"
                        >
                            {d.x}
                        </SvgText>
                    ))}

                    {/* Data line */}
                    <Polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                    />

                    {/* Data points */}
                    {data.map((d, i) => (
                        <Circle
                            key={`point-${i}`}
                            cx={scaleX(d.x)}
                            cy={scaleY(d.y)}
                            r="4"
                            fill={color}
                        />
                    ))}

                    {/* Axis labels */}
                    <SvgText
                        x={chartWidth / 2}
                        y={chartHeight + 40}
                        fontSize="12"
                        fill={textColor}
                        textAnchor="middle"
                        fontWeight="500"
                    >
                        Age (months)
                    </SvgText>

                    <SvgText
                        x={-chartHeight / 2}
                        y={-35}
                        fontSize="12"
                        fill={textColor}
                        textAnchor="middle"
                        fontWeight="500"
                        rotation="-90"
                        origin={`0,${chartHeight / 2}`}
                    >
                        {label}
                    </SvgText>
                </G>
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
