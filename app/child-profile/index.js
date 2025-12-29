import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

import { useChild } from '@/contexts/ChildContext';

export default function ChildProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();

    // Sample data - will be replaced with actual data
    const childData = {
        name: 'Emma Johnson',
        // ... (keep existing mock data for now as the whole screen relies on it)
        photo: require('../../assets/images/beacon.jpg'),
        dateOfBirth: '2023-06-15',
        age: '18 months',
        gender: 'Female',
        growth: {
            height: { value: 82, unit: 'cm', percentile: 75 },
            weight: { value: 11.5, unit: 'kg', percentile: 70 },
            headCirc: { value: 47, unit: 'cm', percentile: 80 },
            lastUpdated: '2024-11-20',
        },
        milestones: {
            completed: 18,
            total: 25,
            byCategory: {
                physical: { completed: 4, total: 5 },
                cognitive: { completed: 3, total: 5 },
                social: { completed: 4, total: 5 },
                language: { completed: 3, total: 5 },
                selfhelp: { completed: 4, total: 5 },
            },
        },
        vaccinations: {
            completed: 8,
            total: 12,
            nextDue: { name: 'MMR Dose 2', date: '2024-12-15' },
        },
        recentActivity: [
            { type: 'measurement', title: 'Height recorded', value: '82 cm', date: '2024-11-20' },
            { type: 'vaccine', title: 'Flu vaccine completed', date: '2024-11-15' },
            { type: 'milestone', title: 'Says 5+ words', date: '2024-11-10' },
            { type: 'appointment', title: 'Pediatrician checkup', date: '2024-11-05' },
        ],
    };

    const handleViewChart = () => {
        if (selectedChild) {
            router.push({ pathname: '/growth-chart', params: { childId: selectedChild.id } });
        } else {
            // Fallback or alert
            router.push('/growth-chart');
        }
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'measurement': return 'straighten';
            case 'vaccine': return 'vaccines';
            case 'milestone': return 'stars';
            case 'appointment': return 'event';
            default: return 'circle';
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case 'measurement': return colorScheme.chartHeight;
            case 'vaccine': return colorScheme.vaccineCompleted;
            case 'milestone': return colorScheme.warning;
            case 'appointment': return colorScheme.appointmentScheduled;
            default: return colorScheme.textTertiary;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Child Profile"
                showBack={true}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={[styles.headerSection, { backgroundColor: colorScheme.surface }]}>
                    <View style={styles.photoContainer}>
                        <Image
                            source={childData.photo}
                            style={styles.profilePhoto}
                        />
                        <TouchableOpacity style={[styles.editPhotoButton, { backgroundColor: colorScheme.primary }]}>
                            <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.childName, { color: colorScheme.textPrimary }]}>{childData.name}</Text>
                    <Text style={[styles.childAge, { color: colorScheme.textSecondary }]}>
                        {childData.age} • {childData.gender}
                    </Text>
                    <Text style={[styles.dateOfBirth, { color: colorScheme.textTertiary }]}>
                        Born {childData.dateOfBirth}
                    </Text>

                    <TouchableOpacity
                        style={[styles.editProfileButton, { borderColor: colorScheme.border }]}
                        onPress={() => router.push('/child-profile/edit')}
                    >
                        <MaterialIcons name="edit" size={18} color={colorScheme.primary} />
                        <Text style={[styles.editProfileText, { color: colorScheme.primary }]}>
                            Edit Profile
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Growth Summary */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                            Growth Summary
                        </Text>
                        <TouchableOpacity onPress={handleViewChart}>
                            <Text style={[styles.viewAllText, { color: colorScheme.primary }]}>View Chart</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.growthCard, { backgroundColor: colorScheme.surface }]}>
                        <View style={styles.growthRow}>
                            <View style={styles.growthItem}>
                                <MaterialIcons name="height" size={24} color={colorScheme.chartHeight} />
                                <Text style={[styles.growthLabel, { color: colorScheme.textSecondary }]}>Height</Text>
                                <Text style={[styles.growthValue, { color: colorScheme.textPrimary }]}>
                                    {childData.growth.height.value} {childData.growth.height.unit}
                                </Text>
                                <Text style={[styles.percentile, { color: colorScheme.chartHeight }]}>
                                    {childData.growth.height.percentile}th %ile
                                </Text>
                            </View>

                            <View style={styles.growthItem}>
                                <MaterialIcons name="monitor-weight" size={24} color={colorScheme.chartWeight} />
                                <Text style={[styles.growthLabel, { color: colorScheme.textSecondary }]}>Weight</Text>
                                <Text style={[styles.growthValue, { color: colorScheme.textPrimary }]}>
                                    {childData.growth.weight.value} {childData.growth.weight.unit}
                                </Text>
                                <Text style={[styles.percentile, { color: colorScheme.chartWeight }]}>
                                    {childData.growth.weight.percentile}th %ile
                                </Text>
                            </View>

                            <View style={styles.growthItem}>
                                <MaterialIcons name="face" size={24} color={colorScheme.chartHeadCirc} />
                                <Text style={[styles.growthLabel, { color: colorScheme.textSecondary }]}>Head</Text>
                                <Text style={[styles.growthValue, { color: colorScheme.textPrimary }]}>
                                    {childData.growth.headCirc.value} {childData.growth.headCirc.unit}
                                </Text>
                                <Text style={[styles.percentile, { color: colorScheme.chartHeadCirc }]}>
                                    {childData.growth.headCirc.percentile}th %ile
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.lastUpdated, { color: colorScheme.textTertiary }]}>
                            Last updated: {childData.growth.lastUpdated}
                        </Text>
                    </View>
                </View>

                {/* Milestone Progress */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                            Milestone Progress
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/milestone-checklist')}>
                            <Text style={[styles.viewAllText, { color: colorScheme.primary }]}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                        <View style={styles.progressHeader}>
                            <Text style={[styles.progressText, { color: colorScheme.textPrimary }]}>
                                {childData.milestones.completed} of {childData.milestones.total} completed
                            </Text>
                            <Text style={[styles.progressPercentage, { color: colorScheme.primary }]}>
                                {Math.round((childData.milestones.completed / childData.milestones.total) * 100)}%
                            </Text>
                        </View>

                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBarBackground, { backgroundColor: colorScheme.border }]}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            backgroundColor: colorScheme.primary,
                                            width: `${(childData.milestones.completed / childData.milestones.total) * 100}%`,
                                        },
                                    ]}
                                />
                            </View>
                        </View>

                        <View style={styles.categoryBreakdown}>
                            {Object.entries(childData.milestones.byCategory).map(([category, data]) => (
                                <View key={category} style={styles.categoryItem}>
                                    <Text style={[styles.categoryName, { color: colorScheme.textSecondary }]}>
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </Text>
                                    <View style={styles.miniProgressBar}>
                                        <View style={[styles.miniProgressBackground, { backgroundColor: colorScheme.border }]}>
                                            <View
                                                style={[
                                                    styles.miniProgressFill,
                                                    {
                                                        backgroundColor: colorScheme.success,
                                                        width: `${(data.completed / data.total) * 100}%`,
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <Text style={[styles.miniProgressText, { color: colorScheme.textTertiary }]}>
                                            {data.completed}/{data.total}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Vaccination Progress */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                            Vaccination Progress
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/vaccinations')}>
                            <Text style={[styles.viewAllText, { color: colorScheme.primary }]}>View Schedule</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                        <View style={styles.vaccinationSummary}>
                            <View style={styles.circularProgress}>
                                <Text style={[styles.percentageText, { color: colorScheme.primary }]}>
                                    {Math.round((childData.vaccinations.completed / childData.vaccinations.total) * 100)}%
                                </Text>
                                <Text style={[styles.percentageLabel, { color: colorScheme.textSecondary }]}>
                                    Complete
                                </Text>
                            </View>

                            <View style={styles.vaccinationDetails}>
                                <Text style={[styles.vaccineCount, { color: colorScheme.textPrimary }]}>
                                    {childData.vaccinations.completed} of {childData.vaccinations.total} vaccines
                                </Text>
                                <View style={[styles.nextVaccineCard, { backgroundColor: colorScheme.primaryLight }]}>
                                    <MaterialIcons name="event" size={16} color={colorScheme.primary} />
                                    <Text style={[styles.nextVaccineText, { color: colorScheme.primary }]}>
                                        Next: {childData.vaccinations.nextDue.name} on {childData.vaccinations.nextDue.date}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                        Quick Actions
                    </Text>

                    <View style={styles.quickActionsGrid}>
                        <TouchableOpacity
                            style={[styles.quickActionButton, { backgroundColor: colorScheme.surface }]}
                            onPress={handleViewChart}
                        >
                            <MaterialIcons name="straighten" size={24} color={colorScheme.primary} />
                            <Text style={[styles.quickActionLabel, { color: colorScheme.textPrimary }]}>
                                Add Measurement
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickActionButton, { backgroundColor: colorScheme.surface }]}
                            onPress={() => router.push('/milestone-checklist')}
                        >
                            <MaterialIcons name="check-circle" size={24} color={colorScheme.primary} />
                            <Text style={[styles.quickActionLabel, { color: colorScheme.textPrimary }]}>
                                Log Milestone
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                            Recent Activity
                        </Text>
                    </View>

                    {childData.recentActivity.map((activity, index) => (
                        <View
                            key={index}
                            style={[styles.activityItem, { backgroundColor: colorScheme.surface }]}
                        >
                            <View style={[styles.activityIconContainer, {
                                backgroundColor: `${getActivityColor(activity.type)}20`,
                            }]}>
                                <MaterialIcons
                                    name={getActivityIcon(activity.type)}
                                    size={20}
                                    color={getActivityColor(activity.type)}
                                />
                            </View>

                            <View style={styles.activityContent}>
                                <Text style={[styles.activityTitle, { color: colorScheme.textPrimary }]}>
                                    {activity.title}
                                </Text>
                                {activity.value && (
                                    <Text style={[styles.activityValue, { color: colorScheme.textSecondary }]}>
                                        {activity.value}
                                    </Text>
                                )}
                                <Text style={[styles.activityDate, { color: colorScheme.textTertiary }]}>
                                    {activity.date}
                                </Text>
                            </View>
                        </View>
                    ))}
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
    headerSection: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadow.md,
    },
    photoContainer: {
        position: 'relative',
        marginBottom: Spacing.lg,
    },
    profilePhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    editPhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    childName: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.xs,
    },
    childAge: {
        fontSize: Typography.fontSize.md,
        marginBottom: Spacing.xs,
    },
    dateOfBirth: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.lg,
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    editProfileText: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
    },
    section: {
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
    },
    viewAllText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    card: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        ...Shadow.md,
    },
    growthCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        ...Shadow.md,
    },
    growthRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: Spacing.md,
    },
    growthItem: {
        alignItems: 'center',
        flex: 1,
    },
    growthLabel: {
        fontSize: Typography.fontSize.sm,
        marginTop: Spacing.xs,
    },
    growthValue: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        marginTop: Spacing.xs,
    },
    percentile: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
        marginTop: 2,
    },
    lastUpdated: {
        fontSize: Typography.fontSize.xs,
        textAlign: 'center',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    progressText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
    },
    progressPercentage: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
    },
    progressBarContainer: {
        marginBottom: Spacing.lg,
    },
    progressBarBackground: {
        height: 12,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: BorderRadius.md,
    },
    categoryBreakdown: {
        gap: Spacing.md,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    categoryName: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        flex: 1,
    },
    miniProgressBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        flex: 2,
    },
    miniProgressBackground: {
        flex: 1,
        height: 6,
        borderRadius: BorderRadius.sm,
        overflow: 'hidden',
    },
    miniProgressFill: {
        height: '100%',
    },
    miniProgressText: {
        fontSize: Typography.fontSize.xs,
        width: 30,
    },
    vaccinationSummary: {
        flexDirection: 'row',
        gap: Spacing.lg,
    },
    circularProgress: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 8,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentageText: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
    },
    percentageLabel: {
        fontSize: Typography.fontSize.xs,
    },
    vaccinationDetails: {
        flex: 1,
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    vaccineCount: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    nextVaccineCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
    nextVaccineText: {
        fontSize: Typography.fontSize.xs,
        flex: 1,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    quickActionButton: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
        ...Shadow.md,
    },
    quickActionLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        textAlign: 'center',
    },
    activityItem: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
        gap: Spacing.md,
        ...Shadow.sm,
    },
    activityIconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: 2,
    },
    activityValue: {
        fontSize: Typography.fontSize.sm,
        marginBottom: 2,
    },
    activityDate: {
        fontSize: Typography.fontSize.xs,
    },
});
