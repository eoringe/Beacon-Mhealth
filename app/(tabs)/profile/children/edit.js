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
    Alert,
} from 'react-native';
import { CustomLoading } from '@/components/CustomLoading';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useChild } from '@/contexts/ChildContext';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAlert } from '@/contexts/AlertContext';

export default function EditChildScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { children, updateChild } = useChild();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState('');

    useEffect(() => {
        if (id && children.length > 0) {
            const child = children.find(c => c.id === id);
            if (child) {
                setFirstName(child.first_name);
                setLastName(child.last_name || '');
                setDateOfBirth(new Date(child.date_of_birth));
                setGender(child.gender);
            } else {
                showAlert('Error', 'Child not found', [{ text: 'OK', onPress: () => router.back() }], 'error');
                // Note: router.back() is called in onPress to ensure user sees error
            }
        }
    }, [id, children]);

    const handleSave = async () => {
        if (!firstName || !gender) {
            showAlert('Error', 'First Name and Gender are required', [], 'error');
            return;
        }

        setLoading(true);
        try {
            await updateChild(id, {
                firstName,
                lastName,
                dateOfBirth: dateOfBirth.toISOString().split('T')[0],
                gender
            });
            showAlert('Success', 'Child profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ], 'success');
        } catch (error) {
            showAlert('Error', error.message, [], 'error');
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || dateOfBirth;
        setShowDatePicker(Platform.OS === 'ios');
        setDateOfBirth(currentDate);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Child</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>First Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Enter first name"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Enter last name"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date of Birth *</Text>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={styles.dateText}>
                                {dateOfBirth.toLocaleDateString()}
                            </Text>
                            <MaterialIcons name="calendar-today" size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={dateOfBirth}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                                maximumDate={new Date()}
                            />
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender *</Text>
                        <View style={styles.genderContainer}>
                            {['Male', 'Female'].map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[
                                        styles.genderButton,
                                        gender === g && styles.genderButtonActive
                                    ]}
                                    onPress={() => setGender(g)}
                                >
                                    <Text
                                        style={[
                                            styles.genderText,
                                            gender === g && styles.genderTextActive
                                        ]}
                                    >
                                        {g}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <CustomLoading size={20} color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Update Profile</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl + 20,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    content: {
        padding: Spacing.lg,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    input: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.md,
        color: Colors.textPrimary,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
    },
    dateText: {
        fontSize: Typography.fontSize.md,
        color: Colors.textPrimary,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    genderButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        backgroundColor: Colors.white,
    },
    genderButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    genderText: {
        fontSize: Typography.fontSize.md,
        color: Colors.textPrimary,
    },
    genderTextActive: {
        color: Colors.white,
        fontWeight: Typography.fontWeight.bold,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
    },
});
