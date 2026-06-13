import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { G, Line, Circle, Path, Text as SvgText, Rect, Polygon } from 'react-native-svg';
import { WHO_STANDARDS } from '@/constants/whoGrowthStandards';
import { Spacing, Typography } from '@/constants/theme';

export function WHOChart({ childData, heightData = [], weightData = [], headData = [], gender, type, color, unit, isDark }) {
    const screenWidth = Dimensions.get('window').width - (Spacing.lg * 2);
    const chartHeight = 350;
    const padding = { top: 20, bottom: 50, left: 50, right: 20 };
    const width = screenWidth - padding.left - padding.right;
    const height = chartHeight - padding.top - padding.bottom;

    const [tooltip, setTooltip] = useState(null);

    // Normalize gender and type
    const genderKey = gender?.toLowerCase() === 'female' || gender?.toLowerCase() === 'girl' ? 'girls' : 'boys';
    const typeKey = type === 'head' ? 'head_circumference' : type;
    const standardData = WHO_STANDARDS[genderKey][typeKey] || [];

    // Axis Ranges
    const xMin = 0;
    const xMax = 60; // 5 years in months
    
    // Auto-calculate Y range based on standard data
    const allValues = standardData.flatMap(d => [d.p3, d.p97]);
    const yMin = Math.floor(Math.min(...allValues) * 0.9);
    const yMax = Math.ceil(Math.max(...allValues) * 1.1);

    // Scaling helpers
    const scaleX = (x) => (x / xMax) * width;
    const scaleY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Helper to get scaler and values for any type
    const getScalersForType = (t) => {
        const tKey = t === 'head' ? 'head_circumference' : t;
        const std = WHO_STANDARDS[genderKey][tKey] || [];
        const vals = std.flatMap(d => [d.p3, d.p97]);
        const min = Math.floor(Math.min(...vals) * 0.9);
        const max = Math.ceil(Math.max(...vals) * 1.1);
        return {
            scale: (val) => height - ((val - min) / (max - min)) * height,
            unit: t === 'weight' ? 'kg' : 'cm'
        };
    };

    const heightScaler = getScalersForType('height');
    const weightScaler = getScalersForType('weight');
    const headScaler = getScalersForType('head');

    // Helper to build Path string (Natural/Smooth)
    const buildPath = (points, scaler = scaleY) => {
        if (!points || points.length === 0) return "";
        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaler(p.y)}`).join(" ");
    };

    // Helper to build Shaded Area string
    const buildAreaPath = (topPoints, bottomPoints) => {
        if (!topPoints.length || !bottomPoints.length) return "";
        const top = topPoints.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(" ");
        const bottom = [...bottomPoints].reverse().map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(" ");
        return `M ${top} L ${bottom} Z`;
    };

    // Prepare curves
    const p3 = standardData.map(d => ({ x: d.month, y: d.p3 }));
    const p15 = standardData.map(d => ({ x: d.month, y: d.p15 }));
    const p50 = standardData.map(d => ({ x: d.month, y: d.p50 }));
    const p85 = standardData.map(d => ({ x: d.month, y: d.p85 }));
    const p97 = standardData.map(d => ({ x: d.month, y: d.p97 }));

    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#9AA0A6' : '#666666';
    
    // Colors for the 3 metrics
    const heightColor = '#2196F3'; // Blue
    const weightColor = '#4CAF50'; // Green
    const headColor = '#9C27B0'; // Purple

    const medianColor = '#4CAF50'; // Green
    const innerBand = isDark ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255, 193, 7, 0.1)'; // Amber
    const outerBand = isDark ? 'rgba(255, 82, 82, 0.1)' : 'rgba(255, 82, 82, 0.05)'; // Soft Red/Pink

    return (
        <View style={styles.container}>
            <Svg width={screenWidth} height={chartHeight}>
                <G x={padding.left} y={padding.top}>
                    {/* Grid Lines */}
                    {[0, 1, 2, 3, 4, 5].map(i => {
                        const tickY = yMin + (i * (yMax - yMin) / 5);
                        return (
                            <G key={`y-${i}`}>
                                <Line x1={0} y1={scaleY(tickY)} x2={width} y2={scaleY(tickY)} stroke={gridColor} strokeWidth={1} strokeDasharray="4,4" />
                                <SvgText x={-10} y={scaleY(tickY) + 4} fontSize="8" fill={textColor} textAnchor="end">{tickY.toFixed(0)}</SvgText>
                            </G>
                        );
                    })}

                    {[0, 12, 24, 36, 48, 60].map(m => (
                        <G key={`x-${m}`}>
                            <Line x1={scaleX(m)} y1={0} x2={scaleX(m)} y2={height} stroke={gridColor} strokeWidth={1} strokeDasharray="4,4" />
                            <SvgText x={scaleX(m)} y={height + 20} fontSize="8" fill={textColor} textAnchor="middle">{m}m</SvgText>
                        </G>
                    ))}

                    {/* WHO Percentile Bands */}
                    <Path d={buildAreaPath(p97, p3)} fill={outerBand} />
                    <Path d={buildAreaPath(p85, p15)} fill={innerBand} />
                    <Path d={buildPath(p50)} fill="none" stroke={medianColor} strokeWidth={1} strokeDasharray="5,5" />

                    {/* Combined Child Data (All 3 lines) */}
                    {heightData && heightData.length > 0 && (
                        <G>
                            <Path d={buildPath(heightData, heightScaler.scale)} fill="none" stroke={heightColor} strokeWidth={type === 'height' ? 3.5 : 2} strokeLinecap="round" strokeLinejoin="round" opacity={type === 'height' ? 1 : 0.6} />
                            {heightData.map((p, i) => (
                                <Circle 
                                    key={`h-${i}`} 
                                    cx={scaleX(p.x)} 
                                    cy={heightScaler.scale(p.y)} 
                                    r={type === 'height' ? 5 : 3.5} 
                                    fill={heightColor} 
                                    stroke={isDark ? '#121212' : '#FFF'} 
                                    strokeWidth={1.5}
                                    onPress={() => setTooltip({ ...p, metricType: 'height', displayY: p.y, displayScaler: heightScaler.scale })}
                                />
                            ))}
                        </G>
                    )}

                    {/* Child Weight Data */}
                    {weightData && weightData.length > 0 && (
                        <G>
                            <Path d={buildPath(weightData, weightScaler.scale)} fill="none" stroke={weightColor} strokeWidth={type === 'weight' ? 3.5 : 2} strokeLinecap="round" strokeLinejoin="round" opacity={type === 'weight' ? 1 : 0.6} />
                            {weightData.map((p, i) => (
                                <Circle 
                                    key={`w-${i}`} 
                                    cx={scaleX(p.x)} 
                                    cy={weightScaler.scale(p.y)} 
                                    r={type === 'weight' ? 5 : 3.5} 
                                    fill={weightColor} 
                                    stroke={isDark ? '#121212' : '#FFF'} 
                                    strokeWidth={1.5}
                                    onPress={() => setTooltip({ ...p, metricType: 'weight', displayY: p.y, displayScaler: weightScaler.scale })}
                                />
                            ))}
                        </G>
                    )}

                    {/* Child Head Circ. Data */}
                    {headData && headData.length > 0 && (
                        <G>
                            <Path d={buildPath(headData, headScaler.scale)} fill="none" stroke={headColor} strokeWidth={type === 'head' ? 3.5 : 2} strokeLinecap="round" strokeLinejoin="round" opacity={type === 'head' ? 1 : 0.6} />
                            {headData.map((p, i) => (
                                <Circle 
                                    key={`hc-${i}`} 
                                    cx={scaleX(p.x)} 
                                    cy={headScaler.scale(p.y)} 
                                    r={type === 'head' ? 5 : 3.5} 
                                    fill={headColor} 
                                    stroke={isDark ? '#121212' : '#FFF'} 
                                    strokeWidth={1.5}
                                    onPress={() => setTooltip({ ...p, metricType: 'head', displayY: p.y, displayScaler: headScaler.scale })}
                                />
                            ))}
                        </G>
                    )}

                    {/* Fallback Child Data (Single line if arrays are empty) */}
                    {!heightData.length && !weightData.length && !headData.length && childData && childData.length > 0 && (
                        <G>
                            <Path d={buildPath(childData, scaleY)} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                            {childData.map((p, i) => (
                                <Circle 
                                    key={i} 
                                    cx={scaleX(p.x)} 
                                    cy={scaleY(p.y)} 
                                    r={4} 
                                    fill={color} 
                                    stroke={isDark ? '#121212' : '#FFF'} 
                                    strokeWidth={2}
                                    onPress={() => setTooltip({ ...p, displayY: p.y, displayScaler: scaleY })}
                                />
                            ))}
                        </G>
                    )}

                    {/* Tooltip Overlay */}
                    {tooltip && (
                        <G>
                            <Rect 
                                x={scaleX(tooltip.x) - 45} 
                                y={(tooltip.displayScaler ? tooltip.displayScaler(tooltip.displayY) : scaleY(tooltip.displayY || tooltip.y)) - 45} 
                                width={90} 
                                height={35} 
                                rx={8} 
                                fill={isDark ? '#333' : '#FFF'} 
                                stroke={tooltip.metricType === 'weight' ? weightColor : tooltip.metricType === 'height' ? heightColor : tooltip.metricType === 'head' ? headColor : color} 
                                strokeWidth={1.5}
                            />
                            <SvgText 
                                x={scaleX(tooltip.x)} 
                                y={(tooltip.displayScaler ? tooltip.displayScaler(tooltip.displayY) : scaleY(tooltip.displayY || tooltip.y)) - 30} 
                                fontSize="10" 
                                fontWeight="bold" 
                                fill={isDark ? '#FFF' : '#333'} 
                                textAnchor="middle"
                            >
                                {tooltip.displayY || tooltip.y} {tooltip.metricType === 'weight' ? 'kg' : 'cm'}
                            </SvgText>
                            <SvgText 
                                x={scaleX(tooltip.x)} 
                                y={(tooltip.displayScaler ? tooltip.displayScaler(tooltip.displayY) : scaleY(tooltip.displayY || tooltip.y)) - 20} 
                                fontSize="8" 
                                fill={textColor} 
                                textAnchor="middle"
                            >
                                {tooltip.x} months
                            </SvgText>
                            <Circle 
                                cx={scaleX(tooltip.x)} 
                                cy={tooltip.displayScaler ? tooltip.displayScaler(tooltip.displayY) : scaleY(tooltip.displayY || tooltip.y)} 
                                r={12} 
                                fill="transparent" 
                                onPress={() => setTooltip(null)} 
                            />
                        </G>
                    )}
                </G>
            </Svg>

            {/* Legend */}
            <View style={[styles.legendContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendIndicator, { backgroundColor: heightColor, height: 3, borderRadius: 2 }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>Height (cm)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendIndicator, { backgroundColor: weightColor, height: 3, borderRadius: 2 }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>Weight (kg)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendIndicator, { backgroundColor: headColor, height: 3, borderRadius: 2 }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>Head Circ (cm)</Text>
                    </View>
                </View>
                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendIndicator, { borderBottomWidth: 1.5, borderColor: medianColor, borderStyle: 'dashed', backgroundColor: 'transparent' }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>WHO Median (50th)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendIndicator, { backgroundColor: innerBand, opacity: 1, borderWidth: 1, borderColor: 'rgba(255, 193, 7, 0.3)' }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>Normal (15th-85th)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendIndicator, { backgroundColor: outerBand, opacity: 1, borderWidth: 1, borderColor: 'rgba(255, 82, 82, 0.3)' }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>Edge (3rd-97th)</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    legendContainer: {
        width: '100%',
        padding: Spacing.md,
        borderRadius: 12,
        marginTop: Spacing.md,
        gap: Spacing.sm,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendIndicator: {
        width: 14,
        height: 10,
        borderRadius: 2,
    },
    legendText: {
        fontSize: 10,
        fontWeight: '500',
    },
});
