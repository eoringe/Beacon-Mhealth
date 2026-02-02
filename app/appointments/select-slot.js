import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { useAlert } from '@/contexts/AlertContext';
import { SafeHeader } from '@/components/SafeHeader';
import { CustomLoading } from '@/components/CustomLoading';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import appointmentService from '@/services/appointmentService';
import mpesaService from '@/services/mpesaService';

export default function SelectSlotScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();
    const { showAlert } = useAlert();

    const doctor = params.doctor ? JSON.parse(params.doctor) : null;

    // Detect if this is a guest booking (child has no registration number)
    const isGuestBooking = selectedChild && !selectedChild.registration_number && !selectedChild.registrationNumber;

    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [booking, setBooking] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [appointmentType, setAppointmentType] = useState('IN_PERSON');

    // Guest booking fields (parent/guardian details)
    const [parentFirstName, setParentFirstName] = useState('');
    const [parentLastName, setParentLastName] = useState('');
    const [parentPhone, setParentPhone] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [parentGender, setParentGender] = useState('');

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

        // Validate guest booking fields
        if (isGuestBooking) {
            if (!parentFirstName || !parentLastName) {
                Alert.alert('Missing Information', 'Please enter parent/guardian name');
                return;
            }
            if (!parentPhone) {
                Alert.alert('Missing Information', 'Please enter parent phone number');
                return;
            }
        }

        // IF GUEST BOOKING: Use guest appointment endpoint
        if (isGuestBooking) {
            const guestData = {
                parent_first_name: parentFirstName,
                parent_last_name: parentLastName,
                parent_phone: parentPhone,
                parent_email: parentEmail || null,
                parent_gender: parentGender || null,
                child_first_name: selectedChild?.firstName || selectedChild?.first_name || selectedChild?.name?.split(' ')[0] || '',
                child_last_name: selectedChild?.lastName || selectedChild?.last_name || selectedChild?.name?.split(' ').slice(1).join(' ') || '',
                child_dob: selectedChild?.dateOfBirth || selectedChild?.date_of_birth || selectedChild?.dob || '',
                child_gender: selectedChild?.gender || 'Male',
                local_child_id: selectedChild?.id || null, // Pass local ID so backend can update it
                doctor_id: doctor.id,
                appointment_date: selectedDate,
                start_time: selectedTime,
            };

            try {
                setBooking(true);
                const response = await appointmentService.createGuestAppointment(guestData);

                // Navigate to confirmation screen
                router.push({
                    pathname: '/appointments/confirmation',
                    params: {
                        doctorName: doctor.name,
                        specialty: doctor.specialty,
                        date: selectedDate,
                        time: selectedTime,
                        appointmentType: appointmentType,
                        meetLink: '',
                        eventId: '',
                        isGuest: 'true',
                    }
                });
                showAlert('Success', response.message || 'Appointment booked successfully!', [], 'success');
            } catch (error) {
                Alert.alert(
                    'Booking Failed',
                    error.message || 'Failed to book appointment. Please try again.'
                );
                console.error('Error booking guest appointment:', error);
            } finally {
                setBooking(false);
            }
            return;
        }

        const appointmentData = {
            doctorId: doctor.id,
            childId: selectedChild?.id || null,
            appointmentDate: selectedDate,
            appointmentTime: selectedTime,
            reason: reason || null,
            notes: notes || null,
            appointmentType: appointmentType,
        };

        // IF TELECONSULT: Payment Flow
        if (appointmentType === 'TELECONSULT') {
            if (!phoneNumber) {
                Alert.alert('Phone Required', 'Please enter your M-Pesa phone number for payment.');
                return;
            }

            try {
                setBooking(true);
                setProcessingPayment(true);

                // 1. Initiate Payment
                const paymentResponse = await mpesaService.initiateAppointmentPayment(
                    phoneNumber,
                    1.00, // Testing Amount as requested
                    appointmentData
                );

                // 2. Poll for Status
                mpesaService.pollPaymentStatus(
                    paymentResponse.checkout_request_id,
                    (receipt) => {
                        setBooking(false);
                        setProcessingPayment(false);

                        // Navigate to confirmation
                        router.push({
                            pathname: '/appointments/confirmation',
                            params: {
                                doctorName: doctor.name,
                                specialty: doctor.specialty,
                                date: selectedDate,
                                time: selectedTime,
                                appointmentType: appointmentType,
                                meetLink: '',
                                eventId: '',
                            }
                        });
                        showAlert('Payment Successful', `Receipt: ${receipt}. Your appointment is booked.`, [], 'success');
                    },
                    (error) => {
                        setBooking(false);
                        setProcessingPayment(false);
                        showAlert('Payment Failed', error, [], 'error');
                    }
                );

            } catch (error) {
                setBooking(false);
                setProcessingPayment(false);
                showAlert('Payment Error', error.message || 'Payment initiation failed', [], 'error');
            }
            return;
        }

        try {
            setBooking(true);
            const response = await appointmentService.createAppointment(appointmentData);

            // Navigate to confirmation screen
            router.push({
                pathname: '/appointments/confirmation',
                params: {
                    doctorName: doctor.name,
                    specialty: doctor.specialty,
                    date: selectedDate,
                    time: selectedTime,
                    appointmentType: appointmentType,
                    meetLink: response.google_meet_link || '',
                    eventId: response.google_calendar_event_id || '',
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

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl + 100 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
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

                    {/* Appointment Type Selector */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                            Appointment Type
                        </Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[
                                    styles.typeOption,
                                    {
                                        backgroundColor: appointmentType === 'IN_PERSON'
                                            ? colorScheme.primary
                                            : colorScheme.surface,
                                        borderColor: appointmentType === 'IN_PERSON'
                                            ? colorScheme.primary
                                            : colorScheme.border,
                                    },
                                ]}
                                onPress={() => setAppointmentType('IN_PERSON')}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons
                                    name="location-on"
                                    size={24}
                                    color={appointmentType === 'IN_PERSON' ? '#FFFFFF' : colorScheme.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.typeOptionText,
                                        {
                                            color: appointmentType === 'IN_PERSON'
                                                ? '#FFFFFF'
                                                : colorScheme.textPrimary,
                                        },
                                    ]}
                                >
                                    In-Person
                                </Text>
                            </TouchableOpacity>

                            {/* TEMPORARILY DISABLED PER USER REQUEST
                            <TouchableOpacity
                                style={[
                                    styles.typeOption,
                                    {
                                        backgroundColor: appointmentType === 'TELECONSULT'
                                            ? colorScheme.primary
                                            : colorScheme.surface,
                                        borderColor: appointmentType === 'TELECONSULT'
                                            ? colorScheme.primary
                                            : colorScheme.border,
                                    },
                                ]}
                                onPress={() => setAppointmentType('TELECONSULT')}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons
                                    name="video-call"
                                    size={24}
                                    color={appointmentType === 'TELECONSULT' ? '#FFFFFF' : colorScheme.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.typeOptionText,
                                        {
                                            color: appointmentType === 'TELECONSULT'
                                                ? '#FFFFFF'
                                                : colorScheme.textPrimary,
                                        },
                                    ]}
                                >
                                    Teleconsult
                                </Text>
                            </TouchableOpacity>
                            */}
                        </View>
                        {appointmentType === 'TELECONSULT' && (
                            <View>
                                <Text style={[styles.helperText, { color: colorScheme.info, marginBottom: Spacing.sm }]}>
                                    📹 A Google Meet link will be generated for this appointment
                                </Text>
                                <Text style={[styles.label, { color: colorScheme.textPrimary, marginBottom: Spacing.xs }]}>
                                    M-Pesa Phone Number for Payment
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
                                    placeholder="e.g., 0712345678"
                                    placeholderTextColor={colorScheme.textTertiary}
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        )}
                    </View>

                    {/* Guest Booking Notice & Parent/Guardian Details */}
                    {isGuestBooking && (
                        <View style={styles.section}>
                            <View style={[styles.guestNotice, { backgroundColor: colorScheme.warning + '20', borderColor: colorScheme.warning }]}>
                                <MaterialIcons name="info-outline" size={20} color={colorScheme.warning} />
                                <Text style={{ color: colorScheme.textPrimary, marginLeft: 8, flex: 1, fontSize: 13 }}>
                                    Your child doesn't have a registration number yet. Please provide parent/guardian details to complete the booking.
                                </Text>
                            </View>

                            <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary, marginTop: 16 }]}>
                                Parent/Guardian Details
                            </Text>

                            <View style={styles.formRow}>
                                <View style={styles.formHalf}>
                                    <Text style={[styles.label, { color: colorScheme.textSecondary }]}>First Name *</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colorScheme.surface, color: colorScheme.textPrimary, borderColor: colorScheme.border }]}
                                        placeholder="First name"
                                        placeholderTextColor={colorScheme.textTertiary}
                                        value={parentFirstName}
                                        onChangeText={setParentFirstName}
                                    />
                                </View>
                                <View style={styles.formHalf}>
                                    <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Last Name *</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colorScheme.surface, color: colorScheme.textPrimary, borderColor: colorScheme.border }]}
                                        placeholder="Last name"
                                        placeholderTextColor={colorScheme.textTertiary}
                                        value={parentLastName}
                                        onChangeText={setParentLastName}
                                    />
                                </View>
                            </View>

                            <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Phone Number *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colorScheme.surface, color: colorScheme.textPrimary, borderColor: colorScheme.border }]}
                                placeholder="e.g., 0712345678"
                                placeholderTextColor={colorScheme.textTertiary}
                                value={parentPhone}
                                onChangeText={setParentPhone}
                                keyboardType="phone-pad"
                            />

                            <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Email (Optional)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colorScheme.surface, color: colorScheme.textPrimary, borderColor: colorScheme.border }]}
                                placeholder="email@example.com"
                                placeholderTextColor={colorScheme.textTertiary}
                                value={parentEmail}
                                onChangeText={setParentEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Gender</Text>
                            <View style={styles.genderRow}>
                                {['Male', 'Female'].map((gender) => (
                                    <TouchableOpacity
                                        key={gender}
                                        style={[
                                            styles.genderOption,
                                            {
                                                backgroundColor: parentGender === gender ? colorScheme.primary : colorScheme.surface,
                                                borderColor: parentGender === gender ? colorScheme.primary : colorScheme.border,
                                            }
                                        ]}
                                        onPress={() => setParentGender(gender)}
                                    >
                                        <Text style={{ color: parentGender === gender ? '#FFFFFF' : colorScheme.textPrimary }}>
                                            {gender}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}


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
                                    <CustomLoading size={24} text="Checking availability..." />
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
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <CustomLoading size={20} color="#FFFFFF" />
                                    <Text style={styles.bookButtonText}>
                                        {processingPayment ? 'Processing Payment...' : 'Booking Appointment...'}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.bookButtonText}>
                                    {appointmentType === 'TELECONSULT' ? 'Pay & Book' : 'Book Appointment'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
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
    typeSelector: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    typeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: Spacing.sm,
        ...Shadow.sm,
    },
    typeOptionText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    // Guest booking styles
    guestNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    formRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    formHalf: {
        flex: 1,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    genderRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    genderOption: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
});
