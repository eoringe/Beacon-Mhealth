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
import { searchPatients } from '@/services/patientService';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddChildScreen() {
    const router = useRouter();
    const { colorScheme, isDark } = useTheme();
    const { addChild } = useChild();
    const { showAlert } = useAlert();

    const [mode, setMode] = useState('manual'); // 'manual' | 'lookup'
    const [loading, setLoading] = useState(false);

    // Manual Entry State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [allergies, setAllergies] = useState('');

    // Lookup State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searchError, setSearchError] = useState('');

    // Verification State
    const [verifyRegNumber, setVerifyRegNumber] = useState('');

    // Debounce Search Logic
    useEffect(() => {
        if (mode !== 'lookup' || !searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            setSearchError('');
            try {
                const results = await searchPatients(searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error("Search error:", error);
                if (error.message && !error.message.includes('too short')) {
                    setSearchError('Failed to fetch results');
                }
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery, mode]);

    // Reset verification when selection changes
    useEffect(() => {
        setVerifyRegNumber('');
    }, [selectedPatient]);

    const handleManualSave = async () => {
        if (!firstName || !gender) {
            showAlert('Error', 'First Name and Gender are required', [], 'error');
            return;
        }

        setLoading(true);
        try {
            await addChild({
                firstName,
                lastName,
                dateOfBirth: dateOfBirth.toISOString().split('T')[0],
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
        if (!selectedPatient) return;

        if (!verifyRegNumber.trim()) {
            showAlert('Verification Required', 'Please enter the Registration Number to confirm identity.', [], 'warning');
            return;
        }

        if (verifyRegNumber.trim().toUpperCase() !== selectedPatient.registrationNumber.toUpperCase()) {
            showAlert('Verification Failed', 'Registration Number does not match selected patient. Please check the clinic card.', [], 'error');
            return;
        }

        setLoading(true);
        try {
            await addChild({
                firstName: selectedPatient.fullname?.first_name || '',
                lastName: selectedPatient.fullname?.last_name || '',
                dateOfBirth: selectedPatient.dob,
                gender: selectedPatient.gender || 'Unknown',
                bloodType: '',
                allergies: '',
                registrationNumber: selectedPatient.registrationNumber
            });
            showAlert('Success', 'Child profile verified and added!', [
                { text: 'OK', onPress: () => router.replace('/children') }
            ], 'success');
        } catch (err) {
            showAlert('Error', err.message || 'Failed to add child', [], 'error');
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
        <View style={styles.formContainer}>
            <View style={[styles.searchCard, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border, borderWidth: 1 }]}>
                <Text style={[styles.searchTitle, { color: colorScheme.textPrimary }]}>
                    Search Clinic Records
                </Text>
                <Text style={[styles.searchSubtitle, { color: colorScheme.textSecondary }]}>
                    Search by Name or Registration Number
                </Text>
                <View style={styles.searchRow}>
                    <TextInput
                        style={[styles.searchInput, {
                            backgroundColor: colorScheme.background,
                            borderColor: colorScheme.border,
                            color: colorScheme.textPrimary
                        }]}
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            if (!text) setSelectedPatient(null);
                        }}
                        placeholder="e.g. John Doe"
                        placeholderTextColor={colorScheme.textTertiary}
                        autoCapitalize="words"
                        autoCorrect={false}
                    />
                    <View style={[styles.searchIconContainer, { backgroundColor: colorScheme.primary }]}>
                        {isSearching ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <MaterialIcons name="search" size={24} color="#FFFFFF" />
                        )}
                    </View>
                </View>
            </View>

            {/* Results List or Selected Patient */}
            {selectedPatient ? (
                <View style={[styles.resultCard, { backgroundColor: colorScheme.surface, borderColor: colorScheme.primary, borderWidth: 2 }]}>
                    <View style={[styles.cardHeader, { borderBottomColor: colorScheme.divider }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                            <MaterialIcons name="verified-user" size={24} color={colorScheme.primary} />
                            <Text style={[styles.cardTitle, { color: colorScheme.textPrimary }]}>Confirm Identity</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedPatient(null)}>
                            <MaterialIcons name="close" size={20} color={colorScheme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Name</Text>
                        <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                            {selectedPatient.displayName || 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>DOB</Text>
                        <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                            {selectedPatient.dob ? new Date(selectedPatient.dob).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colorScheme.textSecondary }]}>Gender</Text>
                        <Text style={[styles.infoValue, { color: colorScheme.textPrimary }]}>
                            {selectedPatient.gender || 'N/A'}
                        </Text>
                    </View>

                    <View style={[styles.separator, { backgroundColor: colorScheme.divider, marginVertical: Spacing.md }]} />

                    <View style={styles.verifyContainer}>
                        <Text style={[styles.verifyLabel, { color: colorScheme.textPrimary }]}>
                            Enter Registration Number to Verify:
                        </Text>
                        <TextInput
                            style={[styles.verifyInput, {
                                borderColor: colorScheme.border,
                                color: colorScheme.textPrimary,
                                backgroundColor: colorScheme.background
                            }]}
                            value={verifyRegNumber}
                            onChangeText={setVerifyRegNumber}
                            placeholder="e.g. 008-2025"
                            placeholderTextColor={colorScheme.textTertiary}
                            autoCapitalize="characters"
                        />
                        <Text style={[styles.verifyHint, { color: colorScheme.textSecondary }]}>
                            Please check the child's clinic card for this number.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colorScheme.success || '#4CAF50' }]}
                        onPress={handleVerifyAndAdd}
                        disabled={loading}
                    >
                        {loading ? (
                            <CustomLoading size={20} color="#FFFFFF" />
                        ) : (
                            <>
                                <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.addButtonText}>Verify & Add Child</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {searchResults.length > 0 && (
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 100 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.resultItem, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border }]}
                                    onPress={() => setSelectedPatient(item)}
                                >
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: `${colorScheme.primary}15` }]}>
                                        <MaterialIcons name="face" size={24} color={colorScheme.primary} />
                                    </View>
                                    <View style={styles.resultContent}>
                                        <Text style={[styles.resultName, { color: colorScheme.textPrimary }]}>{item.displayName}</Text>
                                        <Text style={[styles.resultSub, { color: colorScheme.textSecondary }]}>
                                            🔒 Registration Number Protected • {item.gender}
                                        </Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={24} color={colorScheme.textTertiary} />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                    {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: colorScheme.textSecondary }}>No patients found</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
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
