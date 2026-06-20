import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Line, Circle, Path, Text as SvgText, Rect } from 'react-native-svg';
import { WHO_STANDARDS } from '@/constants/whoGrowthStandards';
import { Spacing } from '@/constants/theme';

export function WHOChart({ childData, heightData = [], weightData = [], headData = [], gender, type, color, unit, isDark }) {
    const screenWidth = Dimensions.get('window').width - (Spacing.lg * 2);
    const chartHeight = 350;
    const padding = { top: 20, bottom: 50, left: 50, right: 30 };
    const width = screenWidth - padding.left - padding.right;
    const height = chartHeight - padding.top - padding.bottom;

    const [tooltip, setTooltip] = useState(null);

    // Normalize gender and type
    const genderKey = gender?.toLowerCase() === 'female' || gender?.toLowerCase() === 'girl' ? 'girls' : 'boys';
    const typeKey = type === 'head' ? 'head_circumference' : type;
    const standardData = WHO_STANDARDS[genderKey][typeKey] || [];

    // Axis Ranges
    const xMax = 60; // 5 years in months

    // Extrapolate Z-scores -3 and +3
    const z3Values = standardData.map(d => d.p97 + (d.p97 - d.p85));
    const z_3Values = standardData.map(d => d.p3 - (d.p15 - d.p3));

    // Auto-calculate Y range based on standard data
    const yMin = Math.floor(Math.min(...z_3Values) * 0.95);
    const yMax = Math.ceil(Math.max(...z3Values) * 1.05);

    // Scaling helpers
    const scaleX = (x) => (x / xMax) * width;
    const scaleY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;



    // Helper to build Path string (Natural/Smooth)
    const buildPath = (points, scaler = scaleY) => {
        if (!points || points.length === 0) return "";
        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaler(p.y)}`).join(" ");
    };

    // Prepare curves
    const z3 = standardData.map(d => ({ x: d.month, y: d.p97 + (d.p97 - d.p85) }));
    const z2 = standardData.map(d => ({ x: d.month, y: d.p97 }));
    const z1 = standardData.map(d => ({ x: d.month, y: d.p85 }));
    const z0 = standardData.map(d => ({ x: d.month, y: d.p50 }));
    const z_1 = standardData.map(d => ({ x: d.month, y: d.p15 }));
    const z_2 = standardData.map(d => ({ x: d.month, y: d.p3 }));
    const z_3 = standardData.map(d => ({ x: d.month, y: d.p3 - (d.p15 - d.p3) }));

    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#9AA0A6' : '#666666';
    
    // Colors for the 3 metrics
    const heightColor = '#2196F3'; // Blue
    const weightColor = '#4CAF50'; // Green
    const headColor = '#9C27B0'; // Purple



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

                    {/* WHO Z-score Standard Lines */}
                    <Path d={buildPath(z3)} fill="none" stroke={isDark ? '#555' : '#777'} strokeWidth={1.2} />
                    <Path d={buildPath(z2)} fill="none" stroke="#EF4444" strokeWidth={1.2} />
                    <Path d={buildPath(z1)} fill="none" stroke="#F59E0B" strokeWidth={1.2} />
                    <Path d={buildPath(z0)} fill="none" stroke="#10B981" strokeWidth={1.8} />
                    <Path d={buildPath(z_1)} fill="none" stroke="#F59E0B" strokeWidth={1.2} />
                    <Path d={buildPath(z_2)} fill="none" stroke="#EF4444" strokeWidth={1.2} />
                    <Path d={buildPath(z_3)} fill="none" stroke={isDark ? '#555' : '#777'} strokeWidth={1.2} />

                    {/* Labels at the end of the curves (on the right) */}
                    {z3.length > 0 && (
                        <G>
                            <SvgText x={width + 5} y={scaleY(z3[z3.length - 1].y) + 3} fontSize="9" fontWeight="bold" fill={isDark ? '#FFF' : '#333'}>3</SvgText>
                            <SvgText x={width + 5} y={scaleY(z2[z2.length - 1].y) + 3} fontSize="9" fontWeight="bold" fill="#EF4444">2</SvgText>
                            <SvgText x={width + 5} y={scaleY(z1[z1.length - 1].y) + 3} fontSize="9" fontWeight="bold" fill="#F59E0B">1</SvgText>
                            <SvgText x={width + 5} y={scaleY(z0[z0.length - 1].y) + 3} fontSize="10" fontWeight="bold" fill="#10B981">0</SvgText>
                            <SvgText x={width + 5} y={scaleY(z_1[z_1.length - 1].y) + 3} fontSize="9" fontWeight="bold" fill="#F59E0B">-1</SvgText>
                            <SvgText x={width + 5} y={scaleY(z_2[z_2.length - 1].y) + 3} fontSize="9" fontWeight="bold" fill="#EF4444">-2</SvgText>
                            <SvgText x={width + 5} y={scaleY(z_3[z_3.length - 1].y) + 3} fontSize="9" fontWeight="bold" fill={isDark ? '#FFF' : '#333'}>-3</SvgText>
                        </G>
                    )}

                    {/* Combined Child Data (All 3 lines) */}
                    {type === 'height' && heightData && heightData.length > 0 && (
                        <G>
                            <Path d={buildPath(heightData, scaleY)} fill="none" stroke={heightColor} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
                            {heightData.map((p, i) => (
                                <Circle 
                                    key={`h-${i}`} 
                                    cx={scaleX(p.x)} 
                                    cy={scaleY(p.y)} 
                                    r={5} 
                                    fill={heightColor} 
                                    stroke={isDark ? '#121212' : '#FFF'} 
                                    strokeWidth={1.5}
                                    onPress={() => setTooltip({ ...p, metricType: 'height', displayY: p.y, displayScaler: scaleY })}
                                />
                            ))}
                        </G>
                    )}

                    {/* Child Weight Data */}
                    {type === 'weight' && weightData && weightData.length > 0 && (
                        <G>
                            <Path d={buildPath(weightData, scaleY)} fill="none" stroke={weightColor} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
                            {weightData.map((p, i) => (
                                <Circle 
                                    key={`w-${i}`} 
                                    cx={scaleX(p.x)} 
                                    cy={scaleY(p.y)} 
                                    r={5} 
                                    fill={weightColor} 
                                    stroke={isDark ? '#121212' : '#FFF'} 
                                    strokeWidth={1.5}
                                    onPress={() => setTooltip({ ...p, metricType: 'weight', displayY: p.y, displayScaler: scaleY })}
                                />
                            ))}
                        </G>
                    )}

                    {/* Child Head Circ. Data */}
                    {type === 'head' && headData && headData.length > 0 && (
                        <G>
                            <Path d={buildPath(headData, scaleY)} fill="none" stroke={headColor} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
                            {headData.map((p, i) => (
                                <Circle 
                                    key={`hc-${i}`} 
                                    cx={scaleX(p.x)} 
                                    cy={scaleY(p.y)} 
                                    r={5} 
                                    fill={headColor} 
                                    stroke={isDark ? '#121212' : '#FFF'} 
                                    strokeWidth={1.5}
                                    onPress={() => setTooltip({ ...p, metricType: 'head', displayY: p.y, displayScaler: scaleY })}
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
                    {type === 'height' && (
                        <View style={styles.legendItem}>
                            <View style={[styles.legendIndicator, { backgroundColor: heightColor, height: 3, borderRadius: 2 }]} />
                            <Text style={[styles.legendText, { color: textColor }]}>Height (cm)</Text>
                        </View>
                    )}
                    {type === 'weight' && (
                        <View style={styles.legendItem}>
                            <View style={[styles.legendIndicator, { backgroundColor: weightColor, height: 3, borderRadius: 2 }]} />
                            <Text style={[styles.legendText, { color: textColor }]}>Weight (kg)</Text>
                        </View>
                    )}
                    {type === 'head' && (
                        <View style={styles.legendItem}>
                            <View style={[styles.legendIndicator, { backgroundColor: headColor, height: 3, borderRadius: 2 }]} />
                            <Text style={[styles.legendText, { color: textColor }]}>Head Circ (cm)</Text>
                        </View>
                    )}
                </View>
                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendIndicator, { backgroundColor: '#10B981', height: 3, borderRadius: 2 }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>Median (0)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendIndicator, { backgroundColor: '#F59E0B', height: 3, borderRadius: 2 }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>±1 Z-score</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendIndicator, { backgroundColor: '#EF4444', height: 3, borderRadius: 2 }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>±2 Z-score</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendIndicator, { backgroundColor: isDark ? '#FFF' : '#333', height: 3, borderRadius: 2 }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>±3 Z-score</Text>
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
