import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export default function EditProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();

    const [formData, setFormData] = useState({
        name: 'Emma Johnson',
        dateOfBirth: '2023-06-15',
        gender: 'Female',
        bloodType: 'O+',
        allergies: 'None',
        notes: '',
    });

    const handleSave = () => {
        // Save logic here
        router.back();
    };

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Edit Profile"
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
                {/* Profile Photo */}
                <View style={styles.photoSection}>
                    <Image
                        source={require('../../assets/images/beacon.jpg')}
                        style={styles.profilePhoto}
                    />
                    <TouchableOpacity style={[styles.changePhotoButton, { backgroundColor: colorScheme.primary }]}>
                        <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                        <Text style={styles.changePhotoText}>Change Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.form}>
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Full Name</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholderTextColor={colorScheme.textTertiary}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Date of Birth</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={formData.dateOfBirth}
                            onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                            placeholderTextColor={colorScheme.textTertiary}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Gender</Text>
                        <View style={styles.genderButtons}>
                            {['Male', 'Female', 'Other'].map((gender) => (
                                <TouchableOpacity
                                    key={gender}
                                    style={[
                                        styles.genderButton,
                                        {
                                            backgroundColor: formData.gender === gender
                                                ? colorScheme.primary
                                                : colorScheme.surface,
                                            borderColor: colorScheme.border,
                                        },
                                    ]}
                                    onPress={() => setFormData({ ...formData, gender })}
                                >
                                    <Text style={{
                                        color: formData.gender === gender
                                            ? '#FFFFFF'
                                            : colorScheme.textPrimary,
                                    }}>
                                        {gender}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Blood Type</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={formData.bloodType}
                            onChangeText={(text) => setFormData({ ...formData, bloodType: text })}
                            placeholderTextColor={colorScheme.textTertiary}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Allergies</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={formData.allergies}
                            onChangeText={(text) => setFormData({ ...formData, allergies: text })}
                            placeholder="Enter any allergies"
                            placeholderTextColor={colorScheme.textTertiary}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Notes</Text>
                        <TextInput
                            style={[styles.textArea, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={formData.notes}
                            onChangeText={(text) => setFormData({ ...formData, notes: text })}
                            placeholder="Add any additional notes"
                            placeholderTextColor={colorScheme.textTertiary}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
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
    photoSection: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
    },
    profilePhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: Spacing.md,
    },
    changePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    changePhotoText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    form: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
    },
    formGroup: {
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
    genderButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    genderButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
    },
});
