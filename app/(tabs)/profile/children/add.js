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
} from 'react-native';
import { CustomLoading } from '@/components/CustomLoading';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useChild } from '@/contexts/ChildContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAlert } from '@/contexts/AlertContext';
import { searchPatients, verifyPatient } from '@/services/patientService';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddChildScreen() {
    const router = useRouter();
    const { colorScheme, isDark } = useTheme();
    const { addChild } = useChild();
    const { showAlert } = useAlert();

    const [mode, setMode] = useState('manual'); // 'manual' | 'lookup'
    const [loading, setLoading] = useState(false);

    // Form State (Shared where applicable, but distinct for clarity)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState('Male'); // Default
    const [bloodType, setBloodType] = useState('');
    const [allergies, setAllergies] = useState('');

    // Secure Verification Specific State
    const [verifyRegNumber, setVerifyRegNumber] = useState('');
    const [verifyDob, setVerifyDob] = useState(new Date());
    const [showVerifyDobPicker, setShowVerifyDobPicker] = useState(false);


    const handleManualSave = async () => {
        if (!firstName || !gender) {
            showAlert('Error', 'First Name and Gender are required', [], 'error');
            return;
        }

        setLoading(true);
        try {
            // Format date as YYYY-MM-DD using local time
            const year = dateOfBirth.getFullYear();
            const month = String(dateOfBirth.getMonth() + 1).padStart(2, '0');
            const day = String(dateOfBirth.getDate()).padStart(2, '0');
            const formattedDob = `${year}-${month}-${day}`;

            await addChild({
                firstName,
                lastName,
                dateOfBirth: formattedDob,
                gender,
                bloodType,
                allergies,
                registrationNumber: ''
            });
            showAlert('Success', 'Child added successfully', [
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
            Alert.alert('Error', 'Please enter the Registration Number');
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
                bloodType: '', // Not verified
                allergies: '', // Not verified
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

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colorScheme.textPrimary }]}>Blood Type</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colorScheme.inputBackground || colorScheme.surface,
                            borderColor: colorScheme.border,
                            color: colorScheme.textPrimary
                        }]}
                        value={bloodType}
                        onChangeText={setBloodType}
                        placeholder="e.g. A+"
                        placeholderTextColor={colorScheme.textTertiary}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colorScheme.textPrimary }]}>Allergies</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, {
                            backgroundColor: colorScheme.inputBackground || colorScheme.surface,
                            borderColor: colorScheme.border,
                            color: colorScheme.textPrimary
                        }]}
                        value={allergies}
                        onChangeText={setAllergies}
                        placeholder="List any allergies"
                        placeholderTextColor={colorScheme.textTertiary}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colorScheme.primary }]}
                    onPress={handleManualSave}
                    disabled={loading}
                >
                    {loading ? (
                        <CustomLoading size={20} color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Child Profile</Text>
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
                            Secure Verification
                        </Text>
                    </View>
                    <Text style={[styles.searchSubtitle, { color: colorScheme.textSecondary }]}>
                        To link a child account, you must provide EXACT details as they appear in the clinic records.
                    </Text>

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
                                <Text style={styles.addButtonText}>Verify & Link Child</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </View>
            </View>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <View style={[styles.header, {
                backgroundColor: colorScheme.surface,
                borderBottomColor: colorScheme.border,
                paddingTop: Spacing.xl + 20
            }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colorScheme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colorScheme.textPrimary }]}>Add Child</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={[styles.content, { paddingBottom: 0 }]}>
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
                        ]}>Manual Entry</Text>
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
                        ]}>Clinic Search</Text>
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
