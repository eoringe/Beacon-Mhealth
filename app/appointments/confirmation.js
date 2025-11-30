import React from 'react';
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

export default function AppointmentConfirmationScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();

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
                                    Dr. Sarah Johnson
                                </Text>
                                <Text
                                    style={[
                                        styles.summarySubvalue,
                                        { color: colorScheme.textTertiary },
                                    ]}
                                >
                                    Pediatrician
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
                                    December 15, 2024
                                </Text>
                                <Text
                                    style={[
                                        styles.summarySubvalue,
                                        { color: colorScheme.textTertiary },
                                    ]}
                                >
                                    10:00 AM
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
                                    { backgroundColor: `${colorScheme.success}20` },
                                ]}
                            >
                                <MaterialIcons
                                    name="location-on"
                                    size={24}
                                    color={colorScheme.success}
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
                                    In-Person Visit
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsSection}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            { backgroundColor: colorScheme.primary },
                        ]}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="event" size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Add to Calendar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.secondaryButton,
                            { borderColor: colorScheme.border },
                        ]}
                        onPress={() => router.push('/appointments')}
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
                        onPress={() => router.push('/(tabs)/dashboard')}
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
    successContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
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
});
