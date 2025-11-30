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
import { Calendar } from 'react-native-calendars';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export default function BookAppointmentScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme, isDark } = useTheme();
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [appointmentType, setAppointmentType] = useState('in-person');

    const doctors = [
        {
            id: 1,
            name: 'Dr. Sarah Johnson',
            specialty: 'Pediatrician',
            rating: 4.8,
        },
        {
            id: 2,
            name: 'Dr. Michael Chen',
            specialty: 'General Practitioner',
            rating: 4.9,
        },
        {
            id: 3,
            name: 'Dr. Emily Thompson',
            specialty: 'Pediatric Specialist',
            rating: 4.7,
        },
    ];

    const timeSlots = [
        '09:00 AM',
        '10:00 AM',
        '11:00 AM',
        '02:00 PM',
        '03:00 PM',
        '04:00 PM',
    ];

    const appointmentTypes = [
        { id: 'in-person', label: 'In-Person', icon: 'location-on' },
        { id: 'teleconsult', label: 'Teleconsultation', icon: 'videocam' },
    ];

    const handleContinue = () => {
        if (selectedDate && selectedTime && selectedDoctor) {
            router.push('/appointments/confirmation');
        }
    };

    return (
        <View
            style={[styles.container, { backgroundColor: colorScheme.background }]}
        >
            <SafeHeader title="Book Appointment" showBack={true} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Doctor Selection */}
                <View style={styles.section}>
                    <Text
                        style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}
                    >
                        Select Doctor
                    </Text>
                    {doctors.map((doctor) => (
                        <TouchableOpacity
                            key={doctor.id}
                            style={[
                                styles.doctorCard,
                                {
                                    backgroundColor: colorScheme.surface,
                                    borderWidth: selectedDoctor?.id === doctor.id ? 2 : 0,
                                    borderColor: colorScheme.primary,
                                },
                            ]}
                            onPress={() => setSelectedDoctor(doctor)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.doctorAvatar,
                                    { backgroundColor: colorScheme.primaryLight },
                                ]}
                            >
                                <MaterialIcons
                                    name="person"
                                    size={28}
                                    color={colorScheme.primary}
                                />
                            </View>
                            <View style={styles.doctorInfo}>
                                <Text
                                    style={[
                                        styles.doctorName,
                                        { color: colorScheme.textPrimary },
                                    ]}
                                >
                                    {doctor.name}
                                </Text>
                                <Text
                                    style={[
                                        styles.doctorSpecialty,
                                        { color: colorScheme.textSecondary },
                                    ]}
                                >
                                    {doctor.specialty}
                                </Text>
                                <View style={styles.ratingRow}>
                                    <MaterialIcons
                                        name="star"
                                        size={16}
                                        color={colorScheme.warning}
                                    />
                                    <Text
                                        style={[styles.rating, { color: colorScheme.textSecondary }]}
                                    >
                                        {doctor.rating}
                                    </Text>
                                </View>
                            </View>
                            {selectedDoctor?.id === doctor.id && (
                                <MaterialIcons
                                    name="check-circle"
                                    size={24}
                                    color={colorScheme.primary}
                                />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Appointment Type */}
                <View style={styles.section}>
                    <Text
                        style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}
                    >
                        Appointment Type
                    </Text>
                    <View style={styles.typeButtons}>
                        {appointmentTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.typeButton,
                                    {
                                        backgroundColor:
                                            appointmentType === type.id
                                                ? colorScheme.primary
                                                : colorScheme.surface,
                                        borderColor: colorScheme.border,
                                    },
                                ]}
                                onPress={() => setAppointmentType(type.id)}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons
                                    name={type.icon}
                                    size={24}
                                    color={
                                        appointmentType === type.id
                                            ? '#FFFFFF'
                                            : colorScheme.textSecondary
                                    }
                                />
                                <Text
                                    style={[
                                        styles.typeLabel,
                                        {
                                            color:
                                                appointmentType === type.id
                                                    ? '#FFFFFF'
                                                    : colorScheme.textPrimary,
                                        },
                                    ]}
                                >
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Calendar */}
                <View style={styles.section}>
                    <Text
                        style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}
                    >
                        Select Date
                    </Text>
                    <View style={[styles.calendarCard, { backgroundColor: colorScheme.surface }]}>
                        <Calendar
                            onDayPress={(day) => setSelectedDate(day.dateString)}
                            markedDates={{
                                [selectedDate]: {
                                    selected: true,
                                    selectedColor: colorScheme.primary,
                                },
                            }}
                            minDate={new Date().toISOString().split('T')[0]}
                            theme={{
                                backgroundColor: colorScheme.surface,
                                calendarBackground: colorScheme.surface,
                                textSectionTitleColor: colorScheme.textSecondary,
                                selectedDayBackgroundColor: colorScheme.primary,
                                selectedDayTextColor: '#FFFFFF',
                                todayTextColor: colorScheme.primary,
                                dayTextColor: colorScheme.textPrimary,
                                textDisabledColor: colorScheme.textTertiary,
                                monthTextColor: colorScheme.textPrimary,
                                textMonthFontWeight: 'bold',
                                arrowColor: colorScheme.primary,
                            }}
                        />
                    </View>
                </View>

                {/* Time Slots */}
                {selectedDate && (
                    <View style={styles.section}>
                        <Text
                            style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}
                        >
                            Select Time
                        </Text>
                        <View style={styles.timeGrid}>
                            {timeSlots.map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    style={[
                                        styles.timeSlot,
                                        {
                                            backgroundColor:
                                                selectedTime === time
                                                    ? colorScheme.primary
                                                    : colorScheme.surface,
                                            borderColor: colorScheme.border,
                                        },
                                    ]}
                                    onPress={() => setSelectedTime(time)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.timeText,
                                            {
                                                color:
                                                    selectedTime === time
                                                        ? '#FFFFFF'
                                                        : colorScheme.textPrimary,
                                            },
                                        ]}
                                    >
                                        {time}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Continue Button */}
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        {
                            backgroundColor:
                                selectedDate && selectedTime && selectedDoctor
                                    ? colorScheme.primary
                                    : colorScheme.border,
                        },
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedDate || !selectedTime || !selectedDoctor}
                    activeOpacity={0.8}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
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
    section: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
    doctorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
        ...Shadow.sm,
    },
    doctorAvatar: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doctorInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    doctorName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 2,
    },
    doctorSpecialty: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.xs,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rating: {
        fontSize: Typography.fontSize.sm,
    },
    typeButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    typeLabel: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
    },
    calendarCard: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        ...Shadow.md,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    timeSlot: {
        width: '31%',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
    },
    timeText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    continueButton: {
        marginHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
});
