import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();

    const quickActions = [
        {
            id: 'child_profile',
            title: 'Child Profile',
            icon: 'account-circle',
            color: colorScheme.primary,
            route: '/child-profile',
        },
        {
            id: 'growth_chart',
            title: 'Growth Chart',
            icon: 'show-chart',
            color: colorScheme.chartHeight,
            route: '/growth-chart',
        },
        {
            id: 'vaccinations',
            title: 'Vaccinations',
            icon: 'vaccines',
            color: colorScheme.vaccineCompleted,
            route: '/vaccinations',
        },
        {
            id: 'milestones',
            title: 'Milestones',
            icon: 'child-care',
            color: colorScheme.success,
            route: '/milestone-checklist',
        },
        {
            id: 'overview',
            title: 'Overview',
            icon: 'analytics',
            color: colorScheme.warning,
            route: '/milestone-overview',
        },
        {
            id: 'add_child',
            title: 'Add Child',
            icon: 'person-add',
            color: colorScheme.textTertiary,
            route: '/add_child',
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            {/* Header with Safe Area */}
            <View style={[styles.header, {
                paddingTop: insets.top + Spacing.lg,
                backgroundColor: colorScheme.surface,
                borderBottomColor: colorScheme.border,
            }]}>
                <View>
                    <Text style={[styles.greeting, { color: colorScheme.textSecondary }]}>Welcome back!</Text>
                    <Text style={[styles.userName, { color: colorScheme.textPrimary }]}>Beacon Children's Centre</Text>
                </View>
                <View style={styles.headerButtons}>
                    <ThemeToggle />
                    <TouchableOpacity style={styles.notificationButton}>
                        <MaterialIcons name="notifications-none" size={24} color={colorScheme.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + Spacing.xxl },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={[styles.actionCard, { backgroundColor: colorScheme.surface }]}
                                onPress={() => router.push(action.route)}
                            >
                                <View style={[styles.actionIconContainer, { backgroundColor: `${action.color}15` }]}>
                                    <MaterialIcons name={action.icon} size={28} color={action.color} />
                                </View>
                                <Text
                                    style={[styles.actionTitle, { color: colorScheme.textPrimary }]}
                                    numberOfLines={2}
                                >
                                    {action.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>Recent Activity</Text>
                    <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                        <View style={styles.emptyState}>
                            <MaterialIcons name="inbox" size={48} color={colorScheme.textTertiary} />
                            <Text style={[styles.emptyStateText, { color: colorScheme.textPrimary }]}>No recent activity</Text>
                            <Text style={[styles.emptyStateSubtext, { color: colorScheme.textSecondary }]}>
                                Your child's milestones and appointments will appear here
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Upcoming Appointments */}
                < View style={styles.section} >
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>Upcoming Appointments</Text>
                    <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                        <View style={styles.emptyState}>
                            <MaterialIcons name="event" size={48} color={colorScheme.textTertiary} />
                            <Text style={[styles.emptyStateText, { color: colorScheme.textPrimary }]}>No upcoming appointments</Text>
                            <Text style={[styles.emptyStateSubtext, { color: colorScheme.textSecondary }]}>
                                Schedule a visit to get started
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    greeting: {
        fontSize: Typography.fontSize.sm,
        marginBottom: 4,
    },
    userName: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
    },
    notificationButton: {
        padding: Spacing.sm,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.xxl,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Spacing.sm,
    },
    actionCard: {
        width: (width - Spacing.lg * 2 - Spacing.sm * 4) / 3,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginHorizontal: Spacing.sm,
        marginBottom: Spacing.md,
        alignItems: 'center',
        ...Shadow.md,
    },
    actionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    actionTitle: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
        textAlign: 'center',
        numberOfLines: 1,
    },
    card: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        ...Shadow.md,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
    },
    emptyStateText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    emptyStateSubtext: {
        fontSize: Typography.fontSize.sm,
        textAlign: 'center',
        maxWidth: 250,
    },
});
