import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import { LoadingSection } from '@/components/LoadingComponents';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { useChild } from '@/contexts/ChildContext';
import patientService from '@/services/patientService';

export default function PrescriptionsScreen() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (selectedChild?.registration_number) {
            fetchPrescriptions();
        } else {
            setLoading(false);
            setError('No child selected or child has no registration number');
        }
    }, [selectedChild]);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await patientService.getPrescriptions(selectedChild.registration_number);
            setPrescriptions(data);
        } catch (err) {
            console.error('Error fetching prescriptions:', err);
            setError('Could not load prescriptions');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const childName = selectedChild?.first_name && selectedChild?.last_name
        ? `${selectedChild.first_name} ${selectedChild.last_name}`
        : selectedChild?.fullname || 'Child';

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Prescriptions" showBack={true} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Info */}
                <View style={[styles.headerCard, { backgroundColor: colorScheme.surface }]}>
                    <MaterialIcons name="medication" size={40} color={colorScheme.primary} />
                    <Text style={[styles.headerTitle, { color: colorScheme.textPrimary }]}>
                        {childName}'s Prescriptions
                    </Text>
                    {selectedChild?.registration_number && (
                        <Text style={[styles.headerSubtitle, { color: colorScheme.textSecondary }]}>
                            Reg: {selectedChild.registration_number}
                        </Text>
                    )}
                </View>

                {/* Loading State */}
                {loading && (
                    <LoadingSection text="Loading prescriptions..." />
                )}

                {/* Error State */}
                {error && !loading && (
                    <View style={styles.centerContent}>
                        <MaterialIcons name="error-outline" size={48} color={colorScheme.error} />
                        <Text style={[styles.statusText, { color: colorScheme.textSecondary }]}>
                            {error}
                        </Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: colorScheme.primary }]}
                            onPress={fetchPrescriptions}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Empty State */}
                {!loading && !error && prescriptions.length === 0 && (
                    <View style={styles.centerContent}>
                        <MaterialIcons name="note-add" size={48} color={colorScheme.textTertiary} />
                        <Text style={[styles.statusText, { color: colorScheme.textSecondary }]}>
                            No prescriptions found
                        </Text>
                    </View>
                )}

                {/* Prescriptions List */}
                {!loading && !error && prescriptions.length > 0 && (
                    <View style={styles.listContainer}>
                        {prescriptions.map((prescription, index) => (
                            <View
                                key={prescription.id || index}
                                style={[styles.prescriptionCard, { backgroundColor: colorScheme.surface }]}
                            >
                                {/* Header Row */}
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: `${colorScheme.primary}15` }]}>
                                        <MaterialIcons name="receipt-long" size={24} color={colorScheme.primary} />
                                    </View>
                                    <View style={styles.headerInfo}>
                                        <Text style={[styles.doctorName, { color: colorScheme.textPrimary }]}>
                                            Dr. {prescription.doctorName}
                                        </Text>
                                        <Text style={[styles.dateText, { color: colorScheme.textSecondary }]}>
                                            {formatDate(prescription.prescribedAt)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Divider */}
                                <View style={[styles.divider, { backgroundColor: colorScheme.border }]} />

                                {/* Drugs List */}
                                <Text style={[styles.drugsLabel, { color: colorScheme.textSecondary }]}>
                                    Prescribed Medications:
                                </Text>
                                <View style={styles.drugsList}>
                                    {prescription.drugs.map((drug, drugIndex) => (
                                        <View key={drugIndex} style={styles.drugItem}>
                                            <MaterialIcons name="circle" size={8} color={colorScheme.primary} />
                                            <Text style={[styles.drugText, { color: colorScheme.textPrimary }]}>
                                                {drug}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
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
    headerCard: {
        alignItems: 'center',
        padding: Spacing.xl,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.lg,
        ...Shadow.md,
    },
    headerTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        marginTop: Spacing.md,
    },
    headerSubtitle: {
        fontSize: Typography.fontSize.sm,
        marginTop: Spacing.xs,
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxxl,
    },
    statusText: {
        fontSize: Typography.fontSize.md,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: Typography.fontWeight.semibold,
    },
    listContainer: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
    },
    prescriptionCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        ...Shadow.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    headerInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    dateText: {
        fontSize: Typography.fontSize.sm,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.md,
    },
    drugsLabel: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.sm,
    },
    drugsList: {
        gap: Spacing.xs,
    },
    drugItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    drugText: {
        fontSize: Typography.fontSize.base,
        flex: 1,
    },
});
