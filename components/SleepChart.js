import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, G, Line, Text as SvgText } from 'react-native-svg';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export function SleepChart({ data, themeColors }) {
    const screenWidth = Dimensions.get('window').width - (Spacing.lg * 2) - (Spacing.md * 2);
    const chartHeight = 220;
    const padding = { top: 20, bottom: 30, left: 30, right: 10 };
    const width = screenWidth - padding.left - padding.right;
    const height = chartHeight - padding.top - padding.bottom;

    // Colors
    const napColor = '#FF9800';
    const nightColor = '#5C6BC0';
    const gridColor = themeColors.border;
    const textColor = themeColors.textTertiary;

    // Max hours for Y scaling
    const maxTotalMinutes = Math.max(...data.map(d => d.total), 720); // At least 12 hours
    const maxY = Math.ceil(maxTotalMinutes / 60 / 2) * 2 * 60; // Round up to nearest 2 hours

    const barWidth = (width / data.length) * 0.6;
    const barSpacing = (width / data.length) * 0.4;

    const scaleY = (mins) => (mins / maxY) * height;

    return (
        <View style={[styles.container, { backgroundColor: themeColors.surface }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: themeColors.textPrimary }]}>Last 7 Days</Text>
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: nightColor }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>Night</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: napColor }]} />
                        <Text style={[styles.legendText, { color: textColor }]}>Nap</Text>
                    </View>
                </View>
            </View>

            <Svg width={screenWidth} height={chartHeight}>
                <G x={padding.left} y={padding.top}>
                    {/* Y Grid & Labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                        const mins = maxY * pct;
                        const y = height - scaleY(mins);
                        return (
                            <G key={`y-${i}`}>
                                <Line x1={0} y1={y} x2={width} y2={y} stroke={gridColor} strokeWidth={1} strokeDasharray="4,4" />
                                <SvgText x={-5} y={y + 4} fontSize="10" fill={textColor} textAnchor="end">
                                    {Math.round(mins / 60)}h
                                </SvgText>
                            </G>
                        );
                    })}

                    {/* Bars */}
                    {data.map((day, i) => {
                        const x = i * (barWidth + barSpacing) + (barSpacing / 2);
                        const nightH = scaleY(day.night);
                        const napH = scaleY(day.nap);
                        
                        return (
                            <G key={`bar-${i}`}>
                                {/* Night Sleep (Bottom) */}
                                <Rect
                                    x={x}
                                    y={height - nightH}
                                    width={barWidth}
                                    height={nightH}
                                    fill={nightColor}
                                    rx={4}
                                />
                                {/* Nap Sleep (Top) */}
                                <Rect
                                    x={x}
                                    y={height - nightH - napH}
                                    width={barWidth}
                                    height={napH}
                                    fill={napColor}
                                    rx={napH > 2 ? 4 : 0} // Only round if tall enough
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
        gap: Spacing.md,
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
        fontSize: 10,
    },
});
