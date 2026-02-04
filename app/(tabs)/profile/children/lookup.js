import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { CustomLoading } from '@/components/CustomLoading';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useChild } from '@/contexts/ChildContext';
import { useTheme } from '@/contexts/ThemeContext';
import { lookupPatient } from '@/services/patientService';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export default function PatientLookupScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colorScheme } = useTheme();
    const { addChild } = useChild();

    const [registrationNumber, setRegistrationNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [patientData, setPatientData] = useState(null);
    const [error, setError] = useState('');

    const handleLookup = async () => {
        if (!registrationNumber.trim()) {
            setError('Please enter a registration number');
            return;
        }

        setLoading(true);
        setError('');
        setPatientData(null);

        try {
            const data = await lookupPatient(registrationNumber.trim());
            setPatientData(data);
        } catch (err) {
            if (err.message.includes('not found')) {
                setError('Patient not found. You can still create a new profile manually.');
            } else {
                setError(err.message || 'Failed to lookup patient');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddChild = async () => {
        if (!patientData?.patient) {
            Alert.alert('Error', 'No patient data to add');
            return;
        }

        setSaving(true);
        try {
            const patient = patientData.patient;
            await addChild({
                firstName: patient.fullname?.first_name || '',
                lastName: patient.fullname?.last_name || '',
                dateOfBirth: patient.dob,
                gender: patient.gender || 'Unknown',
                bloodType: '',
                allergies: '',
                registrationNumber: patient.registrationNumber
            });
            Alert.alert('Success', 'Child profile added successfully!', [
                { text: 'OK', onPress: () => router.replace('/children') }
            ]);
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to add child');
        } finally {
            setSaving(false);
        }
    };

    const hasNoVisits = patientData && !patientData.lastVisit;

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            {/* Header */}
            <View style={[styles.header, {
                paddingTop: insets.top + Spacing.md,
                backgroundColor: colorScheme.surface,
                borderBottomColor: colorScheme.border
            }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colorScheme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colorScheme.textPrimary }]}>
                    Find Patient
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl + 100 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Search Section */}
                    <View style={[styles.searchCard, { backgroundColor: colorScheme.surface }]}>
                        <Text style={[styles.searchTitle, { color: colorScheme.textPrimary }]}>
                            Enter Registration Number
                        </Text>
                        <Text style={[styles.searchSubtitle, { color: colorScheme.textSecondary }]}>
                            Search for your child's profile from Beacon Children Center
                        </Text>
                        <View style={styles.searchRow}>
                            <TextInput
                                style={[styles.searchInput, {
                                    backgroundColor: colorScheme.background,
                                    borderColor: colorScheme.border,
                                    color: colorScheme.textPrimary
                                }]}
                                value={registrationNumber}
                                onChangeText={setRegistrationNumber}
                                placeholder="e.g. 008-2025"
                                placeholderTextColor={colorScheme.textTertiary}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                style={[styles.searchButton, { backgroundColor: colorScheme.primary }]}
                                onPress={handleLookup}
                                disabled={loading}
                            >
                                {loading ? (
                                    <CustomLoading size={20} color="#FFFFFF" />
                                ) : (
                                    <MaterialIcons name="search" size={24} color="#FFFFFF" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Error Message */}
                    {error ? (
                        <View style={[styles.errorCard, { backgroundColor: `${colorScheme.error}15`, borderColor: colorScheme.error }]}>
                            <MaterialIcons name="error-outline" size={20} color={colorScheme.error} />
                            <Text style={[styles.errorText, { color: colorScheme.error }]}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Patient Data Display */}
                    {patientData && (
                        <>
                            {/* No Visit Warning */}
                            {hasNoVisits && (
                                <View style={[styles.warningCard, { backgroundColor: `${colorScheme.warning}15`, borderColor: colorScheme.warning }]}>
                                    <MaterialIcons name="info" size={24} color={colorScheme.warning} />
                                    <View style={styles.warningContent}>
                                        <Text style={[styles.warningTitle, { color: colorScheme.warning }]}>
                                            No Visit Records Found
                                        </Text>
                                        <Text style={[styles.warningText, { color: colorScheme.textSecondary }]}>
                                            This child hasn't visited the clinic yet. Please visit Beacon Children Center to obtain a complete detailed profile with medical assessments.
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Patient Info Card */}
                            <View style={[styles.infoCard, { backgroundColor: colorScheme.surface }]}>
                                <View style={styles.cardHeader}>
                                    <MaterialIcons name="child-care" size={24} color={colorScheme.primary} />
                                    <Text style={[styles.cardTitle, { color: colorScheme.textPrimary }]}>
                                        Patient Information
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Name</Text>
                                    <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                        {patientData.patient?.displayName || 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Registration #</Text>
                                    <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                        {patientData.patient?.registrationNumber || 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Date of Birth</Text>
                                    <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                        {patientData.patient?.dob ? new Date(patientData.patient.dob).toLocaleDateString() : 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Gender</Text>
                                    <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                        {patientData.patient?.gender || 'N/A'}
                                    </Text>
                                </View>
                                {patientData.patient?.insuranceProvider && (
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Insurance</Text>
                                        <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                            {patientData.patient.insuranceProvider} ({patientData.patient.insuranceNumber || 'N/A'})
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Parent/Guardian Info */}
                            {patientData.parent && (
                                <View style={[styles.infoCard, { backgroundColor: colorScheme.surface }]}>
                                    <View style={styles.cardHeader}>
                                        <MaterialIcons name="person" size={24} color={colorScheme.primary} />
                                        <Text style={[styles.cardTitle, { color: colorScheme.textPrimary }]}>
                                            Parent/Guardian
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Name</Text>
                                        <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                            {patientData.parent.displayName || 'N/A'}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Relationship</Text>
                                        <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                            {patientData.parent.relationship || 'N/A'}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Phone</Text>
                                        <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                            {patientData.parent.telephone || 'N/A'}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Email</Text>
                                        <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                            {patientData.parent.email || 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Last Visit Info */}
                            {patientData.lastVisit && (
                                <View style={[styles.infoCard, { backgroundColor: colorScheme.surface }]}>
                                    <View style={styles.cardHeader}>
                                        <MaterialIcons name="local-hospital" size={24} color={colorScheme.primary} />
                                        <Text style={[styles.cardTitle, { color: colorScheme.textPrimary }]}>
                                            Last Visit
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Date</Text>
                                        <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                            {patientData.lastVisit.visitDate ? new Date(patientData.lastVisit.visitDate).toLocaleDateString() : 'N/A'}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Visit Type</Text>
                                        <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                            {patientData.lastVisit.visitType || 'N/A'}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Doctor</Text>
                                        <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                            {patientData.lastVisit.doctorName || 'N/A'}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Specialization</Text>
                                        <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                            {patientData.lastVisit.doctorSpecialization || 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Latest Triage */}
                            {patientData.latestTriage?.data && typeof patientData.latestTriage.data === 'object' && (
                                <View style={[styles.infoCard, { backgroundColor: colorScheme.surface }]}>
                                    <View style={styles.cardHeader}>
                                        <MaterialIcons name="monitor-heart" size={24} color={colorScheme.primary} />
                                        <Text style={[styles.cardTitle, { color: colorScheme.textPrimary }]}>
                                            Latest Vitals
                                        </Text>
                                    </View>
                                    {Object.entries(patientData.latestTriage.data).map(([key, value]) => (
                                        <View key={key} style={styles.infoRow}>
                                            <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>
                                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </Text>
                                            <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                                                {String(value)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Add Child Button */}
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: colorScheme.primary }]}
                                onPress={handleAddChild}
                                disabled={saving}
                            >
                                {saving ? (
                                    <CustomLoading size={20} color="#FFFFFF" />
                                ) : (
                                    <>
                                        <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                                        <Text style={styles.addButtonText}>Add to My Children</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Manual Add Option */}
                    <TouchableOpacity
                        style={[styles.manualAddButton, { borderColor: colorScheme.primary }]}
                        onPress={() => router.push('/children/add')}
                    >
                        <MaterialIcons name="edit" size={20} color={colorScheme.primary} />
                        <Text style={[styles.manualAddText, { color: colorScheme.primary }]}>
                            Add Child Manually
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: '700',
    },
    backButton: {
        padding: Spacing.xs,
    },
    content: {
        padding: Spacing.lg,
    },
    searchCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadow.md,
    },
    searchTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    searchSubtitle: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.lg,
    },
    searchRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.md,
    },
    searchButton: {
        width: 50,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    errorText: {
        flex: 1,
        fontSize: Typography.fontSize.sm,
    },
    warningCard: {
        flexDirection: 'row',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.lg,
        gap: Spacing.md,
    },
    warningContent: {
        flex: 1,
    },
    warningTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    warningText: {
        fontSize: Typography.fontSize.sm,
        lineHeight: 20,
    },
    infoCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadow.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    cardTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.xs,
    },
    infoLabel: {
        fontSize: Typography.fontSize.sm,
        flex: 1,
    },
    infoValue: {
        fontSize: Typography.fontSize.sm,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.lg,
        gap: Spacing.sm,
        ...Shadow.md,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: '700',
    },
    manualAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        marginTop: Spacing.lg,
        gap: Spacing.sm,
    },
    manualAddText: {
        fontSize: Typography.fontSize.md,
        fontWeight: '600',
    },
});
