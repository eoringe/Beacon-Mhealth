import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChild } from '@/contexts/ChildContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Spacing, Typography, BorderRadius, Shadow, Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const { logout, user } = useAuth();
    const { selectedChild } = useChild();

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: () => logout() }
            ]
        );
    };

    const calculateAge = (dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age === 0) {
            const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
            return `${months} mo`;
        }

        return `${age} yr`;
    };

    const quickActions = [
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
            icon: 'flag',
            color: '#FF9800',
            route: '/milestone-overview',
        },
        {
            id: 'appointments',
            title: 'Appointments',
            icon: 'event',
            color: colorScheme.appointmentScheduled,
            route: '/appointments',
        },
        {
            id: 'teleconsult',
            title: 'Teleconsult',
            icon: 'videocam',
            color: colorScheme.info,
            route: '/teleconsultation',
        },
        {
            id: 'notifications',
            title: 'Notifications',
            icon: 'notifications',
            color: colorScheme.warning,
            route: '/notifications',
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
                    <Text style={[styles.userName, { color: colorScheme.textPrimary }]}>{user?.displayName || 'Parent'}</Text>
                </View>
                <View style={styles.headerButtons}>
                    <ThemeToggle />
                    <TouchableOpacity style={styles.notificationButton} onPress={handleLogout}>
                        <MaterialIcons name="logout" size={24} color={colorScheme.error || '#FF5252'} />
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
                {/* Child Selector / Summary */}
                <View style={styles.section}>
                    <View style={[styles.headerRow, { marginBottom: Spacing.md }]}>
                        <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary, marginBottom: 0 }]}>
                            Current Child
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/children')}>
                            <Text style={{ color: colorScheme.primary, fontWeight: '600' }}>Switch / Add</Text>
                        </TouchableOpacity>
                    </View>

                    {selectedChild ? (
                        <TouchableOpacity
                            style={[styles.childCard, { backgroundColor: colorScheme.surface }]}
                            onPress={() => router.push('/children')}
                        >
                            <View style={[styles.avatarContainer, { backgroundColor: `${colorScheme.primary}20` }]}>
                                <FontAwesome5 name="baby" size={32} color={colorScheme.primary} />
                            </View>
                            <View style={styles.childInfo}>
                                <Text style={[styles.childName, { color: colorScheme.textPrimary }]}>
                                    {selectedChild.first_name} {selectedChild.last_name}
                                </Text>
                                <Text style={[styles.childDetails, { color: colorScheme.textSecondary }]}>
                                    {calculateAge(selectedChild.date_of_birth)} • {selectedChild.gender}
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={colorScheme.textTertiary} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.addChildCard, { borderColor: colorScheme.border }]}
                            onPress={() => router.push('/children/add')}
                        >
                            <MaterialIcons name="add-circle-outline" size={32} color={colorScheme.primary} />
                            <Text style={[styles.addChildText, { color: colorScheme.textSecondary }]}>
                                Add a child to start tracking
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    childCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        // borderWidth: 1, // Removed per user request
        // borderColor: Colors.border,
        // borderStyle: 'solid',
    },
    addChildCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: 'solid', // Changed from dashed to solid per user request
        gap: Spacing.md,
    },
    addChildText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    childInfo: {
        flex: 1,
    },
    childName: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: 2,
    },
    childDetails: {
        fontSize: Typography.fontSize.sm,
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
