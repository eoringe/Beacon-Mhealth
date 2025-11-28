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
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const quickActions = [
        {
            id: 'add_child',
            title: 'Add Child',
            icon: 'person-add',
            color: Colors.primary,
            route: '/add_child',
        },
        {
            id: 'milestones',
            title: 'Milestones',
            icon: 'child-care',
            color: '#10B981',
            route: '/milestone-checklist',
        },
        {
            id: 'overview',
            title: 'Overview',
            icon: 'analytics',
            color: '#F59E0B',
            route: '/milestone-overview',
        },
    ];

    return (
        <View style={styles.container}>
            {/* Header with Safe Area */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
                <View>
                    <Text style={styles.greeting}>Welcome back!</Text>
                    <Text style={styles.userName}>Beacon Children's Centre</Text>
                </View>
                <TouchableOpacity style={styles.notificationButton}>
                    <MaterialIcons name="notifications-none" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
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
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={styles.actionCard}
                                onPress={() => router.push(action.route)}
                            >
                                <View style={[styles.actionIconContainer, { backgroundColor: `${action.color}15` }]}>
                                    <MaterialIcons name={action.icon} size={28} color={action.color} />
                                </View>
                                <Text style={styles.actionTitle}>{action.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <View style={styles.card}>
                        <View style={styles.emptyState}>
                            <MaterialIcons name="inbox" size={48} color={Colors.textTertiary} />
                            <Text style={styles.emptyStateText}>No recent activity</Text>
                            <Text style={styles.emptyStateSubtext}>
                                Your child's milestones and appointments will appear here
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Upcoming Appointments */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
                    <View style={styles.card}>
                        <View style={styles.emptyState}>
                            <MaterialIcons name="event" size={48} color={Colors.textTertiary} />
                            <Text style={styles.emptyStateText}>No upcoming appointments</Text>
                            <Text style={styles.emptyStateSubtext}>
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
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    greeting: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    userName: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
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
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Spacing.sm,
    },
    actionCard: {
        width: (width - Spacing.lg * 2 - Spacing.sm * 4) / 3,
        backgroundColor: Colors.white,
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
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    card: {
        backgroundColor: Colors.white,
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
        color: Colors.textPrimary,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    emptyStateSubtext: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        maxWidth: 250,
    },
});
