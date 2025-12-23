import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import appointmentService from '@/services/appointmentService';

export default function SelectSlotScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();

    const doctor = params.doctor ? JSON.parse(params.doctor) : null;

    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        if (selectedDate && doctor) {
            fetchAvailability();
        } else {
            setAvailableSlots([]);
            setSelectedTime('');
        }
    }, [selectedDate]);

    const fetchAvailability = async () => {
        try {
            setLoadingSlots(true);
            setSelectedTime('');
            const data = await appointmentService.getDoctorAvailability(
                doctor.id,
                selectedDate
            );

            if (!data.available) {
                Alert.alert('Unavailable', data.reason || 'No slots available for this date');
                setAvailableSlots([]);
            } else {
                setAvailableSlots(data.slots || []);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to check availability. Please try again.');
            console.error('Error fetching availability:', error);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleBookAppointment = async () => {
        if (!selectedDate || !selectedTime) {
            Alert.alert('Missing Information', 'Please select a date and time');
            return;
        }

        try {
            setBooking(true);
            const appointmentData = {
                doctorId: doctor.id,
                childId: selectedChild?.id || null,
                appointmentDate: selectedDate,
                appointmentTime: selectedTime,
                reason: reason || null,
                notes: notes || null,
            };

            await appointmentService.createAppointment(appointmentData);

            // Navigate to confirmation screen
            router.push({
                pathname: '/appointments/confirmation',
                params: {
                    doctorName: doctor.name,
                    specialty: doctor.specialty,
                    date: selectedDate,
                    time: selectedTime,
                }
            });
        } catch (error) {
            Alert.alert(
                'Booking Failed',
                error.message || 'Failed to book appointment. Please try again.'
            );
            console.error('Error booking appointment:', error);
        } finally {
            setBooking(false);
        }
    };

    // Helper to disable weekends
    const isWeekend = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    };

    // Format time from 24hr to 12hr
    const formatTime = (time24) => {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    if (!doctor) {
        return (
            <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
                <SafeHeader title="Select Slot" showBack={true} />
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colorScheme.error }]}>
                        Doctor information missing
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Select Date & Time" showBack={true} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Doctor Summary */}
                <View style={styles.doctorSummary}>
                    <View style={[styles.doctorCard, { backgroundColor: colorScheme.surface }]}>
                        {doctor.photo_url ? (
                            <Image
                                source={{ uri: doctor.photo_url }}
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
                                    size={28}
                                    color={colorScheme.primary}
                                />
                            </View>
                        )}
                        <View style={styles.doctorInfo}>
                            <Text style={[styles.doctorName, { color: colorScheme.textPrimary }]}>
                                {doctor.name}
                            </Text>
                            <Text style={[styles.doctorSpecialty, { color: colorScheme.textSecondary }]}>
                                {doctor.specialty}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Calendar */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                        Select Date
                    </Text>
                    <View style={[styles.calendarCard, { backgroundColor: colorScheme.surface }]}>
                        <Calendar
                            onDayPress={(day) => {
                                if (!isWeekend(day.dateString)) {
                                    setSelectedDate(day.dateString);
                                }
                            }}
                            markedDates={{
                                [selectedDate]: {
                                    selected: true,
                                    selectedColor: colorScheme.primary,
                                },
                            }}
                            minDate={new Date().toISOString().split('T')[0]}
                            dayComponent={({ date, state }) => {
                                const isDisabled = isWeekend(date.dateString) || state === 'disabled';
                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (!isDisabled) {
                                                setSelectedDate(date.dateString);
                                            }
                                        }}
                                        disabled={isDisabled}
                                        style={[
                                            styles.dayContainer,
                                            selectedDate === date.dateString && {
                                                backgroundColor: colorScheme.primary,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.dayText,
                                                {
                                                    color: isDisabled
                                                        ? colorScheme.textTertiary
                                                        : selectedDate === date.dateString
                                                            ? '#FFFFFF'
                                                            : colorScheme.textPrimary,
                                                },
                                            ]}
                                        >
                                            {date.day}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                            theme={{
                                backgroundColor: colorScheme.surface,
                                calendarBackground: colorScheme.surface,
                                textSectionTitleColor: colorScheme.textSecondary,
                                monthTextColor: colorScheme.textPrimary,
                                textMonthFontWeight: 'bold',
                                arrowColor: colorScheme.primary,
                            }}
                        />
                    </View>
                    <Text style={[styles.helperText, { color: colorScheme.textTertiary }]}>
                        * Weekends are not available for appointments
                    </Text>
                </View>

                {/* Time Slots */}
                {selectedDate && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                            Select Time
                        </Text>
                        {loadingSlots ? (
                            <View style={styles.slotsLoading}>
                                <ActivityIndicator size="small" color={colorScheme.primary} />
                                <Text style={[styles.loadingText, { color: colorScheme.textSecondary }]}>
                                    Checking availability...
                                </Text>
                            </View>
                        ) : availableSlots.length > 0 ? (
                            <View style={styles.timeGrid}>
                                {availableSlots.map((time) => (
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
                                            {formatTime(time)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={[styles.noSlotsContainer, { backgroundColor: colorScheme.surface }]}>
                                <MaterialIcons name="event-busy" size={48} color={colorScheme.textTertiary} />
                                <Text style={[styles.noSlotsText, { color: colorScheme.textSecondary }]}>
                                    No available time slots for this date
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Reason & Notes */}
                {selectedTime && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                            Appointment Details (Optional)
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colorScheme.surface,
                                    color: colorScheme.textPrimary,
                                    borderColor: colorScheme.border,
                                },
                            ]}
                            placeholder="Reason for visit"
                            placeholderTextColor={colorScheme.textTertiary}
                            value={reason}
                            onChangeText={setReason}
                        />
                        <TextInput
                            style={[
                                styles.input,
                                styles.notesInput,
                                {
                                    backgroundColor: colorScheme.surface,
                                    color: colorScheme.textPrimary,
                                    borderColor: colorScheme.border,
                                },
                            ]}
                            placeholder="Additional notes"
                            placeholderTextColor={colorScheme.textTertiary}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>
                )}

                {/* Book Button */}
                {selectedTime && (
                    <TouchableOpacity
                        style={[
                            styles.bookButton,
                            {
                                backgroundColor: colorScheme.primary,
                                opacity: booking ? 0.7 : 1,
                            },
                        ]}
                        onPress={handleBookAppointment}
                        disabled={booking}
                        activeOpacity={0.8}
                    >
                        {booking ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.bookButtonText}>Book Appointment</Text>
                        )}
                    </TouchableOpacity>
                )}
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: Typography.fontSize.md,
    },
    doctorSummary: {
        padding: Spacing.lg,
    },
    doctorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        ...Shadow.sm,
    },
    doctorPhoto: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.xl,
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
    calendarCard: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        ...Shadow.md,
    },
    dayContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BorderRadius.sm,
    },
    dayText: {
        fontSize: Typography.fontSize.sm,
    },
    helperText: {
        fontSize: Typography.fontSize.xs,
        marginTop: Spacing.xs,
        fontStyle: 'italic',
    },
    slotsLoading: {
        paddingVertical: Spacing.xl,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: Typography.fontSize.base,
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
    noSlotsContainer: {
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    noSlotsText: {
        marginTop: Spacing.md,
        fontSize: Typography.fontSize.base,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.base,
        marginBottom: Spacing.sm,
    },
    notesInput: {
        height: 80,
    },
    bookButton: {
        marginHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginTop: Spacing.md,
        ...Shadow.md,
    },
    bookButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
});
