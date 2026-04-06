import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    FlatList,
    Alert,
} from 'react-native';
import { CustomLoading } from '@/components/CustomLoading';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useChild } from '@/contexts/ChildContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAlert } from '@/contexts/AlertContext';
import { SafeHeader } from '@/components/SafeHeader';
import { searchPatients, verifyPatient } from '@/services/patientService';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddChildScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colorScheme, isDark } = useTheme();
    const { addChild } = useChild();
    const { showAlert } = useAlert();

    const [mode, setMode] = useState('manual'); // 'manual' | 'lookup'
    const [loading, setLoading] = useState(false);

    // Form State (Shared where applicable, but distinct for clarity)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState(new Date());
    const [gender, setGender] = useState('Male');
    const [registrationNumber, setRegistrationNumber] = useState('');

    const [showDatePicker, setShowDatePicker] = useState(false);

    // Secure Verification Specific State
    const [verifyRegNumber, setVerifyRegNumber] = useState('');
    const [verifyDob, setVerifyDob] = useState(new Date());
    const [showVerifyDobPicker, setShowVerifyDobPicker] = useState(false);

    // If coming from lookup, populate data
    useEffect(() => {
        if (params.data) {
            try {
                const childData = JSON.parse(params.data);
                setFirstName(childData.first_name || '');
                setLastName(childData.last_name || '');
                setGender(childData.gender || '');
                setRegistrationNumber(childData.registration_number || '');

                if (childData.date_of_birth) {
                    setDateOfBirth(new Date(childData.date_of_birth));
                }
            } catch (e) {
                console.error('Error parsing child data:', e);
            }
        }
    }, [params.data]);

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDateOfBirth(selectedDate);
        }
    };

    const handleAddChild = async () => {
        if (!firstName || !lastName || !dateOfBirth || !gender) {
            showAlert('Error', 'Please fill in all required fields', [], 'error');
            return;
        }

        try {
            setLoading(true);

            // If we have a verified child from lookup (with ID), we might need different handling
            // But usually we just create a new record linked to this parent

            const childData = {
                firstName,
                lastName,
                dateOfBirth: dateOfBirth.toISOString(),
                gender,
                registrationNumber
            };

            await addChild(childData);

            showAlert('Success', 'Child profile created successfully', [
                { text: 'OK', onPress: () => router.back() }
            ], 'success');
        } catch (error) {
            showAlert('Error', error.message, [], 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndAdd = async () => {
        if (!verifyRegNumber) {
            showAlert('Error', 'Please enter the Registration Number', [], 'error');
            return;
        }

        setLoading(true); // Changed from setIsLoading to setLoading
        try {
            // Format date as YYYY-MM-DD using local time to avoid timezone shifts
            const year = verifyDob.getFullYear();
            const month = String(verifyDob.getMonth() + 1).padStart(2, '0');
            const day = String(verifyDob.getDate()).padStart(2, '0');
            const formattedDob = `${year}-${month}-${day}`;

            const verificationData = {
                registrationNumber: verifyRegNumber,
                dateOfBirth: formattedDob
            };

            const response = await verifyPatient(verificationData); // Changed from patientService.verifyPatient
            const verifiedPatient = response.patient;

            // If verified, Add Child
            await addChild({
                firstName: verifiedPatient.fullname?.first_name || firstName,
                lastName: verifiedPatient.fullname?.last_name || lastName,
                dateOfBirth: verifiedPatient.dob,
                gender: verifiedPatient.gender || 'Unknown',
                registrationNumber: verifiedPatient.registrationNumber
            });

            showAlert('Success', 'Identity confirmed! Child profile linked successfully.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/dashboard') }
            ], 'success');

        } catch (err) {
            showAlert('Verification Failed', err.message || 'Details do not match clinic records.', [], 'error');
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || dateOfBirth;
        setShowDatePicker(Platform.OS === 'ios');
        setDateOfBirth(currentDate);
    };

    const renderManualForm = () => (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.formContainer}>
                <View style={[styles.searchCard, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border, borderWidth: 1, marginBottom: Spacing.md }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs }}>
                        <MaterialIcons name="info" size={20} color={colorScheme.primary} />
                        <Text style={[styles.label, { color: colorScheme.textPrimary, marginBottom: 0 }]}>Important Notice</Text>
                    </View>
                    <Text style={[styles.searchSubtitle, { color: colorScheme.textSecondary, marginBottom: 0 }]}>
                        This option should only be used if your child has never visited Beacon Children's Centre. If your child has a previous record, please use the <Text style={{ fontWeight: 'bold' }}>Existing Client</Text> tab to link their profile.
                    </Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colorScheme.textPrimary }]}>First Name *</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colorScheme.inputBackground || colorScheme.surface,
                            borderColor: colorScheme.border,
                            color: colorScheme.textPrimary
                        }]}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Enter first name"
                        placeholderTextColor={colorScheme.textTertiary}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colorScheme.textPrimary }]}>Last Name</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colorScheme.inputBackground || colorScheme.surface,
                            borderColor: colorScheme.border,
                            color: colorScheme.textPrimary
                        }]}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Enter last name"
                        placeholderTextColor={colorScheme.textTertiary}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colorScheme.textPrimary }]}>Date of Birth *</Text>
                    <TouchableOpacity
                        style={[styles.dateInput, {
                            backgroundColor: colorScheme.inputBackground || colorScheme.surface,
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
                            onChange={onDateChange}
                            maximumDate={new Date()}
                            themeVariant={isDark ? 'dark' : 'light'}
                        />
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colorScheme.textPrimary }]}>Gender *</Text>
                    <View style={styles.genderContainer}>
                        {['Male', 'Female'].map((g) => (
                            <TouchableOpacity
                                key={g}
                                style={[
                                    styles.genderButton,
                                    {
                                        backgroundColor: colorScheme.inputBackground || colorScheme.surface,
                                        borderColor: colorScheme.border
                                    },
                                    gender === g && { backgroundColor: colorScheme.primary, borderColor: colorScheme.primary }
                                ]}
                                onPress={() => setGender(g)}
                            >
                                <Text
                                    style={[
                                        styles.genderText,
                                        { color: colorScheme.textPrimary },
                                        gender === g && { color: '#FFFFFF', fontWeight: 'bold' }
                                    ]}
                                >
                                    {g}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>



                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colorScheme.primary }]}
                    onPress={handleAddChild}
                    disabled={loading}
                >
                    {loading ? (
                        <CustomLoading size={20} color="#FFFFFF" />
                    ) : (
                        <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>Save Child Profile</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderLookupForm = () => (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.formContainer}>
                <View style={[styles.searchCard, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border, borderWidth: 1 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                        <MaterialIcons name="security" size={24} color={colorScheme.primary} />
                        <Text style={[styles.searchTitle, { color: colorScheme.textPrimary, marginBottom: 0 }]}>
                            Client Identity Verification
                        </Text>
                    </View>
                    <Text style={[styles.searchSubtitle, { color: colorScheme.textSecondary, marginBottom: Spacing.md }]}>
                        Please provide your child's registration number and date of birth. This information will be cross-referenced with the Beacon Children's Centre clinical database to securely verify and confirm their identity.
                    </Text>

                    {/* Help Note for Registration Number */}
                    <View style={{ backgroundColor: isDark ? `${colorScheme.primary}20` : '#F0F7FF', padding: Spacing.sm, borderRadius: BorderRadius.sm, marginBottom: Spacing.md, flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' }}>
                        <MaterialIcons name="help-outline" size={16} color={colorScheme.primary} />
                        <Text style={{ fontSize: 12, color: colorScheme.textSecondary, flex: 1 }}>
                            If you don't remember the registration number, please call Beacon on <Text style={{ color: colorScheme.primary, fontWeight: 'bold' }}>+254 115 188 415 / +254 780 626 990</Text>
                        </Text>
                    </View>

                    {/* Registration Number Field with Auto-Formatting */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colorScheme.textPrimary }]}>Registration Number *</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.inputBackground || colorScheme.surface,
                                borderColor: colorScheme.border,
                                color: colorScheme.textPrimary
                            }]}
                            value={verifyRegNumber}
                            onChangeText={(text) => {
                                // Auto-format: Add dash after 3 characters if not present
                                // e.g. 002 -> 002-
                                let formattedText = text;
                                if (text.length === 3 && verifyRegNumber.length === 2) {
                                    formattedText = text + '-';
                                }
                                setVerifyRegNumber(formattedText);
                            }}
                            placeholder="e.g. 008-2025"
                            placeholderTextColor={colorScheme.textTertiary}
                            autoCapitalize="characters"
                        />
                    </View>

                    {/* Date of Birth */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colorScheme.textPrimary }]}>Date of Birth *</Text>
                        <TouchableOpacity
                            style={[styles.dateInput, {
                                backgroundColor: colorScheme.inputBackground || colorScheme.surface,
                                borderColor: colorScheme.border
                            }]}
                            onPress={() => setShowVerifyDobPicker(true)}
                        >
                            <Text style={[styles.dateText, { color: colorScheme.textPrimary }]}>
                                {verifyDob.toLocaleDateString()}
                            </Text>
                            <MaterialIcons name="calendar-today" size={20} color={colorScheme.textSecondary} />
                        </TouchableOpacity>
                        {showVerifyDobPicker && (
                            <DateTimePicker
                                value={verifyDob}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowVerifyDobPicker(Platform.OS === 'ios');
                                    const currentDate = selectedDate || verifyDob;
                                    setVerifyDob(currentDate);
                                }}
                                maximumDate={new Date()}
                                themeVariant={isDark ? 'dark' : 'light'}
                            />
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colorScheme.primary, marginTop: Spacing.xl }]}
                        onPress={handleVerifyAndAdd}
                        disabled={loading}
                    >
                        {loading ? (
                            <CustomLoading size={20} color="#FFFFFF" />
                        ) : (
                            <>
                                <MaterialIcons name="verified-user" size={20} color="#FFFFFF" />
                                <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>Verify & Link Child</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </View>
            </View>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Add Child" showBack />

            <View style={[styles.content, { paddingBottom: 0 }]}>
                {/* Instruction at the top */}
                <Text style={[styles.topInstruction, { color: colorScheme.textSecondary }]}>
                    How would you like to add your child?
                </Text>

                {/* Toggle Switch */}
                <View style={[styles.toggleContainer, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border }]}>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            mode === 'manual' && { backgroundColor: colorScheme.primary }
                        ]}
                        onPress={() => setMode('manual')}
                    >
                        <Text style={[
                            styles.toggleText,
                            { color: colorScheme.textSecondary },
                            mode === 'manual' && { color: '#FFFFFF', fontWeight: 'bold' }
                        ]}>New Client</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            mode === 'lookup' && { backgroundColor: colorScheme.primary }
                        ]}
                        onPress={() => setMode('lookup')}
                    >
                        <Text style={[
                            styles.toggleText,
                            { color: colorScheme.textSecondary },
                            mode === 'lookup' && { color: '#FFFFFF', fontWeight: 'bold' }
                        ]}>Existing Client</Text>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                >
                    {mode === 'manual' ? renderManualForm() : renderLookupForm()}
                </KeyboardAvoidingView>
            </View>
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
        fontWeight: Typography.fontWeight.bold,
    },
    backButton: {
        padding: Spacing.xs,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
    },
    topInstruction: {
        fontSize: Typography.fontSize.sm,
        textAlign: 'center',
        marginBottom: Spacing.md,
        fontWeight: '500',
    },
    toggleContainer: {
        flexDirection: 'row',
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.xl,
        overflow: 'hidden',
    },
    toggleButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleText: {
        fontSize: Typography.fontSize.md,
    },
    formContainer: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: Spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.md,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
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
    genderContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    genderButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    genderText: {
        fontSize: Typography.fontSize.md,
    },
    saveButton: {
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
    },
    // Lookup Styles
    searchCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
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
        height: 50,
    },
    searchIconContainer: {
        width: 50,
        height: 50,
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
    resultCard: {
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadow.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
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
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: '700',
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        marginBottom: Spacing.xs,
        borderRadius: BorderRadius.md,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    resultContent: {
        flex: 1,
    },
    resultName: {
        fontSize: Typography.fontSize.md,
        fontWeight: '600',
    },
    resultSub: {
        fontSize: Typography.fontSize.sm,
    },
    separator: {
        height: 1,
    },
    verifyContainer: {
        marginTop: Spacing.sm,
    },
    verifyLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    verifyInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.md,
        marginBottom: Spacing.xs,
    },
    verifyHint: {
        fontSize: Typography.fontSize.xs,
        fontStyle: 'italic',
    },
});
