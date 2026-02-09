import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export default function AppointmentConfirmationScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colorScheme } = useTheme();

    const { doctorName, specialty, date, time, appointmentType, meetLink } = params;

    const isTeleconsult = appointmentType === 'TELECONSULT';

    const handleOpenMeetLink = async () => {
        if (meetLink) {
            try {
                await Linking.openURL(meetLink);
            } catch (error) {
                Alert.alert('Error', 'Could not open the Meet link. Please open it manually.');
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    return (
        <View
            style={[styles.container, { backgroundColor: colorScheme.background }]}
        >
            <SafeHeader title="Confirmation" showBack={false} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Success Icon */}
                <View style={styles.successContainer}>
                    <View
                        style={[
                            styles.successCircle,
                            { backgroundColor: `${colorScheme.success}20` },
                        ]}
                    >
                        <MaterialIcons
                            name="check-circle"
                            size={80}
                            color={colorScheme.success}
                        />
                    </View>
                    <Text
                        style={[styles.successTitle, { color: colorScheme.textPrimary }]}
                    >
                        Appointment Booked!
                    </Text>
                    <Text
                        style={[
                            styles.successMessage,
                            { color: colorScheme.textSecondary },
                        ]}
                    >
                        Your appointment has been successfully scheduled
                    </Text>
                </View>

                {/* Appointment Summary */}
                <View style={styles.section}>
                    <Text
                        style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}
                    >
                        Appointment Details
                    </Text>
                    <View
                        style={[styles.summaryCard, { backgroundColor: colorScheme.surface }]}
                    >
                        <View style={styles.summaryRow}>
                            <View
                                style={[
                                    styles.iconContainer,
                                    { backgroundColor: colorScheme.primaryLight },
                                ]}
                            >
                                <MaterialIcons
                                    name="person"
                                    size={24}
                                    color={colorScheme.primary}
                                />
                            </View>
                            <View style={styles.summaryContent}>
                                <Text
                                    style={[styles.summaryLabel, { color: colorScheme.textSecondary }]}
                                >
                                    Doctor
                                </Text>
                                <Text
                                    style={[styles.summaryValue, { color: colorScheme.textPrimary }]}
                                >
                                    {doctorName || 'Doctor'}
                                </Text>
                                <Text
                                    style={[
                                        styles.summarySubvalue,
                                        { color: colorScheme.textTertiary },
                                    ]}
                                >
                                    {specialty || 'Specialist'}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[styles.divider, { backgroundColor: colorScheme.border }]}
                        />

                        <View style={styles.summaryRow}>
                            <View
                                style={[
                                    styles.iconContainer,
                                    { backgroundColor: `${colorScheme.info}20` },
                                ]}
                            >
                                <MaterialIcons
                                    name="calendar-today"
                                    size={24}
                                    color={colorScheme.info}
                                />
                            </View>
                            <View style={styles.summaryContent}>
                                <Text
                                    style={[styles.summaryLabel, { color: colorScheme.textSecondary }]}
                                >
                                    Date & Time
                                </Text>
                                <Text
                                    style={[styles.summaryValue, { color: colorScheme.textPrimary }]}
                                >
                                    {formatDate(date)}
                                </Text>
                                <Text
                                    style={[
                                        styles.summarySubvalue,
                                        { color: colorScheme.textTertiary },
                                    ]}
                                >
                                    {formatTime(time)}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[styles.divider, { backgroundColor: colorScheme.border }]}
                        />

                        <View style={styles.summaryRow}>
                            <View
                                style={[
                                    styles.iconContainer,
                                    { backgroundColor: isTeleconsult ? `${colorScheme.info}20` : `${colorScheme.success}20` },
                                ]}
                            >
                                <MaterialIcons
                                    name={isTeleconsult ? "video-call" : "location-on"}
                                    size={24}
                                    color={isTeleconsult ? colorScheme.info : colorScheme.success}
                                />
                            </View>
                            <View style={styles.summaryContent}>
                                <Text
                                    style={[styles.summaryLabel, { color: colorScheme.textSecondary }]}
                                >
                                    Type
                                </Text>
                                <Text
                                    style={[styles.summaryValue, { color: colorScheme.textPrimary }]}
                                >
                                    {isTeleconsult ? 'Teleconsultation' : 'In-Person Visit'}
                                </Text>
                                {isTeleconsult && meetLink && (
                                    <TouchableOpacity
                                        onPress={handleOpenMeetLink}
                                        style={styles.meetLinkContainer}
                                    >
                                        <MaterialIcons name="videocam" size={16} color={colorScheme.info} />
                                        <Text style={[styles.meetLinkText, { color: colorScheme.info }]}>
                                            {meetLink}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </View>



                {/* Action Buttons */}
                <View style={styles.actionsSection}>

                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.secondaryButton,
                            { borderColor: colorScheme.border },
                        ]}
                        onPress={() => router.replace('/appointments')}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons
                            name="list"
                            size={20}
                            color={colorScheme.primary}
                        />
                        <Text
                            style={[
                                styles.actionButtonText,
                                { color: colorScheme.primary },
                            ]}
                        >
                            View Appointments
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.secondaryButton,
                            { borderColor: colorScheme.border },
                        ]}
                        onPress={() => router.replace('/(tabs)/dashboard')}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons
                            name="home"
                            size={20}
                            color={colorScheme.textSecondary}
                        />
                        <Text
                            style={[
                                styles.actionButtonText,
                                { color: colorScheme.textSecondary },
                            ]}
                        >
                            Back to Home
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    successCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    successTitle: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.sm,
    },
    successMessage: {
        fontSize: Typography.fontSize.base,
        textAlign: 'center',
        paddingHorizontal: Spacing.xxxl,
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
    summaryCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadow.md,
    },
    summaryRow: {
        flexDirection: 'row',
        paddingVertical: Spacing.sm,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    summaryLabel: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.xs,
    },
    summaryValue: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 2,
    },
    summarySubvalue: {
        fontSize: Typography.fontSize.sm,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.md,
    },
    actionsSection: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
    meetLinkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
        gap: Spacing.xs,
    },
    meetLinkText: {
        fontSize: Typography.fontSize.xs,
        textDecorationLine: 'underline',
        flexShrink: 1,
    },
});
