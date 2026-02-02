import React, { useEffect, useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChild } from '@/contexts/ChildContext';
import appointmentService from '@/services/appointmentService';
import { milestoneService } from '@/services/milestoneService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Spacing, Typography, BorderRadius, Shadow, Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const { logout, user } = useAuth();
    const { selectedChild } = useChild();
    const { notifications } = useNotifications();

    // Milestone concern state
    const [milestoneConcern, setMilestoneConcern] = useState(false);
    const [milestoneAlertDismissed, setMilestoneAlertDismissed] = useState(false);

    // Appointments state
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(false);

    // Get latest 3 notifications
    const recentActivity = notifications.slice(0, 3);

    // Schedule reminder notification
    const scheduleReminder = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Notifications', 'Please enable notifications to receive reminders!');
                return;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '⚠️ Milestone Reminder',
                    body: `Don't forget to book an appointment to discuss your child's development milestones.`,
                    data: { type: 'milestone_reminder' },
                    sound: true,
                },
                trigger: {
                    type: 'timeInterval',
                    seconds: 172800, // 2 days
                },
            });

            console.log('Reminder notification scheduled for 2 days from now');
        } catch (error) {
            console.error('Error scheduling notification:', error);
        }
    };

    // Handle dismiss with reminder
    const handleDismissWithReminder = async () => {
        setMilestoneAlertDismissed(true);
        // Store dismissal with timestamp to show again later
        await AsyncStorage.setItem(
            `milestone_alert_dismissed_${selectedChild?.id}`,
            new Date().toISOString()
        );
        scheduleReminder();
    };

    // Check milestone progress for selected child
    const checkMilestoneProgress = useCallback(async () => {
        if (!selectedChild?.id) {
            setMilestoneConcern(false);
            return;
        }

        try {
            // Check if alert was recently dismissed (within 2 days)
            const dismissedAt = await AsyncStorage.getItem(
                `milestone_alert_dismissed_${selectedChild.id}`
            );
            if (dismissedAt) {
                const dismissedDate = new Date(dismissedAt);
                const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
                if (dismissedDate > twoDaysAgo) {
                    setMilestoneAlertDismissed(true);
                    return;
                }
            }
            setMilestoneAlertDismissed(false);

            // Fetch all milestone responses for this child
            const allResponses = await milestoneService.getAllMilestoneResponsesForChild(selectedChild.id);

            if (!allResponses || allResponses.length === 0) {
                setMilestoneConcern(false);
                return;
            }

            // Check if any category has < 50% yes responses
            let hasConcern = false;
            for (const categoryData of allResponses) {
                const responses = categoryData.responses;
                const totalAnswered = Object.keys(responses).length;
                const yesCount = Object.values(responses).filter(r => r === 'yes').length;

                if (totalAnswered > 0) {
                    const yesPercentage = (yesCount / totalAnswered) * 100;
                    if (yesPercentage < 50) {
                        hasConcern = true;
                        break;
                    }
                }
            }

            setMilestoneConcern(hasConcern);
        } catch (error) {
            console.error('Error checking milestone progress:', error);
            setMilestoneConcern(false);
        }
    }, [selectedChild?.id]);

    // Check milestones when child changes
    useEffect(() => {
        checkMilestoneProgress();
        fetchUpcomingAppointments();
    }, [checkMilestoneProgress]);

    // Fetch upcoming appointments
    const fetchUpcomingAppointments = async () => {
        try {
            setLoadingAppointments(true);
            const allAppointments = await appointmentService.getAppointments('scheduled', true); // Force refresh

            // Filter future appointments
            const now = new Date();
            const appointmentsArray = Array.isArray(allAppointments) ? allAppointments : [];
            const future = appointmentsArray.filter(apt => {
                if (apt.status !== 'scheduled' && apt.status !== 'pending') return false;

                // Parse date and time
                const aptDate = new Date(apt.appointment_date);
                const [hours, minutes] = (apt.appointment_time || '00:00').split(':').map(Number);
                aptDate.setHours(hours, minutes, 0, 0);

                return aptDate >= now;
            });

            // Sort by date/time ascending
            future.sort((a, b) => {
                const dateA = new Date(a.appointment_date + 'T' + (a.appointment_time || '00:00'));
                const dateB = new Date(b.appointment_date + 'T' + (b.appointment_time || '00:00'));
                return dateA - dateB;
            });

            // Take top 2
            setUpcomingAppointments(future.slice(0, 2));
        } catch (error) {
            console.error('Error fetching dashboard appointments:', error);
        } finally {
            setLoadingAppointments(false);
        }
    };

    // Listen for focus to refresh appointments
    useFocusEffect(
        React.useCallback(() => {
            fetchUpcomingAppointments();
        }, [])
    );

    useEffect(() => {
        if (user) {
            console.log('Logged in user:', user.displayName || user.email);
        }
    }, [user]);

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
            id: 'checklist',
            title: 'Milestone Checker',
            icon: 'checklist',
            color: '#4CAF50',
            route: '/milestone-checklist',
            description: 'Track development'
        },
        {
            id: 'appointments',
            title: 'Appointments',
            icon: 'calendar-today',
            color: colorScheme.info,
            route: '/(tabs)/appointments', // Navigate to tabbed version to show bottom nav bar
        },
        {
            id: 'prescriptions',
            title: 'Prescriptions',
            icon: 'medication',
            color: '#E91E63',
            route: '/prescriptions',
        },
        {
            id: 'medical_reports',
            title: 'Reports',
            icon: 'folder-open',
            color: '#9C27B0',
            route: '/medical-reports',
        },
        // Notifications moved to Tab Bar
    ];

    // Navigation lock to prevent double-taps
    const isNavigating = React.useRef(false);

    const handleQuickAction = (action) => {
        if (isNavigating.current) return;
        isNavigating.current = true;

        // Reset lock after delay
        setTimeout(() => {
            isNavigating.current = false;
        }, 1000);

        if (action.id === 'growth_chart') {
            if (selectedChild) {
                router.push({ pathname: '/growth-chart', params: { childId: selectedChild.id } });
            } else {
                Alert.alert('Select Child', 'Please select a child to view their growth chart.');
            }
        } else {
            router.push(action.route);
        }
    };

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
                    <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notifications')}>
                        <MaterialIcons name="notifications-none" size={24} color={colorScheme.textPrimary} />
                    </TouchableOpacity>
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
                                <MaterialIcons name="face" size={32} color={colorScheme.primary} />
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

                {/* Milestone Concern Warning - shows if child has < 50% milestones achieved */}
                {milestoneConcern && !milestoneAlertDismissed && selectedChild && (
                    <View style={[styles.milestoneWarningBanner, {
                        backgroundColor: `${colorScheme.warning}15`,
                        borderColor: colorScheme.warning
                    }]}>
                        <View style={styles.milestoneWarningContent}>
                            <MaterialIcons name="warning" size={24} color={colorScheme.warning} />
                            <View style={styles.milestoneWarningText}>
                                <Text style={[styles.milestoneWarningTitle, { color: colorScheme.textPrimary }]}>
                                    Developmental Concern
                                </Text>
                                <Text style={[styles.milestoneWarningMessage, { color: colorScheme.textSecondary }]}>
                                    {selectedChild.first_name} has achieved less than half of expected milestones. Consider booking an appointment.
                                </Text>
                            </View>
                        </View>
                        <View style={styles.milestoneWarningButtons}>
                            <TouchableOpacity
                                style={[styles.milestoneWarningButton, { backgroundColor: colorScheme.warning }]}
                                onPress={() => router.push('/appointments/book')}
                            >
                                <Text style={styles.milestoneWarningButtonText}>Book Appointment</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.milestoneWarningButtonSecondary, { borderColor: colorScheme.warning }]}
                                onPress={handleDismissWithReminder}
                            >
                                <Text style={[styles.milestoneWarningButtonSecondaryText, { color: colorScheme.warning }]}>
                                    Remind Me Later
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Upcoming Appointments */}
                {upcomingAppointments.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary, marginBottom: Spacing.md }]}>
                                Upcoming Appointments
                            </Text>
                            <TouchableOpacity onPress={() => router.push('/appointments')}>
                                <Text style={{ color: colorScheme.primary, fontWeight: '600' }}>See All</Text>
                            </TouchableOpacity>
                        </View>

                        {upcomingAppointments.map((apt) => (
                            <TouchableOpacity
                                key={apt.id}
                                style={[styles.appointmentCard, { backgroundColor: colorScheme.surface }]}
                                onPress={() => router.push('/appointments')}
                            >
                                <View style={styles.appointmentHeader}>
                                    <View style={styles.doctorInfo}>
                                        <View style={[styles.doctorAvatarSmall, { backgroundColor: colorScheme.primaryLight }]}>
                                            <MaterialIcons name="person" size={20} color={colorScheme.primary} />
                                        </View>
                                        <View>
                                            <Text style={[styles.doctorName, { color: colorScheme.textPrimary }]}>
                                                {apt.doctor_name || 'Doctor'}
                                            </Text>
                                            <Text style={[styles.specialty, { color: colorScheme.textSecondary }]}>
                                                {apt.appointment_type === 'TELECONSULT' ? 'Teleconsult' : 'In-Person'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.dateBadge, { backgroundColor: colorScheme.surfaceVariant }]}>
                                        <Text style={[styles.dateText, { color: colorScheme.textPrimary }]}>
                                            {new Date(apt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </Text>
                                        <Text style={[styles.timeText, { color: colorScheme.textSecondary }]}>
                                            {(() => {
                                                const [h, m] = (apt.appointment_time || '00:00').split(':');
                                                const hour = parseInt(h);
                                                const ampm = hour >= 12 ? 'PM' : 'AM';
                                                return `${hour % 12 || 12}:${m} ${ampm}`;
                                            })()}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={[styles.actionCard, { backgroundColor: colorScheme.surface }]}
                                onPress={() => handleQuickAction(action)}
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
                    {recentActivity.length > 0 ? (
                        <View style={[styles.card, { backgroundColor: colorScheme.surface, padding: 0 }]}>
                            {recentActivity.map((activity, index) => (
                                <TouchableOpacity
                                    key={activity.id}
                                    style={[
                                        styles.activityItem,
                                        index !== recentActivity.length - 1 && { borderBottomWidth: 1, borderBottomColor: colorScheme.border }
                                    ]}
                                    onPress={() => router.push('/notifications')}
                                >
                                    <View style={[styles.activityIcon, { backgroundColor: `${activity.category === 'appointments' ? colorScheme.appointmentScheduled : '#FF9800'}15` }]}>
                                        <MaterialIcons
                                            name={activity.category === 'appointments' ? 'event' : 'flag'}
                                            size={20}
                                            color={activity.category === 'appointments' ? colorScheme.appointmentScheduled : '#FF9800'}
                                        />
                                    </View>
                                    <View style={styles.activityContent}>
                                        <Text style={[styles.activityTitle, { color: colorScheme.textPrimary }]} numberOfLines={1}>
                                            {activity.title}
                                        </Text>
                                        <Text style={[styles.activityTime, { color: colorScheme.textSecondary }]}>
                                            {(() => {
                                                try {
                                                    const date = new Date(activity.time);
                                                    return !isNaN(date.getTime())
                                                        ? formatDistanceToNow(date, { addSuffix: true })
                                                        : 'Just now';
                                                } catch (e) {
                                                    return 'Just now';
                                                }
                                            })()}
                                        </Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={20} color={colorScheme.textTertiary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                            <View style={styles.emptyState}>
                                <MaterialIcons name="inbox" size={48} color={colorScheme.textTertiary} />
                                <Text style={[styles.emptyStateText, { color: colorScheme.textPrimary }]}>No recent activity</Text>
                                <Text style={[styles.emptyStateSubtext, { color: colorScheme.textSecondary }]}>
                                    Your child's milestones and appointments will appear here
                                </Text>
                            </View>
                        </View>
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
        justifyContent: 'space-between',
    },
    actionCard: {
        width: '31%',
        borderRadius: BorderRadius.lg,
        padding: Spacing.xs, // Reduced padding to give text more width
        paddingVertical: Spacing.md,
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
        marginBottom: 4, // Reduced margin
    },
    actionTitle: {
        fontSize: 10, // Reduced to 10 per user request
        fontWeight: Typography.fontWeight.medium,
        textAlign: 'center',
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
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.round,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    activityContent: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    activityTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: 2,
    },
    activityTime: {
        fontSize: Typography.fontSize.xs,
    },
    // Milestone Warning Banner Styles
    milestoneWarningBanner: {
        marginBottom: Spacing.xxl,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    milestoneWarningContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    milestoneWarningText: {
        flex: 1,
        marginLeft: Spacing.sm,
    },
    milestoneWarningTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.xs,
    },
    milestoneWarningMessage: {
        fontSize: Typography.fontSize.sm,
        lineHeight: 20,
    },
    milestoneWarningButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    milestoneWarningButton: {
        flex: 1,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    milestoneWarningButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    milestoneWarningButtonSecondary: {
        flex: 1,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    milestoneWarningButtonSecondaryText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    // Appointment Card Styles
    appointmentCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadow.sm,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    doctorAvatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    dateBadge: {
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
    },
    dateText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.bold,
    },
    timeText: {
        fontSize: Typography.fontSize.xs,
    },
});
