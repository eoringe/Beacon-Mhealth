import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export default function GrowthChartScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();

    const [selectedTab, setSelectedTab] = useState('height');

    // Sample data
    const heightData = [
        { x: 0, y: 50 },
        { x: 2, y: 58 },
        { x: 4, y: 64 },
        { x: 6, y: 68 },
        { x: 9, y: 72 },
        { x: 12, y: 76 },
        { x: 15, y: 78 },
        { x: 18, y: 82 },
    ];

    const weightData = [
        { x: 0, y: 3.5 },
        { x: 2, y: 5.5 },
        { x: 4, y: 6.8 },
        { x: 6, y: 7.9 },
        { x: 9, y: 9.2 },
        { x: 12, y: 10.2 },
        { x: 15, y: 10.8 },
        { x: 18, y: 11.5 },
    ];

    const headCircData = [
        { x: 0, y: 35 },
        { x: 2, y: 39 },
        { x: 4, y: 42 },
        { x: 6, y: 44 },
        { x: 9, y: 45 },
        { x: 12, y: 46 },
        { x: 15, y: 46.5 },
        { x: 18, y: 47 },
    ];

    const tabs = [
        { id: 'height', label: 'Height', icon: 'height', color: colorScheme.chartHeight },
        { id: 'weight', label: 'Weight', icon: 'monitor-weight', color: colorScheme.chartWeight },
        { id: 'head', label: 'Head Circ.', icon: 'face', color: colorScheme.chartHeadCirc },
    ];

    const getCurrentData = () => {
        if (selectedTab === 'height') return heightData;
        if (selectedTab === 'weight') return weightData;
        return headCircData;
    };

    const getCurrentLabel = () => {
        if (selectedTab === 'height') return 'Height (cm)';
        if (selectedTab === 'weight') return 'Weight (kg)';
        return 'Head Circumference (cm)';
    };

    const getCurrentColor = () => {
        if (selectedTab === 'height') return colorScheme.chartHeight;
        if (selectedTab === 'weight') return colorScheme.chartWeight;
        return colorScheme.chartHeadCirc;
    };

    const latestMeasurement = getCurrentData()[getCurrentData().length - 1];

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Growth Chart"
                showBack={true}
                rightComponent={
                    <TouchableOpacity onPress={() => router.push('/growth-chart/add-measurement')}>
                        <MaterialIcons name="add" size={24} color={colorScheme.primary} />
                    </TouchableOpacity>
                }
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tab,
                                {
                                    backgroundColor: selectedTab === tab.id ? tab.color : colorScheme.surface,
                                    borderColor: selectedTab === tab.id ? tab.color : colorScheme.border,
                                },
                            ]}
                            onPress={() => setSelectedTab(tab.id)}
                        >
                            <MaterialIcons
                                name={tab.icon}
                                size={24}
                                color={selectedTab === tab.id ? '#FFFFFF' : colorScheme.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    {
                                        color: selectedTab === tab.id ? '#FFFFFF' : colorScheme.textPrimary,
                                    },
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Latest Measurement Card */}
                <View style={[styles.latestCard, { backgroundColor: colorScheme.surface }]}>
                    <Text style={[styles.latestLabel, { color: colorScheme.textSecondary }]}>
                        Latest {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
                    </Text>
                    <Text style={[styles.latestValue, { color: getCurrentColor() }]}>
                        {latestMeasurement.y} {selectedTab === 'weight' ? 'kg' : 'cm'}
                    </Text>
                    <Text style={[styles.latestDate, { color: colorScheme.textTertiary }]}>
                        At {latestMeasurement.x} months
                    </Text>
                </View>

                {/* Chart Placeholder */}
                <View style={[styles.chartCard, { backgroundColor: colorScheme.surface }]}>
                    <Text style={[styles.chartTitle, { color: colorScheme.textPrimary }]}>
                        {getCurrentLabel()} Over Time
                    </Text>

                    <View style={[styles.chartPlaceholder, { borderColor: colorScheme.border }]}>
                        <MaterialIcons name="show-chart" size={64} color={colorScheme.textTertiary} />
                        <Text style={[styles.placeholderText, { color: colorScheme.textSecondary }]}>
                            Chart visualization coming soon
                        </Text>
                        <Text style={[styles.placeholderSubtext, { color: colorScheme.textTertiary }]}>
                            Track your child's growth over time
                        </Text>
                    </View>
                </View>

                {/* Measurement History */}
                <View style={styles.historySection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                            Measurement History
                        </Text>
                    </View>

                    {getCurrentData().slice().reverse().map((measurement, index) => {
                        const currentTab = tabs.find(t => t.id === selectedTab);
                        return (
                            <View
                                key={index}
                                style={[styles.historyItem, { backgroundColor: colorScheme.surface }]}
                            >
                                <View style={[styles.historyIconContainer, { backgroundColor: `${getCurrentColor()}20` }]}>
                                    <MaterialIcons
                                        name={currentTab?.icon || 'height'}
                                        size={20}
                                        color={getCurrentColor()}
                                    />
                                </View>

                                <View style={styles.historyContent}>
                                    <Text style={[styles.historyValue, { color: colorScheme.textPrimary }]}>
                                        {measurement.y} {selectedTab === 'weight' ? 'kg' : 'cm'}
                                    </Text>
                                    <Text style={[styles.historyDate, { color: colorScheme.textSecondary }]}>
                                        At {measurement.x} months old
                                    </Text>
                                </View>

                                <TouchableOpacity>
                                    <MaterialIcons name="more-vert" size={20} color={colorScheme.textTertiary} />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    tabText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    latestCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        ...Shadow.md,
    },
    latestLabel: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.xs,
    },
    latestValue: {
        fontSize: 36,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.xs,
    },
    latestDate: {
        fontSize: Typography.fontSize.xs,
    },
    chartCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        ...Shadow.md,
    },
    chartTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
    chartPlaceholder: {
        height: 300,
        borderWidth: 2,
        borderRadius: BorderRadius.md,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    placeholderText: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
    },
    placeholderSubtext: {
        fontSize: Typography.fontSize.sm,
    },
    historySection: {
        paddingHorizontal: Spacing.lg,
    },
    sectionHeader: {
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
        gap: Spacing.md,
        ...Shadow.sm,
    },
    historyIconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyContent: {
        flex: 1,
    },
    historyValue: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
    historyDate: {
        fontSize: Typography.fontSize.sm,
        marginTop: 2,
    },
});
