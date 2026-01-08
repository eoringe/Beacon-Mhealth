import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    LayoutAnimation,
    Platform,
    UIManager,
    Linking,
} from 'react-native';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { CustomLoading } from '@/components/CustomLoading';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import appointmentService from '@/services/appointmentService';

export default function AppointmentsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Fetch appointments when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchAppointments();
        }, [])
    );

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const data = await appointmentService.getAppointments();
            setAppointments(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load appointments');
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleCancelAppointment = async (appointmentId, doctorName) => {
        Alert.alert(
            'Cancel Appointment',
            `Are you sure you want to cancel your appointment with ${doctorName}?`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await appointmentService.cancelAppointment(appointmentId);
                            Alert.alert('Success', 'Appointment cancelled successfully');
                            fetchAppointments();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to cancel appointment');
                            console.error('Error cancelling appointment:', error);
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteAppointment = async (appointmentId) => {
        Alert.alert(
            'Delete Appointment',
            'Are you sure you want to remove this appointment from your history?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await appointmentService.deleteAppointment(appointmentId);
                            fetchAppointments();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete appointment');
                            console.error('Error deleting appointment:', error);
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled':
                return colorScheme.success;
            case 'pending':
                return colorScheme.warning || '#F59E0B'; // Use warning color or amber
            case 'completed':
                return colorScheme.primary;
            case 'canceled':
                return colorScheme.error;
            default:
                return colorScheme.textSecondary;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'scheduled':
                return 'schedule';
            case 'pending':
                return 'hourglass-empty';
            case 'completed':
                return 'check-circle';
            case 'canceled':
                return 'cancel';
            default:
                return 'event';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (time24) => {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const isUpcoming = (dateStr, timeStr) => {
        if (!dateStr) return false;

        // Use provided time or default to end of day if checking just date
        const time = timeStr || '23:59';
        const [hours, minutes] = time.split(':').map(Number);

        const date = new Date(dateStr);
        date.setHours(hours, minutes, 0, 0);

        return date >= new Date();
    };

    const filteredAppointments = appointments.filter((apt) => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'upcoming') return (apt.status === 'scheduled' || apt.status === 'pending') && isUpcoming(apt.appointment_date, apt.appointment_time);
        if (selectedFilter === 'completed') return apt.status === 'completed';
        if (selectedFilter === 'canceled') return apt.status === 'canceled';
        return true;
    });

    const upcomingAppointments = filteredAppointments.filter(
        (apt) => (apt.status === 'scheduled' || apt.status === 'pending') && isUpcoming(apt.appointment_date, apt.appointment_time)
    );
    const pastAppointments = filteredAppointments.filter(
        (apt) => {
            // If explicitly filtering for canceled, include them
            if (selectedFilter === 'canceled') return true;

            // Otherwise, hide canceled items from general lists (All/Past)
            if (apt.status === 'canceled') return false;

            return (apt.status !== 'scheduled' && apt.status !== 'pending') || !isUpcoming(apt.appointment_date, apt.appointment_time);
        }
    );

    const AppointmentCard = ({ appointment, isPast, colorScheme, onCancel, onDelete }) => {
        const [expanded, setExpanded] = useState(!isPast); // Default expanded if upcoming, collapsed if past

        const toggleExpand = () => {
            // Simple LayoutAnimation for smooth transition
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpanded(!expanded);
        };

        const getStatusIcon = (status, isPastItem) => {
            // if (isPastItem && status === 'scheduled') return 'history'; // Logic removed as badge is now hidden
            switch (status) {
                case 'scheduled':
                    return 'event';
                case 'pending':
                    return 'hourglass-empty';
                case 'completed':
                    return 'check-circle';
                case 'canceled':
                    return 'cancel';
                default:
                    return 'event';
            }
        };

        const getStatusColor = (status) => {
            switch (status) {
                case 'scheduled':
                    return colorScheme.success;
                case 'pending':
                    return colorScheme.warning || '#F59E0B';
                case 'completed':
                    return colorScheme.primary;
                case 'canceled':
                    return colorScheme.error;
                default:
                    return colorScheme.textSecondary;
            }
        };

        const isUpcomingItem = !isPast;

        return (
            <TouchableOpacity
                activeOpacity={isPast ? 0.7 : 1}
                onPress={isPast ? toggleExpand : undefined}
                style={[styles.appointmentCard, { backgroundColor: colorScheme.surface }]}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.doctorInfo}>
                        {appointment.doctor_photo ? (
                            <Image
                                source={{ uri: appointment.doctor_photo }}
                                style={styles.doctorPhoto}
                            />
                        ) : (
                            <View
                                style={[
                                    styles.doctorAvatar,
                                    { backgroundColor: colorScheme.primaryLight },
                                ]}
                            >
                                <MaterialIcons
                                    name="person"
                                    size={24}
                                    color={colorScheme.primary}
                                />
                            </View>
                        )}
                        <View style={styles.doctorDetails}>
                            <Text style={[styles.doctorName, { color: colorScheme.textPrimary }]}>
                                {appointment.doctor_name}
                            </Text>
                            <Text style={[styles.specialty, { color: colorScheme.textSecondary }]}>
                                {appointment.doctor_specialty}
                            </Text>
                        </View>
                    </View>

                    {/* Status Badge - Show only for upcoming items */}
                    {!isPast && (
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: `${getStatusColor(appointment.status)}20` },
                            ]}
                        >
                            <MaterialIcons
                                name={getStatusIcon(appointment.status, isPast)}
                                size={16}
                                color={getStatusColor(appointment.status)}
                            />
                        </View>
                    )}

                    {/* Expand Icon for Past Appointments */}
                    {isPast && (
                        <MaterialIcons
                            name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                            size={24}
                            color={colorScheme.textSecondary}
                            style={{ marginLeft: 8 }}
                        />
                    )}
                </View>

                {/* Collapsible Content */}
                {expanded && (
                    <>
                        <View style={[styles.divider, { backgroundColor: colorScheme.border }]} />

                        <View style={styles.appointmentDetails}>
                            <View style={styles.detailRow}>
                                <MaterialIcons
                                    name="calendar-today"
                                    size={18}
                                    color={colorScheme.textSecondary}
                                />
                                <Text style={[styles.detailText, { color: colorScheme.textPrimary }]}>
                                    {new Date(appointment.appointment_date).toLocaleDateString(undefined, {
                                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                    })}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <MaterialIcons
                                    name="access-time"
                                    size={18}
                                    color={colorScheme.textSecondary}
                                />
                                <Text style={[styles.detailText, { color: colorScheme.textPrimary }]}>
                                    {(() => {
                                        const [hours, minutes] = appointment.appointment_time.split(':');
                                        const h = parseInt(hours);
                                        const ampm = h >= 12 ? 'PM' : 'AM';
                                        const h12 = h % 12 || 12;
                                        return `${h12}:${minutes} ${ampm}`;
                                    })()}
                                </Text>
                            </View>
                            {appointment.child_name && (
                                <View style={styles.detailRow}>
                                    <MaterialIcons
                                        name="child-care"
                                        size={18}
                                        color={colorScheme.textSecondary}
                                    />
                                    <Text style={[styles.detailText, { color: colorScheme.textPrimary }]}>
                                        {appointment.child_name}
                                    </Text>
                                </View>
                            )}
                            {appointment.reason && (
                                <View style={styles.detailRow}>
                                    <MaterialIcons
                                        name="description"
                                        size={18}
                                        color={colorScheme.textSecondary}
                                    />
                                    <Text style={[styles.detailText, { color: colorScheme.textPrimary }]}>
                                        {appointment.reason}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            {isUpcomingItem && (appointment.status === 'scheduled' || appointment.status === 'pending') && (
                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        styles.cancelButton,
                                        { borderColor: colorScheme.border },
                                    ]}
                                    onPress={() => onCancel(appointment.id, appointment.doctor_name)}
                                >
                                    <Text style={[styles.actionButtonText, { color: colorScheme.error }]}>
                                        Cancel Appointment
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Appointment Type Badge (Informational) */}
                            <View style={[
                                styles.typeBadge,
                                { backgroundColor: appointment.appointment_type === 'TELECONSULT' ? colorScheme.primaryLight : colorScheme.surfaceVariant, marginTop: 12, alignSelf: 'flex-start' }
                            ]}>
                                <MaterialIcons
                                    name={appointment.appointment_type === 'TELECONSULT' ? "videocam" : "person"}
                                    size={14}
                                    color={appointment.appointment_type === 'TELECONSULT' ? colorScheme.primary : colorScheme.textSecondary}
                                />
                                <Text style={[
                                    styles.typeText,
                                    { color: appointment.appointment_type === 'TELECONSULT' ? colorScheme.primary : colorScheme.textSecondary, marginLeft: 4, function: 'row' }
                                ]}>
                                    {appointment.appointment_type === 'TELECONSULT' ? 'Teleconsult' : 'In-Person'}
                                </Text>
                            </View>
                        </View>

                        {/* Join Meeting Button for Teleconsult */}
                        {isUpcomingItem && appointment.appointment_type === 'TELECONSULT' && appointment.google_meet_link && (
                            <TouchableOpacity
                                style={[styles.joinButton, { backgroundColor: colorScheme.primary, marginTop: 12 }]}
                                onPress={() => Linking.openURL(appointment.google_meet_link)}
                            >
                                <MaterialIcons name="video-call" size={20} color="#FFFFFF" />
                                <Text style={styles.joinButtonText}>Join Google Meet</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </TouchableOpacity >
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
                <SafeHeader title="Appointments" showBack={true} />
                <View style={styles.loadingContainer}>
                    <CustomLoading size={50} text="Loading appointments..." />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Appointments" showBack={true} />

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                    {['all', 'upcoming', 'past', 'canceled'].map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterChip,
                                selectedFilter === filter && { backgroundColor: colorScheme.primary },
                                selectedFilter !== filter && { backgroundColor: colorScheme.surface, borderWidth: 1, borderColor: colorScheme.border }
                            ]}
                            onPress={() => setSelectedFilter(filter)}
                        >
                            <Text style={[
                                styles.filterText,
                                selectedFilter === filter && { color: '#FFFFFF' },
                                selectedFilter !== filter && { color: colorScheme.textSecondary }
                            ]}>
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchAppointments();
                        }}
                        tintColor={colorScheme.primary}
                    />
                }
            >
                {filteredAppointments.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons
                            name="event-note"
                            size={64}
                            color={colorScheme.textTertiary}
                        />
                        <Text style={[styles.emptyText, { color: colorScheme.textSecondary }]}>
                            No appointments found
                        </Text>
                        <Text style={[styles.emptySubtext, { color: colorScheme.textTertiary }]}>
                            Try changing the filter or book a new one
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Show sections based on filter to avoid redundancy */}
                        {(selectedFilter === 'all' || selectedFilter === 'upcoming') && upcomingAppointments.length > 0 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                                    Upcoming Appointments
                                </Text>
                                {upcomingAppointments.map(apt => (
                                    <AppointmentCard
                                        key={apt.id}
                                        appointment={apt}
                                        isPast={false}
                                        colorScheme={colorScheme}
                                        onCancel={handleCancelAppointment}
                                        onDelete={handleDeleteAppointment}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Note: 'past' filter maps to pastAppointments. 'cancelled' might be in past or upcoming technically but usually past logic handles non-upcoming. 
                            Let's rely on the filteredAppointments list for specific status filters like 'cancelled' or 'completed' if we want a flat list, 
                            OR strictly adhere to the Upcoming/Past split. 
                            
                            Current logic: 
                            - upcomingAppointments = filtered subset that matches 'upcoming' criteria
                            - pastAppointments = filtered subset that matches 'past' criteria
                            
                            If filter is 'cancelled', upcomingAppointments might be empty and pastAppointments might have them.
                        */}

                        {(selectedFilter === 'all' || selectedFilter === 'past' || selectedFilter === 'canceled' || selectedFilter === 'completed') && pastAppointments.length > 0 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                                    {selectedFilter === 'canceled'
                                        ? 'Cancelled Appointments'
                                        : (selectedFilter === 'all' ? 'Past Appointments' : 'History')
                                    }
                                </Text>
                                {pastAppointments.map(apt => (
                                    <AppointmentCard
                                        key={apt.id}
                                        appointment={apt}
                                        isPast={true}
                                        colorScheme={colorScheme}
                                        onCancel={handleCancelAppointment}
                                        onDelete={handleDeleteAppointment}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Fallback: If we have filtered items but they didn't fall into up/past buckets easily (edge cases), render them. 
                             Actually, the definitions of upcoming/past cover the whole set. 
                             upcoming = status is scheduled/pending AND is future.
                             past = status is NOT (scheduled/pending) OR is past.
                             So everything is covered.
                         */}
                    </>
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colorScheme.primary }]}
                onPress={() => router.push('/appointments/book')}
                activeOpacity={0.8}
            >
                <MaterialIcons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: Typography.fontSize.base,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xxl * 2,
    },
    emptyText: {
        marginTop: Spacing.lg,
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
    },
    emptySubtext: {
        marginTop: Spacing.xs,
        fontSize: Typography.fontSize.base,
    },
    section: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
        marginTop: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
    appointmentCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadow.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    doctorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    doctorPhoto: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.xl,
    },
    doctorAvatar: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doctorDetails: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    doctorName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 2,
    },
    specialty: {
        fontSize: Typography.fontSize.sm,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.md,
    },
    appointmentDetails: {
        gap: Spacing.sm,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    detailText: {
        fontSize: Typography.fontSize.base,
        flex: 1,
    },
    actions: {
        marginTop: Spacing.md,
    },
    actionButton: {
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelButton: {},
    actionButtonText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    fab: {
        position: 'absolute',
        right: Spacing.lg,
        bottom: Spacing.xl * 4, // Moved up to avoid bottom nav
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.lg,
    },
    filterContainer: {
        marginBottom: Spacing.sm,
    },
    filterContent: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.round,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.md,
    },
    typeText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
        marginLeft: 4,
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    joinButtonText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        color: '#FFFFFF',
    },
});
