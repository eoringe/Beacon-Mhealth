import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export default function PaymentScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');

    const paymentMethods = [
        { id: 'card', label: 'Credit/Debit Card', icon: 'credit-card' },
        { id: 'mobile', label: 'Mobile Money', icon: 'phone-android' },
        { id: 'insurance', label: 'Insurance', icon: 'health-and-safety' },
    ];

    const handlePayment = () => {
        // Simulate payment processing
        setTimeout(() => {
            setShowSuccessModal(true);
        }, 1000);
    };

    return (
        <View
            style={[styles.container, { backgroundColor: colorScheme.background }]}
        >
            <SafeHeader title="Payment" showBack={true} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Consultation Summary */}
                <View style={styles.section}>
                    <Text
                        style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}
                    >
                        Consultation Summary
                    </Text>
                    <View
                        style={[
                            styles.summaryCard,
                            { backgroundColor: colorScheme.surface },
                        ]}
                    >
                        <View style={styles.summaryRow}>
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
                            <View style={styles.doctorInfo}>
                                <Text
                                    style={[
                                        styles.doctorName,
                                        { color: colorScheme.textPrimary },
                                    ]}
                                >
                                    Dr. Sarah Johnson
                                </Text>
                                <Text
                                    style={[
                                        styles.doctorSpecialty,
                                        { color: colorScheme.textSecondary },
                                    ]}
                                >
                                    Pediatrician • Video Consultation
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[styles.divider, { backgroundColor: colorScheme.border }]}
                        />

                        <View style={styles.priceBreakdown}>
                            <View style={styles.priceRow}>
                                <Text
                                    style={[styles.priceLabel, { color: colorScheme.textSecondary }]}
                                >
                                    Consultation Fee
                                </Text>
                                <Text
                                    style={[styles.priceValue, { color: colorScheme.textPrimary }]}
                                >
                                    $50.00
                                </Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text
                                    style={[styles.priceLabel, { color: colorScheme.textSecondary }]}
                                >
                                    Service Fee
                                </Text>
                                <Text
                                    style={[styles.priceValue, { color: colorScheme.textPrimary }]}
                                >
                                    $5.00
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.divider,
                                    { backgroundColor: colorScheme.border },
                                ]}
                            />
                            <View style={styles.priceRow}>
                                <Text
                                    style={[styles.totalLabel, { color: colorScheme.textPrimary }]}
                                >
                                    Total
                                </Text>
                                <Text
                                    style={[styles.totalValue, { color: colorScheme.primary }]}
                                >
                                    $55.00
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Payment Method Selection */}
                <View style={styles.section}>
                    <Text
                        style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}
                    >
                        Payment Method
                    </Text>
                    {paymentMethods.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.paymentMethodCard,
                                {
                                    backgroundColor: colorScheme.surface,
                                    borderWidth: selectedPaymentMethod === method.id ? 2 : 1,
                                    borderColor:
                                        selectedPaymentMethod === method.id
                                            ? colorScheme.primary
                                            : colorScheme.border,
                                },
                            ]}
                            onPress={() => setSelectedPaymentMethod(method.id)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.methodIconContainer,
                                    { backgroundColor: colorScheme.primaryLight },
                                ]}
                            >
                                <MaterialIcons
                                    name={method.icon}
                                    size={24}
                                    color={colorScheme.primary}
                                />
                            </View>
                            <Text
                                style={[styles.methodLabel, { color: colorScheme.textPrimary }]}
                            >
                                {method.label}
                            </Text>
                            {selectedPaymentMethod === method.id && (
                                <MaterialIcons
                                    name="check-circle"
                                    size={24}
                                    color={colorScheme.primary}
                                />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Card Details (if card is selected) */}
                {selectedPaymentMethod === 'card' && (
                    <View style={styles.section}>
                        <Text
                            style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}
                        >
                            Card Details
                        </Text>
                        <View
                            style={[
                                styles.cardDetailsCard,
                                { backgroundColor: colorScheme.surface },
                            ]}
                        >
                            <View style={styles.inputGroup}>
                                <Text
                                    style={[styles.inputLabel, { color: colorScheme.textSecondary }]}
                                >
                                    Card Number
                                </Text>
                                <View style={[styles.input, { borderColor: colorScheme.border }]}>
                                    <MaterialIcons
                                        name="credit-card"
                                        size={20}
                                        color={colorScheme.textSecondary}
                                    />
                                    <TextInput
                                        style={[styles.inputField, { color: colorScheme.textPrimary }]}
                                        placeholder="1234 5678 9012 3456"
                                        placeholderTextColor={colorScheme.textTertiary}
                                        value={cardNumber}
                                        onChangeText={setCardNumber}
                                        keyboardType="numeric"
                                        maxLength={19}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputRow}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text
                                        style={[styles.inputLabel, { color: colorScheme.textSecondary }]}
                                    >
                                        Expiry Date
                                    </Text>
                                    <View style={[styles.input, { borderColor: colorScheme.border }]}>
                                        <TextInput
                                            style={[styles.inputField, { color: colorScheme.textPrimary }]}
                                            placeholder="MM/YY"
                                            placeholderTextColor={colorScheme.textTertiary}
                                            value={expiryDate}
                                            onChangeText={setExpiryDate}
                                            keyboardType="numeric"
                                            maxLength={5}
                                        />
                                    </View>
                                </View>

                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text
                                        style={[styles.inputLabel, { color: colorScheme.textSecondary }]}
                                    >
                                        CVV
                                    </Text>
                                    <View style={[styles.input, { borderColor: colorScheme.border }]}>
                                        <TextInput
                                            style={[styles.inputField, { color: colorScheme.textPrimary }]}
                                            placeholder="123"
                                            placeholderTextColor={colorScheme.textTertiary}
                                            value={cvv}
                                            onChangeText={setCvv}
                                            keyboardType="numeric"
                                            maxLength={3}
                                            secureTextEntry
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Pay Button */}
                <TouchableOpacity
                    style={[styles.payButton, { backgroundColor: colorScheme.primary }]}
                    onPress={handlePayment}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="lock" size={20} color="#FFFFFF" />
                    <Text style={styles.payButtonText}>Pay $55.00</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: colorScheme.overlay }]}>
                    <View
                        style={[styles.modalContent, { backgroundColor: colorScheme.surface }]}
                    >
                        <View
                            style={[
                                styles.successIcon,
                                { backgroundColor: `${colorScheme.success}20` },
                            ]}
                        >
                            <MaterialIcons
                                name="check-circle"
                                size={64}
                                color={colorScheme.success}
                            />
                        </View>
                        <Text
                            style={[styles.modalTitle, { color: colorScheme.textPrimary }]}
                        >
                            Payment Successful!
                        </Text>
                        <Text
                            style={[styles.modalMessage, { color: colorScheme.textSecondary }]}
                        >
                            Your teleconsultation has been booked successfully
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                { backgroundColor: colorScheme.primary },
                            ]}
                            onPress={() => {
                                setShowSuccessModal(false);
                                router.push('/(tabs)/dashboard');
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.modalButtonText}>Back to Home</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    doctorAvatar: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doctorInfo: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    doctorName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 2,
    },
    doctorSpecialty: {
        fontSize: Typography.fontSize.sm,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.md,
    },
    priceBreakdown: {
        gap: Spacing.sm,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: Typography.fontSize.base,
    },
    priceValue: {
        fontSize: Typography.fontSize.base,
    },
    totalLabel: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    totalValue: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
    },
    paymentMethodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
        ...Shadow.sm,
    },
    methodIconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodLabel: {
        flex: 1,
        marginLeft: Spacing.md,
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
    },
    cardDetailsCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadow.md,
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    inputLabel: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.xs,
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    inputField: {
        flex: 1,
        fontSize: Typography.fontSize.base,
    },
    inputRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
        ...Shadow.md,
    },
    payButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        borderRadius: BorderRadius.lg,
        padding: Spacing.xxxl,
        alignItems: 'center',
        ...Shadow.lg,
    },
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    modalTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.sm,
    },
    modalMessage: {
        fontSize: Typography.fontSize.base,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    modalButton: {
        paddingHorizontal: Spacing.xxxl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
});
