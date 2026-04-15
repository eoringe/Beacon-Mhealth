import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    RefreshControl,
    LayoutAnimation,
    Platform,
    UIManager,
    Linking,
    Dimensions,
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
import { useAlert } from '@/contexts/AlertContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 430;
import { useChild } from '@/contexts/ChildContext'; // Import Child Context

export default function AppointmentsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const { showAlert } = useAlert();
    const { selectedChild } = useChild(); // Get selected child from context

    const isNavigating = React.useRef(false);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Fetch appointments when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchAppointments();
        }, [selectedChild]) // Re-fetch when selected child changes
    );

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            // Pass selectedChild.id to filter appointments
            const data = await appointmentService.getAppointments(null, true, selectedChild?.id);
            setAppointments(data);
        } catch (error) {
            showAlert('Error', 'Failed to load appointments', [], 'error');
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleCancelAppointment = async (appointmentId, doctorName) => {
        showAlert(
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
                            showAlert('Success', 'Appointment cancelled successfully', [], 'success');
                            fetchAppointments();
                        } catch (error) {
                            showAlert('Error', 'Failed to cancel appointment', [], 'error');
                            console.error('Error cancelling appointment:', error);
                        }
                    },
                },
            ],
            'warning'
        );
    };

    const handleDeleteAppointment = async (appointmentId) => {
        showAlert(
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
                            showAlert('Error', 'Failed to delete appointment', [], 'error');
                            console.error('Error deleting appointment:', error);
                        }
                    },
                },
            ],
            'warning'
        );
    };

    const handleClearAllPast = async () => {
        // Get IDs of all past appointments
        const pastIds = appointments.filter(apt => {
            const isPast = new Date(apt.appointment_date) < new Date();
            const isCancelled = apt.status === 'cancelled' || apt.status === 'canceled';
            return isPast || isCancelled;
        }).map(apt => apt.id);

        if (pastIds.length === 0) {
            showAlert('No Past Appointments', 'There are no past appointments to clear.', [], 'info');
            return;
        }

        showAlert(
            'Clear All Past Appointments',
            `Are you sure you want to remove ${pastIds.length} past/cancelled appointment${pastIds.length > 1 ? 's' : ''} from your history?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Delete all past appointments
                            await Promise.all(pastIds.map(id => appointmentService.deleteAppointment(id)));
                            fetchAppointments();
                            showAlert('Success', 'Past appointments cleared', [], 'success');
                        } catch (error) {
                            showAlert('Error', 'Failed to clear some appointments', [], 'error');
                            console.error('Error clearing past appointments:', error);
                            fetchAppointments(); // Refresh to show what was actually deleted
                        }
                    },
                },
            ],
            'warning'
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

        // Manually parse YYYY-MM-DD to avoid UTC conversion issues
        // format: "2024-05-20"
        const [year, month, day] = dateStr.split('-').map(Number);

        // Create date in LOCAL time (Month is 0-indexed in JS Date)
        const date = new Date(year, month - 1, day);

        // Use provided time or default to end of day if checking just date
        const time = timeStr || '23:59';
        const [hours, minutes] = time.split(':').map(Number);

        date.setHours(hours, minutes, 0, 0);

        return date >= new Date();
    };

    const filteredAppointments = appointments.filter((apt) => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'upcoming') return (apt.status === 'scheduled' || apt.status === 'pending') && isUpcoming(apt.appointment_date, apt.appointment_time);
        if (selectedFilter === 'completed') return apt.status === 'completed';
        if (selectedFilter === 'canceled') return apt.status === 'canceled' || apt.status === 'cancelled';
        return true;
    });

    const upcomingAppointments = filteredAppointments.filter(
        (apt) => (apt.status === 'scheduled' || apt.status === 'pending') && isUpcoming(apt.appointment_date, apt.appointment_time)
    );
    const pastAppointments = filteredAppointments.filter(
        (apt) => {
            // If explicitly filtering for canceled, include them in this section
            if (selectedFilter === 'canceled') return true;

            // Always hide canceled/cancelled items from Past section - they appear in Cancelled tab only
            if (apt.status === 'canceled' || apt.status === 'cancelled') return false;

            // Show completed or past scheduled/pending appointments
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
                                    name="medical-services"
                                    size={24}
                                    color={colorScheme.primary}
                                />
                            </View>
                        )}
                        <View style={styles.doctorDetails}>
                            <Text style={[styles.doctorName, { color: colorScheme.textPrimary }]}>
                                {appointment.doctor_specialty || 'Therapy Session'}
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
                                    onPress={() => onCancel(appointment.id, appointment.doctor_specialty || 'this session')}
                                >
                                    <Text style={[styles.actionButtonText, { color: colorScheme.error }]}>
                                        Cancel Appointment
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Delete button for past or cancelled appointments - compact style */}
                            {(isPast || appointment.status === 'cancelled' || appointment.status === 'canceled') && (
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 6,
                                        paddingHorizontal: 10,
                                        borderRadius: 6,
                                        borderWidth: 1,
                                        borderColor: colorScheme.error + '50',
                                        backgroundColor: colorScheme.error + '10',
                                        alignSelf: 'flex-start',
                                        marginTop: 8,
                                    }}
                                    onPress={() => onDelete(appointment.id)}
                                >
                                    <MaterialIcons name="delete-outline" size={14} color={colorScheme.error} />
                                    <Text style={{ color: colorScheme.error, fontSize: 12, marginLeft: 4, fontWeight: '500' }}>
                                        Remove
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Appointment Type Badge */}
                            <View style={[
                                styles.typeBadge,
                                { backgroundColor: appointment.appointment_type === 'TELECONSULT' ? `${colorScheme.info}15` : `${colorScheme.success}15`, marginTop: 12, alignSelf: 'flex-start' }
                            ]}>
                                <MaterialIcons
                                    name={appointment.appointment_type === 'TELECONSULT' ? "video-call" : "person"}
                                    size={14}
                                    color={appointment.appointment_type === 'TELECONSULT' ? colorScheme.info : colorScheme.success}
                                />
                                <Text style={[
                                    styles.typeText,
                                    { color: appointment.appointment_type === 'TELECONSULT' ? colorScheme.info : colorScheme.success, marginLeft: 4 }
                                ]}>
                                    {appointment.appointment_type === 'TELECONSULT' ? 'Teleconsultation' : 'In-Person'}
                                </Text>
                            </View>

                            {/* Teleconsultation Links */}
                            {appointment.appointment_type === 'TELECONSULT' && (
                                <View style={styles.linkActions}>
                                    {appointment.google_meet_link && (
                                        <TouchableOpacity
                                            style={[styles.linkButton, { backgroundColor: `${colorScheme.primary}10` }]}
                                            onPress={() => Linking.openURL(appointment.google_meet_link)}
                                        >
                                            <MaterialIcons name="videocam" size={18} color={colorScheme.primary} />
                                            <Text style={[styles.linkButtonText, { color: colorScheme.primary }]}>Join Meeting</Text>
                                        </TouchableOpacity>
                                    )}
                                    {appointment.google_calendar_html_link && (
                                        <TouchableOpacity
                                            style={[styles.linkButton, { backgroundColor: `${colorScheme.info}10` }]}
                                            onPress={() => Linking.openURL(appointment.google_calendar_html_link)}
                                        >
                                            <MaterialIcons name="calendar-today" size={16} color={colorScheme.info} />
                                            <Text style={[styles.linkButtonText, { color: colorScheme.info }]}>Google Calendar</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>


                    </>
                )}
            </TouchableOpacity >
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
                <SafeHeader title="Appointments" showBack={true} showMenu={true} />
                <View style={styles.loadingContainer}>
                    <CustomLoading size={50} text="Loading appointments..." />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Appointments" showBack={true} showMenu={true} />

            <View style={styles.filterContainer}>
                {/* ... existing filter code ... */}
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
                {/* ... existing content ... */}
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

                        {(selectedFilter === 'all' || selectedFilter === 'past' || selectedFilter === 'canceled' || selectedFilter === 'completed') && pastAppointments.length > 0 && (
                            <View style={styles.section}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary, marginBottom: 0 }]}>
                                        {selectedFilter === 'canceled'
                                            ? 'Cancelled Appointments'
                                            : (selectedFilter === 'all' ? 'Past Appointments' : 'History')
                                        }
                                    </Text>
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 4,
                                            paddingHorizontal: 8,
                                            borderRadius: 4,
                                            backgroundColor: colorScheme.error + '15',
                                        }}
                                        onPress={handleClearAllPast}
                                    >
                                        <MaterialIcons name="delete-sweep" size={14} color={colorScheme.error} />
                                        <Text style={{ color: colorScheme.error, fontSize: 12, marginLeft: 4, fontWeight: '500' }}>
                                            Clear All
                                        </Text>
                                    </TouchableOpacity>
                                </View>
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
                    </>
                )}
            </ScrollView>

            {/* FAB with Debounce */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colorScheme.primary }]}
                onPress={() => {
                    if (isNavigating.current) return;

                    // Check if child is selected
                    if (!selectedChild) {
                        showAlert(
                            'No Child Selected',
                            'Please select a child from the dashboard to book an appointment.',
                            [{ text: 'OK' }],
                            'warning'
                        );
                        return;
                    }

                    isNavigating.current = true;
                    setTimeout(() => { isNavigating.current = false; }, 1000);
                    router.push('/appointments/book');
                }}
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
        padding: isSmallDevice ? Spacing.md : Spacing.lg,
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
        width: isSmallDevice ? 40 : 48,
        height: isSmallDevice ? 40 : 48,
        borderRadius: BorderRadius.xl,
    },
    doctorAvatar: {
        width: isSmallDevice ? 40 : 48,
        height: isSmallDevice ? 40 : 48,
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
    linkActions: {
        flexDirection: isSmallDevice ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    linkButton: {
        flex: 1,
        minWidth: isSmallDevice ? '100%' : 140,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: BorderRadius.md,
        gap: 8,
    },
    linkButtonText: {
        fontSize: isSmallDevice ? 12 : 13,
        fontWeight: '600',
        textAlign: 'center',
    },
});
