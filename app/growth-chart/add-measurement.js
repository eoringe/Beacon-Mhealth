import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export default function AddMeasurementScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();

    const [measurementData, setMeasurementData] = useState({
        date: new Date().toISOString().split('T')[0],
        ageMonths: '',
        height: '',
        weight: '',
        headCircumference: '',
        notes: '',
    });

    const handleSave = () => {
        // Save logic here
        console.log('Saving measurement:', measurementData);
        router.back();
    };

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Add Measurement"
                showBack={true}
                rightComponent={
                    <TouchableOpacity onPress={handleSave}>
                        <Text
                            style={[styles.saveButton, { color: colorScheme.primary }]}
                            numberOfLines={1}
                        >
                            Save
                        </Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: `${colorScheme.primary}15` }]}>
                    <MaterialIcons name="info-outline" size={20} color={colorScheme.primary} />
                    <Text style={[styles.infoText, { color: colorScheme.textSecondary }]}>
                        Record your child's growth measurements to track their development over time.
                    </Text>
                </View>

                {/* Form Fields */}
                <View style={styles.form}>
                    {/* Date */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colorScheme.textSecondary }]}>
                            Date of Measurement
                        </Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={measurementData.date}
                            onChangeText={(text) => setMeasurementData({ ...measurementData, date: text })}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={colorScheme.textTertiary}
                        />
                    </View>

                    {/* Age in Months */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colorScheme.textSecondary }]}>
                            Age (Months)
                        </Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={measurementData.ageMonths}
                            onChangeText={(text) => setMeasurementData({ ...measurementData, ageMonths: text })}
                            placeholder="Enter age in months"
                            placeholderTextColor={colorScheme.textTertiary}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Height */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelRow}>
                            <MaterialIcons name="height" size={20} color={colorScheme.chartHeight} />
                            <Text style={[styles.label, { color: colorScheme.textSecondary }]}>
                                Height (cm)
                            </Text>
                        </View>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={measurementData.height}
                            onChangeText={(text) => setMeasurementData({ ...measurementData, height: text })}
                            placeholder="Enter height in centimeters"
                            placeholderTextColor={colorScheme.textTertiary}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Weight */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelRow}>
                            <MaterialIcons name="monitor-weight" size={20} color={colorScheme.chartWeight} />
                            <Text style={[styles.label, { color: colorScheme.textSecondary }]}>
                                Weight (kg)
                            </Text>
                        </View>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={measurementData.weight}
                            onChangeText={(text) => setMeasurementData({ ...measurementData, weight: text })}
                            placeholder="Enter weight in kilograms"
                            placeholderTextColor={colorScheme.textTertiary}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Head Circumference */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelRow}>
                            <MaterialIcons name="face" size={20} color={colorScheme.chartHeadCirc} />
                            <Text style={[styles.label, { color: colorScheme.textSecondary }]}>
                                Head Circumference (cm)
                            </Text>
                        </View>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={measurementData.headCircumference}
                            onChangeText={(text) => setMeasurementData({ ...measurementData, headCircumference: text })}
                            placeholder="Enter head circumference"
                            placeholderTextColor={colorScheme.textTertiary}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Notes */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colorScheme.textSecondary }]}>
                            Notes (Optional)
                        </Text>
                        <TextInput
                            style={[styles.textArea, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={measurementData.notes}
                            onChangeText={(text) => setMeasurementData({ ...measurementData, notes: text })}
                            placeholder="Add any relevant notes about this measurement"
                            placeholderTextColor={colorScheme.textTertiary}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButtonLarge, { backgroundColor: colorScheme.primary }]}
                        onPress={handleSave}
                    >
                        <MaterialIcons name="check" size={24} color="#FFFFFF" />
                        <Text style={styles.saveButtonText}>Save Measurement</Text>
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
    saveButton: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        paddingHorizontal: Spacing.sm,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        margin: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    infoText: {
        flex: 1,
        fontSize: Typography.fontSize.sm,
        lineHeight: 20,
    },
    form: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
    },
    formGroup: {
        gap: Spacing.xs,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: Typography.fontSize.base,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: Typography.fontSize.base,
        minHeight: 100,
    },
    saveButtonLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.md,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
});
