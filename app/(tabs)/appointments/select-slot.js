import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { SafeHeader } from '@/components/SafeHeader';
import { CustomLoading } from '@/components/CustomLoading';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import appointmentService from '@/services/appointmentService';
import mpesaService from '@/services/mpesaService';
import { Colors } from '@/constants/theme';

const CONSULTATION_PRICES = {
    'Medical Officer': 1000,
    'Paediatrician': 2000,
    'Developmental Paediatrician': 1,
    'Occupational Therapist': 1500,
    'Speech Therapist': 2000,
    'Physiotherapist': 1500,
    'Psychologist': 2500,
    'Nutritionist': 1500,
    'Default': 1000 // Fallback price
};


export default function SelectSlotScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();
    const { user } = useAuth();
    const { showAlert } = useAlert();

    const specialization = useMemo(() => params.specialization ? JSON.parse(params.specialization) : null, [params.specialization]);

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
    const [isPolling, setIsPolling] = useState(false);


    const [appointmentType, setAppointmentType] = useState('IN_PERSON');
    const [availabilityWindows, setAvailabilityWindows] = useState([]);
    const [fetchingAvailabilityWindows, setFetchingAvailabilityWindows] = useState(false);

    // Payment Modal States
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [paymentPhoneInput, setPaymentPhoneInput] = useState('');
    const [paymentFlowType, setPaymentFlowType] = useState(null); // 'GUEST' or 'AUTH'


    // Guest booking fields (parent/guardian details)
    const [parentFirstName, setParentFirstName] = useState('');
    const [parentLastName, setParentLastName] = useState('');
    const [parentPhone, setParentPhone] = useState('');
    const [parentEmail, setParentEmail] = useState('');
    const [parentGender, setParentGender] = useState('');

    useEffect(() => {
        if (user) {
            const names = user.displayName ? user.displayName.split(' ') : ['Guest', 'User'];
            setParentFirstName(names[0]);
            setParentLastName(names.slice(1).join(' ') || '');
            setParentPhone(user.phoneNumber || '');
            setParentEmail(user.email || '');
            // Leave gender empty to force selection if not known, or default if you prefer.
        }
    }, [user]);

    useEffect(() => {
        if (specialization?.id) {
            fetchAvailabilityWindows();
        }
    }, [specialization?.id]);

    const fetchAvailabilityWindows = async () => {
        if (fetchingAvailabilityWindows) return;
        try {
            setFetchingAvailabilityWindows(true);
            const windows = await appointmentService.getSpecializationTeleWindows(specialization.id);
            if (windows && Array.isArray(windows)) {
                setAvailabilityWindows(windows);
            }
        } catch (error) {
            console.error('Error fetching availability windows:', error);
        } finally {
            setFetchingAvailabilityWindows(false);
        }
    };

    useEffect(() => {
        if (selectedDate && specialization?.id) {
            fetchAvailability();
        } else {
            setAvailableSlots([]);
            setSelectedTime('');
        }
    }, [selectedDate, appointmentType, specialization?.id]);

    const fetchAvailability = async () => {
        if (loadingSlots) return;
        try {
            setLoadingSlots(true);
            setSelectedTime('');
            const data = await appointmentService.getSpecializationAvailability(
                specialization.id,
                selectedDate,
                appointmentType
            );

            if (!data.available) {
                showAlert('Unavailable', data.reason || 'No slots available for this date', [], 'warning');
                setAvailableSlots([]);
            } else {
                let slots = data.slots || [];

                // Filter out past times if the selected date is today
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const localDateStr = `${year}-${month}-${day}`;

                if (selectedDate === localDateStr) {
                    const currentHour = today.getHours();
                    const currentMinute = today.getMinutes();

                    slots = slots.filter(timeString => {
                        // Slots are expected to be in "HH:MM" format (24-hour)
                        const [slotHourStr, slotMinuteStr] = timeString.split(':');
                        const slotHour = parseInt(slotHourStr, 10);
                        const slotMinute = parseInt(slotMinuteStr, 10);

                        if (slotHour > currentHour) return true;
                        if (slotHour === currentHour && slotMinute > currentMinute) return true;
                        return false;
                    });
                }

                setAvailableSlots(slots);
            }
        } catch (error) {
            showAlert('Error', 'Failed to check availability. Please try again.', [], 'error');
            console.error('Error fetching availability:', error);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleBookAppointment = async () => {
        if (!selectedDate || !selectedTime) {
            showAlert('Missing Information', 'Please select a date and time', [], 'warning');
            return;
        }

        // Validate guest booking fields
        if (isGuestBooking) {
            if (!parentFirstName || !parentLastName) {
                showAlert('Missing Information', 'Please enter parent/guardian name', [], 'warning');
                return;
            }
            if (!parentPhone) {
                showAlert('Missing Information', 'Please enter parent phone number', [], 'warning');
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
                local_child_id: selectedChild?.id || null,
                specialization_id: specialization.id,
                appointment_date: selectedDate,
                start_time: selectedTime,
                appointment_type: appointmentType || 'IN_PERSON',
            };

            // GUEST TELECONSULT: Require M-Pesa payment first
            if (appointmentType === 'TELECONSULT') {
                setPaymentPhoneInput(parentPhone || '');
                setPaymentFlowType('GUEST');
                setIsPaymentModalVisible(true);
                return;
            }

            // GUEST IN-PERSON: No payment required
            try {
                setBooking(true);
                const response = await appointmentService.createGuestAppointment(guestData);

                router.push({
                    pathname: '/appointments/confirmation',
                    params: {
                        doctorName: 'Assigned automatically',
                        specialty: specialization.name,
                        date: selectedDate,
                        time: selectedTime,
                        appointmentType: appointmentType,
                        meetLink: response.data.google_meet_link || '',
                        eventId: response.data.google_calendar_event_id || '',
                        isGuest: 'true',
                    }
                });
                showAlert('Success', response.message || 'Appointment booked successfully!', [], 'success');
            } catch (error) {
                showAlert('Booking Failed', error.message || 'Failed to book appointment. Please try again.', [], 'error');
                console.error('Error booking guest appointment:', error);
            } finally {
                setBooking(false);
            }
            return;
        }

        const appointmentData = {
            specializationId: specialization.id,
            childId: selectedChild?.id || null,
            appointmentDate: selectedDate,
            appointmentTime: selectedTime,
            reason: reason || null,
            notes: notes || null,
            appointmentType: appointmentType,
        };

        // TELECONSULTATION PAY & BOOK FLOW
        if (appointmentType === 'TELECONSULT') {
            setPaymentPhoneInput(user?.phoneNumber || parentPhone || '');
            setPaymentFlowType('AUTH');
            setIsPaymentModalVisible(true);
            return;
        }

        // IN-PERSON BOOKING FLOW
        try {
            setBooking(true);
            const response = await appointmentService.createAppointment(appointmentData);

            // Navigate to confirmation screen
            router.push({
                pathname: '/appointments/confirmation',
                params: {
                    doctorName: 'Assigned automatically',
                    specialty: specialization.name,
                    date: selectedDate,
                    time: selectedTime,
                    appointmentType: appointmentType,
                    meetLink: response.google_meet_link || '',
                    eventId: response.google_calendar_event_id || '',
                }
            });
        } catch (error) {
            showAlert('Booking Failed', error.message || 'Failed to book appointment. Please try again.', [], 'error');
            console.error('Error booking appointment:', error);
        } finally {
            setBooking(false);
        }
    };

    const executePaymentAndBooking = async () => {
        const phone = paymentPhoneInput.trim();
        if (!phone || phone.length < 9) {
            showAlert('Invalid Number', 'Please provide a valid phone number to pay via M-Pesa.', [], 'error');
            return;
        }

        setIsPaymentModalVisible(false);
        setBooking(true);
        setProcessingPayment(true);

        try {
            // Determine price based on specialization name
            const specName = specialization.name;
            const amount = CONSULTATION_PRICES[specName] || CONSULTATION_PRICES['Default'];

            const paymentResponse = await mpesaService.initiateAppointmentPayment(
                phone,
                amount,
                {
                    childId: selectedChild?.id,
                    specializationId: specialization.id,
                    doctorId: 0,
                    appointmentDate: selectedDate,
                    appointmentTime: selectedTime,
                    appointmentType: 'TELECONSULT',
                    reason: reason || null,
                    notes: notes || null
                }
            );

            console.log('Payment Initiated:', paymentResponse);
            setProcessingPayment(false);
            setIsPolling(true);

            mpesaService.pollPaymentStatus(
                paymentResponse.checkout_request_id,
                async (statusData) => {
                    // Payment succeeded — now create the appointment
                    try {
                        let meetLink = statusData.google_meet_link;
                        let appointmentId = statusData.appointment_id;

                        if (paymentFlowType === 'GUEST') {
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
                                specialization_id: specialization.id,
                                appointment_date: selectedDate,
                                start_time: selectedTime,
                                appointment_type: 'TELECONSULT',
                            };
                            const bookingResponse = await appointmentService.createGuestAppointment(guestData);
                            meetLink = bookingResponse?.google_meet_link || meetLink;
                            appointmentId = bookingResponse?.appointment_id || appointmentId;
                        }

                        setIsPolling(false);
                        setBooking(false);

                        router.push({
                            pathname: '/appointments/confirmation',
                            params: {
                                doctorName: 'Assigned automatically',
                                specialty: specialization.name,
                                date: selectedDate,
                                time: selectedTime,
                                appointmentType: 'TELECONSULT',
                                meetLink: meetLink || '',
                                appointmentId: appointmentId || '',
                                isGuest: paymentFlowType === 'GUEST' ? 'true' : 'false',
                            }
                        });
                        showAlert('Success', `Payment successful(Receipt: ${statusData.mpesa_receipt_number}).Appointment booked!`, [], 'success');
                    } catch (bookErr) {
                        setIsPolling(false);
                        setBooking(false);
                        showAlert('Booking Error', 'Payment received but appointment creation failed. Please contact support.', [], 'error');
                    }
                },
                (failureReason) => {
                    setIsPolling(false);
                    setBooking(false);
                    showAlert('Payment Failed', failureReason, [], 'error');
                }
            );
        } catch (error) {
            setBooking(false);
            setProcessingPayment(false);
            showAlert('Payment Error', error.message || 'Failed to initiate payment', [], 'error');
        }
    };

    // Helper to disable dates with no availability windows
    const isDateDisabled = (dateString) => {
        const [y, m, d] = dateString.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const dayOfWeek = date.getDay(); // 0-6

        // Map frontend type to backend window_type
        const targetType = appointmentType === 'TELECONSULT' ? 'teleconsult' : 'in_person';

        // Check if there are ANY windows for this day of the week and this type
        const hasWindows = availabilityWindows.some(w => {
            const matchesType = !w.window_type || w.window_type === targetType || 
                               (targetType === 'teleconsult' && w.window_type !== 'in_person');
            return w.day_of_week === dayOfWeek && matchesType;
        });

        // If no windows defined at all for this specialization, default to Mon-Fri (legacy behavior)
        if (availabilityWindows.length === 0) {
            return dayOfWeek === 0 || dayOfWeek === 6;
        }

        return !hasWindows;
    };


    // Format time from 24hr to 12hr
    const formatTime = (time24) => {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm} `;
    };

    if (!specialization) {
        return (
            <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
                <SafeHeader title="Select Slot" showBack={true} />
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colorScheme.error }]}>
                        Specialization information missing
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
                    {/* Specialization Summary */}
                    <View style={styles.doctorSummary}>
                        <View style={[styles.doctorCard, { backgroundColor: colorScheme.surface }]}>
                            <View
                                style={[
                                    styles.doctorAvatar,
                                    { backgroundColor: colorScheme.primaryLight },
                                ]}
                            >
                                <MaterialIcons
                                    name="medical-services"
                                    size={28}
                                    color={colorScheme.primary}
                                />
                            </View>
                            <View style={styles.doctorInfo}>
                                <Text style={[styles.doctorName, { color: colorScheme.textPrimary }]}>
                                    {specialization.name}
                                </Text>
                                <Text style={[styles.doctorSpecialty, { color: colorScheme.textSecondary }]}>
                                    A doctor will be assigned to you
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
                                    name="videocam"
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
                        </View>

                        {/* Price Display for Teleconsult */}
                        {appointmentType === 'TELECONSULT' && (
                            <View style={[styles.priceTag, { backgroundColor: colorScheme.success + '15', borderColor: colorScheme.success }]}>
                                <MaterialIcons name="payments" size={20} color={colorScheme.success} />
                                <View>
                                    <Text style={[styles.priceLabel, { color: colorScheme.textSecondary }]}>Teleconsultation Fee</Text>
                                    <Text style={[styles.priceValue, { color: colorScheme.success }]}>
                                        KES {(CONSULTATION_PRICES[specialization.name] || CONSULTATION_PRICES['Default']).toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Availability Disclaimer for both In-Person and Teleconsult */}
                        <View style={[styles.disclaimerContainer, { backgroundColor: colorScheme.primaryLight + '20' }]}>
                            <View style={styles.disclaimerHeader}>
                                <MaterialIcons 
                                    name={appointmentType === 'TELECONSULT' ? "videocam" : "location-on"} 
                                    size={18} 
                                    color={colorScheme.primary} 
                                />
                                <Text style={[styles.disclaimerTitle, { color: colorScheme.primary }]}>
                                    {appointmentType === 'TELECONSULT' ? "Teleconsultation" : "In-Person"} Availability
                                </Text>
                            </View>
                            {fetchingAvailabilityWindows ? (
                                <View style={styles.disclaimerLoading}>
                                    <CustomLoading size={14} />
                                </View>
                            ) : (() => {
                                const targetType = appointmentType === 'TELECONSULT' ? 'teleconsult' : 'in_person';
                                const filteredWindows = availabilityWindows.filter(w => 
                                    !w.window_type || w.window_type === targetType || 
                                    (targetType === 'teleconsult' && w.window_type !== 'in_person')
                                );

                                if (filteredWindows.length > 0) {
                                    return (
                                        <View style={styles.windowsList}>
                                            {filteredWindows.reduce((acc, window) => {
                                                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                                const dayName = dayNames[window.day_of_week];
                                                let day = acc.find(d => d.name === dayName);
                                                if (!day) {
                                                    day = { name: dayName, times: [], dayIndex: window.day_of_week };
                                                    acc.push(day);
                                                }

                                                const timeRange = `${window.start_time.substring(0, 5)} - ${window.end_time.substring(0, 5)}`;
                                                if (!day.times.includes(timeRange)) {
                                                    day.times.push(timeRange);
                                                }
                                                return acc;
                                            }, []).sort((a, b) => a.dayIndex - b.dayIndex).map((day, dIdx) => (
                                                <View key={dIdx} style={styles.doctorWindowGroup}>
                                                    <Text style={[styles.disclaimerText, { color: colorScheme.textSecondary }]}>
                                                        • {day.name}: {day.times.join(', ')}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    );
                                } else {
                                    return (
                                        <Text style={[styles.disclaimerText, { color: colorScheme.error }]}>
                                            No {appointmentType === 'TELECONSULT' ? "teleconsultation" : "in-person"} windows defined for this specialization.
                                        </Text>
                                    );
                                }
                            })()}
                            <Text style={[styles.disclaimerFooter, { color: colorScheme.textTertiary }]}>
                                * Only the above days are enabled on the calendar below.
                            </Text>
                        </View>
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
                                    <Text style={[styles.label, { color: colorScheme.textSecondary }]}>First Name</Text>
                                    <View style={[styles.readOnlyInput, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border }]}>
                                        <Text style={{ color: colorScheme.textSecondary }}>{parentFirstName}</Text>
                                    </View>
                                </View>
                                <View style={styles.formHalf}>
                                    <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Last Name</Text>
                                    <View style={[styles.readOnlyInput, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border }]}>
                                        <Text style={{ color: colorScheme.textSecondary }}>{parentLastName}</Text>
                                    </View>
                                </View>
                            </View>

                            <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Phone Number</Text>
                            <View style={[styles.readOnlyInput, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border, marginBottom: 16 }]}>
                                <Text style={{ color: colorScheme.textSecondary }}>{parentPhone || 'Not set in profile'}</Text>
                            </View>

                            <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Email</Text>
                            <View style={[styles.readOnlyInput, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border, marginBottom: 16 }]}>
                                <Text style={{ color: colorScheme.textSecondary }}>{parentEmail || 'Not set in profile'}</Text>
                            </View>

                            <TouchableOpacity onPress={() => router.push('/(tabs)/profile/edit')} style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
                                <Text style={{ color: colorScheme.primary, fontSize: 13 }}>Update details in Profile</Text>
                            </TouchableOpacity>

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
                                    if (!isDateDisabled(day.dateString)) {
                                        setSelectedDate(day.dateString);
                                    }
                                }}
                                markedDates={{
                                    [selectedDate]: {
                                        selected: true,
                                        selectedColor: colorScheme.primary,
                                    }
                                }}
                                minDate={(() => {
                                    const today = new Date();
                                    const year = today.getFullYear();
                                    const month = String(today.getMonth() + 1).padStart(2, '0');
                                    const day = String(today.getDate()).padStart(2, '0');
                                    return `${year}-${month}-${day}`;
                                })()}
                                dayComponent={({ date, state }) => {
                                    const isDisabled = isDateDisabled(date.dateString) || state === 'disabled';
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
                                        {isPolling ? 'Waiting for M-Pesa...' : processingPayment ? 'Processing Payment...' : 'Booking Appointment...'}
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
            {/* Payment Modal for Cross-Platform compatibility instead of Alert.prompt */}
            <Modal
                visible={isPaymentModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsPaymentModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colorScheme.surface }]}>
                        <View style={styles.modalHeader}>
                            <Image
                                source={require('@/assets/images/mpesa-logo.png')}
                                style={styles.mpesaLogo}
                                resizeMode="contain"
                            />
                            <Text style={[styles.modalTitle, { color: colorScheme.textPrimary }]}>M-Pesa Payment</Text>
                        </View>
                        <Text style={[styles.modalMessage, { color: colorScheme.textSecondary }]}>
                            Please enter the phone number to pay KES 1.00 for this teleconsultation (Format: 07XXXXXXXX or 01XXXXXXXX).
                        </Text>
                        <TextInput
                            style={[styles.modalInput, { backgroundColor: colorScheme.background, color: colorScheme.textPrimary, borderColor: colorScheme.border }]}
                            keyboardType="phone-pad"
                            value={paymentPhoneInput}
                            onChangeText={setPaymentPhoneInput}
                            placeholder="07XXXXXXXX"
                            placeholderTextColor={colorScheme.textTertiary}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancelButton]}
                                onPress={() => setIsPaymentModalVisible(false)}
                            >
                                <Text style={[styles.modalCancelText, { color: colorScheme.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalPayButton, { backgroundColor: colorScheme.primary }]}
                                onPress={executePaymentAndBooking}
                            >
                                <Text style={styles.modalPayText}>Pay & Book</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
    readOnlyInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        justifyContent: 'center',
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        ...Shadow.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    mpesaLogo: {
        width: 40,
        height: 40,
    },
    modalTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: '#1F2937',
    },
    modalMessage: {
        fontSize: Typography.fontSize.sm,
        color: '#4B5563',
        marginBottom: Spacing.lg,
        lineHeight: 20,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.base,
        marginBottom: Spacing.xl,
        color: '#1F2937',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.md,
    },
    modalButton: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCancelButton: {
        backgroundColor: '#F3F4F6',
    },
    modalCancelText: {
        color: '#4B5563',
        fontWeight: Typography.fontWeight.semibold,
    },
    modalPayButton: {
        // Background color injected dynamically
    },
    modalPayText: {
        color: '#FFFFFF',
        fontWeight: Typography.fontWeight.semibold,
    },
    disclaimerContainer: {
        marginTop: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    disclaimerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    disclaimerTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.bold,
    },
    disclaimerText: {
        fontSize: Typography.fontSize.xs,
        lineHeight: 18,
        marginLeft: Spacing.sm,
    },
    disclaimerDoctorName: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 2,
    },
    doctorWindowGroup: {
        marginBottom: Spacing.sm,
    },
    disclaimerFooter: {
        fontSize: 10,
        marginTop: Spacing.xs,
        fontStyle: 'italic',
    },
    windowsList: {
        marginTop: Spacing.xs,
    },
    disclaimerLoading: {
        paddingVertical: Spacing.sm,
        alignItems: 'center',
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginTop: Spacing.md,
        gap: Spacing.md,
    },
    priceLabel: {
        fontSize: 12,
        fontWeight: Typography.fontWeight.medium,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: Typography.fontWeight.bold,
    },
});
