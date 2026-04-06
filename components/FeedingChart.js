import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, G, Line, Text as SvgText } from 'react-native-svg';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export function FeedingChart({ data, themeColors }) {
    const screenWidth = Dimensions.get('window').width - (Spacing.lg * 2) - (Spacing.md * 2);
    const chartHeight = 220;
    const padding = { top: 20, bottom: 30, left: 30, right: 10 };
    const width = screenWidth - padding.left - padding.right;
    const height = chartHeight - padding.top - padding.bottom;

    // Colors
    const breastColor = '#E91E63'; // Pink
    const bottleColor = '#2196F3'; // Blue
    const solidColor = '#4CAF50';  // Green
    const gridColor = themeColors.border;
    const textColor = themeColors.textTertiary;

    // Max count for Y scaling
    const maxTotal = Math.max(...data.map(d => d.total), 8); // At least 8 feeds
    const maxY = Math.ceil(maxTotal / 2) * 2; // Round up to nearest 2

    const barWidth = (width / data.length) * 0.6;
    const barSpacing = (width / data.length) * 0.4;

    const scaleY = (val) => (val / maxY) * height;

    return (
        <View style={[styles.container, { backgroundColor: themeColors.surface }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: themeColors.textPrimary }]}>7-Day Intake</Text>
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: breastColor }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>Breast</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: bottleColor }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>Bottle</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: solidColor }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>Solids</Text>
                    </View>
                </View>
            </View>

            <Svg width={screenWidth} height={chartHeight}>
                <G x={padding.left} y={padding.top}>
                    {/* Y Grid & Labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                        const val = maxY * pct;
                        const y = height - scaleY(val);
                        return (
                            <G key={`y-${i}`}>
                                <Line x1={0} y1={y} x2={width} y2={y} stroke={gridColor} strokeWidth={1} strokeDasharray="4,4" />
                                <SvgText x={-5} y={y + 4} fontSize="10" fill={textColor} textAnchor="end">
                                    {Math.round(val)}
                                </SvgText>
                            </G>
                        );
                    })}

                    {/* Bars */}
                    {data.map((day, i) => {
                        const x = i * (barWidth + barSpacing) + (barSpacing / 2);
                        const breastH = scaleY(day.breast);
                        const bottleH = scaleY(day.bottle);
                        const solidH = scaleY(day.solid);
                        
                        return (
                            <G key={`bar-${i}`}>
                                {/* Breast (Bottom) */}
                                <Rect
                                    x={x}
                                    y={height - breastH}
                                    width={barWidth}
                                    height={breastH}
                                    fill={breastColor}
                                    rx={2}
                                />
                                {/* Bottle (Middle) */}
                                <Rect
                                    x={x}
                                    y={height - breastH - bottleH}
                                    width={barWidth}
                                    height={bottleH}
                                    fill={bottleColor}
                                    rx={2}
                                />
                                {/* Solid (Top) */}
                                <Rect
                                    x={x}
                                    y={height - breastH - bottleH - solidH}
                                    width={barWidth}
                                    height={solidH}
                                    fill={solidColor}
                                    rx={2}
                                />
                                {/* X Label */}
                                <SvgText
                                    x={x + barWidth / 2}
                                    y={height + 20}
                                    fontSize="10"
                                    fill={themeColors.textSecondary}
                                    textAnchor="middle"
                                >
                                    {day.label}
                                </SvgText>
                            </G>
                        );
                    })}
                </G>
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        ...Shadow.sm,
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    legend: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 9,
    },
});
