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
import { verifyPatient } from '@/services/patientService';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeHeader } from '@/components/SafeHeader';
export default function PatientLookupScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colorScheme } = useTheme();
    const { addChild } = useChild();

    const [registrationNumber, setRegistrationNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
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
            // Format date as YYYY-MM-DD using local time
            const year = dateOfBirth.getFullYear();
            const month = String(dateOfBirth.getMonth() + 1).padStart(2, '0');
            const day = String(dateOfBirth.getDate()).padStart(2, '0');
            const formattedDob = `${year}-${month}-${day}`;

            const data = await verifyPatient({
                registrationNumber: registrationNumber.trim(),
                dateOfBirth: formattedDob
            });
            setPatientData(data);
        } catch (err) {
            if (err.message.includes('not found') || err.message.includes('do not match')) {
                setError('Patient not found or details do not match. Please verify the registration number and date of birth.');
            } else {
                setError(err.message || 'Failed to verify patient');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddChild = async () => {
        if (!patientData?.patient) {
            showAlert('Error', 'No patient data to add', [], 'error');
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
            showAlert('Success', 'Child profile added successfully!', [
                { text: 'OK', onPress: () => router.replace('/children') }
            ], 'success');
        } catch (err) {
            showAlert('Error', err.message || 'Failed to add child', [], 'error');
        } finally {
            setSaving(false);
        }
    };

    const hasNoVisits = patientData && !patientData.lastVisit;

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            {/* Header */}
            <SafeHeader title="Find Patient" showBack />

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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                            <MaterialIcons name="security" size={24} color={colorScheme.primary} />
                            <Text style={[styles.searchTitle, { color: colorScheme.textPrimary, marginBottom: 0 }]}>
                                Patient Identity Verification
                            </Text>
                        </View>
                        <Text style={[styles.searchSubtitle, { color: colorScheme.textSecondary }]}>
                            Please provide your child's registration number and date of birth. This information will be cross-referenced with the Beacon Children's Centre clinical database to securely verify and confirm the patient's identity.
                        </Text>

                        {/* Registration Number */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colorScheme.textPrimary }]}>Registration Number *</Text>
                            <TextInput
                                style={[styles.searchInput, {
                                    backgroundColor: colorScheme.background,
                                    borderColor: colorScheme.border,
                                    color: colorScheme.textPrimary
                                }]}
                                value={registrationNumber}
                                onChangeText={(text) => {
                                    let formattedText = text;
                                    if (text.length === 3 && registrationNumber.length === 2) {
                                        formattedText = text + '-';
                                    }
                                    setRegistrationNumber(formattedText);
                                }}
                                placeholder="e.g. 008-2025"
                                placeholderTextColor={colorScheme.textTertiary}
                                autoCapitalize="characters"
                            />
                        </View>

                        {/* Date of Birth */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colorScheme.textPrimary }]}>Date of Birth *</Text>
                            <TouchableOpacity
                                style={[styles.dateInput, {
                                    backgroundColor: colorScheme.background,
                                    borderColor: colorScheme.border
                                }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={[styles.dateText, { color: colorScheme.textPrimary }]}>
                                    {dateOfBirth.toLocaleDateString()}
                                </Text>
                                <MaterialIcons name="calendar-today" size={20} color={colorScheme.textSecondary} />
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={dateOfBirth}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(Platform.OS === 'ios');
                                        if (selectedDate) {
                                            setDateOfBirth(selectedDate);
                                        }
                                    }}
                                    maximumDate={new Date()}
                                />
                            )}
                        </View>

                        {/* Search Button */}
                        <TouchableOpacity
                            style={[styles.searchButton, { backgroundColor: colorScheme.primary }]}
                            onPress={handleLookup}
                            disabled={loading}
                        >
                            {loading ? (
                                <CustomLoading size={20} color="#FFFFFF" />
                            ) : (
                                <>
                                    <MaterialIcons name="verified-user" size={20} color="#FFFFFF" />
                                    <Text style={styles.searchButtonText}>Verify Patient</Text>
                                </>
                            )}
                        </TouchableOpacity>
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
                        onPress={() => router.push('/profile/children/add')}
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
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.md,
    },
    searchButton: {
        flexDirection: 'row',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    searchButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: Spacing.xs,
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
    },
    dateText: {
        fontSize: Typography.fontSize.md,
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
