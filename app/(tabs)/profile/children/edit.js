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
} from 'react-native';
import { CustomLoading } from '@/components/CustomLoading';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useChild } from '@/contexts/ChildContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAlert } from '@/contexts/AlertContext';
import { SafeHeader } from '@/components/SafeHeader';

export default function EditChildScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { children, updateChild } = useChild();
    const { colorScheme, isDark } = useTheme();
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
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Edit Child" showBack />

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
                        <Text style={[styles.label, { color: colorScheme.textPrimary }]}>First Name *</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.surface,
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
                                backgroundColor: colorScheme.surface,
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
                                backgroundColor: colorScheme.surface,
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
                                            backgroundColor: colorScheme.surface,
                                            borderColor: colorScheme.border
                                        },
                                        gender === g && {
                                            backgroundColor: colorScheme.primary,
                                            borderColor: colorScheme.primary
                                        }
                                    ]}
                                    onPress={() => setGender(g)}
                                >
                                    <Text
                                        style={[
                                            styles.genderText,
                                            { color: colorScheme.textPrimary },
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
                        style={[styles.saveButton, { backgroundColor: colorScheme.primary }]}
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl + 20,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
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
        marginBottom: Spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.md,
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
    genderTextActive: {
        color: '#FFFFFF',
        fontWeight: Typography.fontWeight.bold,
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
    backButton: {
        padding: Spacing.xs,
    },
});
