import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { useAlert } from '@/contexts/AlertContext';
import { SafeHeader } from '@/components/SafeHeader';
import { LoadingScreen } from '@/components/LoadingComponents';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { GrowthLineChart } from '@/components/GrowthLineChart';
import growthService from '@/services/growthService';
import { childService } from '@/services/childService';

export default function GrowthChartScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { childId } = useLocalSearchParams();
    const { colorScheme, isDark } = useTheme();
    const { selectedChild } = useChild();
    const { showAlert } = useAlert();

    const [selectedTab, setSelectedTab] = useState('height');
    const [loading, setLoading] = useState(true);
    const [measurements, setMeasurements] = useState([]);
    const [child, setChild] = useState(null);

    const fetchData = async () => {
        if (!childId) return;
        setLoading(true);
        try {
            // Fetch child details to get DOB
            const children = await childService.getChildren();
            const currentChild = children.find(c => c.id === childId);
            setChild(currentChild);

            // Fetch measurements
            const data = await growthService.getMeasurements(childId);
            setMeasurements(data);
        } catch (error) {
            console.error('Error fetching growth data:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [childId])
    );

    const calculateAgeInMonths = (birthDate, recordDate) => {
        if (!birthDate || !recordDate) return 0;
        const dob = new Date(birthDate);
        const record = new Date(recordDate);
        const months = (record.getFullYear() - dob.getFullYear()) * 12 + (record.getMonth() - dob.getMonth());
        return Math.max(0, months); // Ensure non-negative
    };

    const processData = (type) => {
        if (!child || !measurements.length) return [];

        return measurements
            .filter(m => m[type] !== null && m[type] !== undefined)
            .map(m => ({
                x: calculateAgeInMonths(child.date_of_birth, m.recorded_date),
                y: parseFloat(m[type]),
                date: m.recorded_date,
                id: m.id
            }))
            .sort((a, b) => a.x - b.x);
    };

    const heightData = processData('height');
    const weightData = processData('weight');
    const headCircData = processData('head_circumference');

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

    const currentData = getCurrentData();
    const latestMeasurement = currentData.length > 0 ? currentData[currentData.length - 1] : null;

    if (loading) {
        return <LoadingScreen text="Loading growth data..." />;
    }

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Growth Chart"
                showBack={true}
                rightComponent={
                    <TouchableOpacity onPress={() => router.push({ pathname: '/growth-chart/add-measurement', params: { childId } })}>
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
                {latestMeasurement ? (
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
                ) : (
                    <View style={[styles.latestCard, { backgroundColor: colorScheme.surface }]}>
                        <Text style={[styles.latestLabel, { color: colorScheme.textSecondary }]}>
                            No data available
                        </Text>
                        <Text style={[styles.latestDate, { color: colorScheme.textTertiary }]}>
                            Add a measurement to see growth data
                        </Text>
                    </View>
                )}

                {/* Chart */}
                {currentData.length > 0 && (
                    <View style={[styles.chartCard, { backgroundColor: colorScheme.surface }]}>
                        <Text style={[styles.chartTitle, { color: colorScheme.textPrimary }]}>
                            {getCurrentLabel()} Over Time
                        </Text>

                        <View style={styles.chartContainer}>
                            <GrowthLineChart
                                data={currentData}
                                width={Dimensions.get('window').width - (Spacing.lg * 2)}
                                height={300}
                                color={getCurrentColor()}
                                label={getCurrentLabel()}
                                unit={selectedTab === 'weight' ? 'kg' : 'cm'}
                                isDark={isDark}
                            />
                        </View>
                    </View>
                )}

                {/* Measurement History */}
                <View style={styles.historySection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                            Measurement History
                        </Text>
                    </View>

                    {currentData.length === 0 ? (
                        <Text style={{ color: colorScheme.textSecondary, textAlign: 'center', marginTop: Spacing.lg }}>
                            No measurements recorded yet.
                        </Text>
                    ) : (
                        currentData.slice().reverse().map((measurement, index) => {
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
                                            At {measurement.x} months old ({new Date(measurement.date).toLocaleDateString()})
                                        </Text>
                                    </View>

                                    {/* <TouchableOpacity>
                                        <MaterialIcons name="more-vert" size={20} color={colorScheme.textTertiary} />
                                    </TouchableOpacity> */}
                                </View>
                            );
                        })
                    )}
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
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
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
