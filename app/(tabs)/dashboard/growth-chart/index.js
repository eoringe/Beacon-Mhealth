import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import * as WebBrowser from 'expo-web-browser';
import { useChild } from '@/contexts/ChildContext';
import { useAlert } from '@/contexts/AlertContext';
import { SafeHeader } from '@/components/SafeHeader';
import { LoadingScreen } from '@/components/LoadingComponents';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { WHOChart } from '@/components/WHOChart';
import growthService from '@/services/growthService';
import { childService } from '@/services/childService';
import { getGrowthInterpretation } from '@/utils/growthHelpers';

export default function GrowthChartScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { childId } = useLocalSearchParams();
    const { colorScheme, isDark } = useTheme();
    const { selectedChild } = useChild();
    const { showAlert } = useAlert();

    const [selectedTab, setSelectedTab] = useState('height');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [measurements, setMeasurements] = useState([]);
    const [child, setChild] = useState(null);

    const activeChildId = childId || selectedChild?.id;

    const fetchData = async (forceRefresh = false) => {
        if (!activeChildId) {
            setLoading(false);
            return;
        }
        if (!forceRefresh) setLoading(true);
        try {
            // Fetch child details to get DOB
            const children = await childService.getChildren();
            const currentChild = children.find(c => c.id === activeChildId);
            setChild(currentChild);

            // Fetch measurements (bypassing cache if pulled to refresh)
            const data = await growthService.getMeasurements(activeChildId, forceRefresh);
            setMeasurements(data);
        } catch (error) {
            console.error('Error fetching growth data:', error);
        } finally {
            if (!forceRefresh) setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData(true);
        setRefreshing(false);
    }, [activeChildId]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [activeChildId])
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

        const mapped = measurements
            .filter(m => m[type] !== null && m[type] !== undefined)
            .map(m => ({
                x: calculateAgeInMonths(child.date_of_birth, m.recorded_date),
                y: parseFloat(m[type]),
                date: m.recorded_date,
                id: m.id
            }));

        // Sort by date ascending so that the latest recorded date naturally overwrites previous ones for the same month
        mapped.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const uniqueByMonth = {};
        for (const item of mapped) {
            uniqueByMonth[item.x] = item;
        }

        return Object.values(uniqueByMonth).sort((a, b) => a.x - b.x);
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
    const genderLabel = (child?.gender || selectedChild?.gender)?.toLowerCase() === 'female' || (child?.gender || selectedChild?.gender)?.toLowerCase() === 'girl' ? 'Girls' : 'Boys';
    const interpretation = latestMeasurement
        ? getGrowthInterpretation(
            child?.gender || selectedChild?.gender,
            selectedTab,
            latestMeasurement.x,
            latestMeasurement.y
          )
        : null;

    if (loading) {
        return <LoadingScreen text="Loading growth data..." />;
    }

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Growth Tracker"
                showBack={true}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colorScheme.primary]}
                        tintColor={colorScheme.primary}
                    />
                }
            >
                {/* Introduction Instruction */}
                <View style={[styles.introCard, { backgroundColor: '#EEF2F6', borderColor: '#CFD8DC', borderWidth: 1, margin: Spacing.lg, padding: Spacing.md, borderRadius: BorderRadius.md }]}>
                    <View style={{ flexDirection: 'row', gap: Spacing.xs, alignItems: 'center', marginBottom: 4 }}>
                        <MaterialIcons name="lightbulb-outline" size={18} color="#37474F" />
                        <Text style={{ fontWeight: 'bold', color: '#37474F', fontSize: 13 }}>Why track growth?</Text>
                    </View>
                    <Text style={{ color: '#455A64', fontSize: 12, lineHeight: 16 }}>
                        Regular growth checks show if your child is getting taller, heavier, and their brain is growing at a healthy rate.
                    </Text>
                </View>

                {/* Add Entry Button */}
                <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
                    <TouchableOpacity
                        style={[styles.addEntryBtnLarge, { backgroundColor: '#FBBF24' }]}
                        onPress={() => router.push({ pathname: '/dashboard/growth-chart/add-measurement', params: { childId: activeChildId } })}
                    >
                        <MaterialIcons name="add" size={20} color="#1F2937" />
                        <Text style={[styles.addEntryBtnLargeText, { color: '#1F2937' }]}>Add Growth Entry Here</Text>
                    </TouchableOpacity>
                </View>

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
                                adjustsFontSizeToFit
                                numberOfLines={1}
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
                <View style={[styles.chartCard, { backgroundColor: colorScheme.surface }]}>
                    <Text style={[styles.chartTitle, { color: colorScheme.textPrimary }]}>
                        {getCurrentLabel()} Over Time ({genderLabel})
                    </Text>

                    <View style={styles.chartContainer}>
                        <WHOChart
                            childData={currentData}
                            heightData={heightData}
                            weightData={weightData}
                            headData={headCircData}
                            gender={child?.gender || selectedChild?.gender}
                            type={selectedTab}
                            color={getCurrentColor()}
                            unit={selectedTab === 'weight' ? 'kg' : 'cm'}
                            isDark={isDark}
                        />
                    </View>
                    <Text style={[styles.chartStatus, { color: colorScheme.textTertiary }]}>
                        Plotted against WHO global growth standards for {genderLabel}
                    </Text>

                    {/* Chart Interpretation Card */}
                    {interpretation && (
                        <View style={[
                            styles.interpretationCard,
                            {
                                backgroundColor: interpretation.lightBg,
                                borderColor: interpretation.color + '25',
                            }
                        ]}>
                            <View style={styles.interpretationHeader}>
                                <MaterialIcons name="analytics" size={18} color={interpretation.color} />
                                <Text style={[styles.interpretationStatus, { color: interpretation.color }]}>
                                    Interpretation: {interpretation.status}
                                </Text>
                            </View>
                            <Text style={[styles.interpretationDesc, { color: colorScheme.textSecondary }]}>
                                {interpretation.description}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Measurement History */}
                <View style={styles.historySection}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary, marginBottom: Spacing.md }]}>
                        Measurement History
                    </Text>

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

                {/* WHO Standard Link */}
                <TouchableOpacity 
                    style={[styles.whoLinkContainer, { backgroundColor: `${colorScheme.primary}10` }]}
                    onPress={() => WebBrowser.openBrowserAsync('https://www.who.int/tools/child-growth-standards')}
                >
                    <MaterialIcons name="info-outline" size={20} color={colorScheme.primary} />
                    <Text style={[styles.whoLinkText, { color: colorScheme.primary }]}>
                        Learn more about WHO Child Growth Standards
                    </Text>
                    <MaterialIcons name="open-in-new" size={14} color={colorScheme.primary} />
                </TouchableOpacity>
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
    introCard: {
        margin: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    introHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    introTitle: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
    introText: {
        fontSize: Typography.fontSize.sm,
        lineHeight: 20,
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.xs,
    },
    tab: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: 2,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: 2,
    },
    tabText: {
        fontSize: 10,
        fontWeight: Typography.fontWeight.medium,
        textAlign: 'center',
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
        marginBottom: Spacing.md,
    },
    chartStatus: {
        fontSize: 10,
        textAlign: 'center',
        fontStyle: 'italic',
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
    whoLinkContainer: {
        margin: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
    },
    whoLinkText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    addEntryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.md,
        ...Shadow.sm,
    },
    addEntryButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: '600',
    },
    addEntryBtnLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        ...Shadow.sm,
    },
    addEntryBtnLargeText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: 'bold',
    },
    interpretationCard: {
        marginTop: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    interpretationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    interpretationStatus: {
        fontSize: Typography.fontSize.sm,
        fontWeight: 'bold',
    },
    interpretationDesc: {
        fontSize: 12,
        lineHeight: 16,
    },
});
