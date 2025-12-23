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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
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
            case 'completed':
                return colorScheme.primary;
            case 'cancelled':
                return colorScheme.error;
            default:
                return colorScheme.textSecondary;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'scheduled':
                return 'schedule';
            case 'completed':
                return 'check-circle';
            case 'cancelled':
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

    const isUpcoming = (date) => {
        return new Date(date) >= new Date();
    };

    const filteredAppointments = appointments.filter((apt) => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'upcoming') return apt.status === 'scheduled' && isUpcoming(apt.appointment_date);
        if (selectedFilter === 'completed') return apt.status === 'completed';
        if (selectedFilter === 'cancelled') return apt.status === 'cancelled';
        return true;
    });

    const upcomingAppointments = filteredAppointments.filter(
        (apt) => apt.status === 'scheduled' && isUpcoming(apt.appointment_date)
    );
    const pastAppointments = filteredAppointments.filter(
        (apt) => apt.status !== 'scheduled' || !isUpcoming(apt.appointment_date)
    );

    const renderAppointmentCard = (appointment) => (
        <View
            key={appointment.id}
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
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(appointment.status)}20` },
                    ]}
                >
                    <MaterialIcons
                        name={getStatusIcon(appointment.status)}
                        size={16}
                        color={getStatusColor(appointment.status)}
                    />
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colorScheme.border }]} />

            <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                    <MaterialIcons
                        name="calendar-today"
                        size={18}
                        color={colorScheme.textSecondary}
                    />
                    <Text style={[styles.detailText, { color: colorScheme.textPrimary }]}>
                        {formatDate(appointment.appointment_date)}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <MaterialIcons
                        name="access-time"
                        size={18}
                        color={colorScheme.textSecondary}
                    />
                    <Text style={[styles.detailText, { color: colorScheme.textPrimary }]}>
                        {formatTime(appointment.appointment_time)}
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

            {appointment.status === 'scheduled' && isUpcoming(appointment.appointment_date) && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.cancelButton,
                            { borderColor: colorScheme.border },
                        ]}
                        onPress={() => handleCancelAppointment(appointment.id, appointment.doctor_name)}
                    >
                        <Text style={[styles.actionButtonText, { color: colorScheme.error }]}>
                            Cancel Appointment
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Delete button for past/cancelled appointments */}
            {(!isUpcoming(appointment.appointment_date) || appointment.status === 'cancelled' || appointment.status === 'completed') && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            { borderColor: colorScheme.border },
                        ]}
                        onPress={() => handleDeleteAppointment(appointment.id)}
                    >
                        <Text style={[styles.actionButtonText, { color: colorScheme.textSecondary }]}>
                            Remove from History
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
                <SafeHeader title="Appointments" showBack={true} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colorScheme.primary} />
                    <Text style={[styles.loadingText, { color: colorScheme.textSecondary }]}>
                        Loading appointments...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Appointments" showBack={true} />

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
                {appointments.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons
                            name="event-note"
                            size={64}
                            color={colorScheme.textTertiary}
                        />
                        <Text style={[styles.emptyText, { color: colorScheme.textSecondary }]}>
                            No appointments yet
                        </Text>
                        <Text style={[styles.emptySubtext, { color: colorScheme.textTertiary }]}>
                            Book your first appointment to get started
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Upcoming Appointments */}
                        {upcomingAppointments.length > 0 && (
                            <View style={styles.section}>
                                <Text
                                    style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}
                                >
                                    Upcoming Appointments
                                </Text>
                                {upcomingAppointments.map(renderAppointmentCard)}
                            </View>
                        )}

                        {/* Past Appointments */}
                        {pastAppointments.length > 0 && (
                            <View style={styles.section}>
                                <Text
                                    style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}
                                >
                                    Past Appointments
                                </Text>
                                {pastAppointments.map(renderAppointmentCard)}
                            </View>
                        )}
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
});
