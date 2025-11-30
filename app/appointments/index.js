import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export default function AppointmentsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const [selectedFilter, setSelectedFilter] = useState('all');

    const filters = [
        { id: 'all', label: ' All', icon: 'calendar-today' },
        { id: 'upcoming', label: 'Upcoming', icon: 'schedule' },
        { id: 'completed', label: 'Completed', icon: 'check-circle' },
        { id: 'cancelled', label: 'Cancelled', icon: 'cancel' },
    ];

    const upcomingAppointments = [
        {
            id: 1,
            doctorName: 'Dr. Sarah Johnson',
            specialty: 'Pediatrician',
            date: '2024-12-15',
            time: '10:00 AM',
            type: 'In-Person',
            status: 'upcoming',
        },
        {
            id: 2,
            doctorName: 'Dr. Michael Chen',
            specialty: 'General Practitioner',
            date: '2024-12-20',
            time: '2:30 PM',
            type: 'Teleconsultation',
            status: 'upcoming',
        },
    ];

    const pastAppointments = [
        {
            id: 3,
            doctorName: 'Dr. Emily Thompson',
            specialty: 'Pediatrician',
            date: '2024-11-10',
            time: '11:00 AM',
            type: 'In-Person',
            status: 'completed',
        },
        {
            id: 4,
            doctorName: 'Dr. James Wilson',
            specialty: 'Specialist',
            date: '2024-11-05',
            time: '3:00 PM',
            type: 'Teleconsultation',
            status: 'cancelled',
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming':
                return colorScheme.appointmentScheduled;
            case 'completed':
                return colorScheme.appointmentCompleted;
            case 'cancelled':
                return colorScheme.appointmentCancelled;
            default:
                return colorScheme.textSecondary;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'upcoming':
                return 'schedule';
            case 'completed':
                return 'check-circle';
            case 'cancelled':
                return 'cancel';
            default:
                return 'event';
        }
    };

    const renderAppointmentCard = (appointment) => (
        <TouchableOpacity
            key={appointment.id}
            style={[styles.appointmentCard, { backgroundColor: colorScheme.surface }]}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.doctorInfo}>
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
                    <View style={styles.doctorDetails}>
                        <Text
                            style={[styles.doctorName, { color: colorScheme.textPrimary }]}
                        >
                            {appointment.doctorName}
                        </Text>
                        <Text
                            style={[styles.specialty, { color: colorScheme.textSecondary }]}
                        >
                            {appointment.specialty}
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
                    <Text
                        style={[styles.detailText, { color: colorScheme.textPrimary }]}
                    >
                        {appointment.date}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <MaterialIcons
                        name="access-time"
                        size={18}
                        color={colorScheme.textSecondary}
                    />
                    <Text
                        style={[styles.detailText, { color: colorScheme.textPrimary }]}
                    >
                        {appointment.time}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <MaterialIcons
                        name={appointment.type === 'Teleconsultation' ? 'videocam' : 'location-on'}
                        size={18}
                        color={colorScheme.textSecondary}
                    />
                    <Text
                        style={[styles.detailText, { color: colorScheme.textPrimary }]}
                    >
                        {appointment.type}
                    </Text>
                </View>
            </View>

            {appointment.status === 'upcoming' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.rescheduleButton,
                            { borderColor: colorScheme.border },
                        ]}
                    >
                        <Text
                            style={[styles.actionButtonText, { color: colorScheme.primary }]}
                        >
                            Reschedule
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.cancelButton,
                            { borderColor: colorScheme.border },
                        ]}
                    >
                        <Text
                            style={[styles.actionButtonText, { color: colorScheme.error }]}
                        >
                            Cancel
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View
            style={[styles.container, { backgroundColor: colorScheme.background }]}
        >
            <SafeHeader title="Appointments" showBack={true} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersContainer}
                    contentContainerStyle={styles.filtersContent}
                >
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter.id}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor:
                                        selectedFilter === filter.id
                                            ? colorScheme.primary
                                            : colorScheme.surface,
                                    borderColor: colorScheme.border,
                                },
                            ]}
                            onPress={() => setSelectedFilter(filter.id)}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons
                                name={filter.icon}
                                size={18}
                                color={
                                    selectedFilter === filter.id
                                        ? '#FFFFFF'
                                        : colorScheme.textSecondary
                                }
                            />
                            <Text
                                style={[
                                    styles.filterLabel,
                                    {
                                        color:
                                            selectedFilter === filter.id
                                                ? '#FFFFFF'
                                                : colorScheme.textPrimary,
                                    },
                                ]}
                            >
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Upcoming Appointments */}
                <View style={styles.section}>
                    <Text
                        style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}
                    >
                        Upcoming Appointments
                    </Text>
                    {upcomingAppointments.map(renderAppointmentCard)}
                </View>

                {/* Past Appointments */}
                <View style={styles.section}>
                    <Text
                        style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}
                    >
                        Past Appointments
                    </Text>
                    {pastAppointments.map(renderAppointmentCard)}
                </View>
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
    filtersContainer: {
        marginVertical: Spacing.md,
    },
    filtersContent: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    filterLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    section: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
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
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    actionButton: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
    },
    rescheduleButton: {},
    cancelButton: {},
    actionButtonText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    fab: {
        position: 'absolute',
        right: Spacing.lg,
        bottom: Spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.lg,
    },
});
