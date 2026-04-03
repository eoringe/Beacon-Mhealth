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
// Safe import to prevent crashes without native module
let ImagePicker;
try {
    ImagePicker = require('expo-image-picker');
} catch (e) {
    ImagePicker = {
        MediaTypeOptions: { Images: 'Images' },
        launchImageLibraryAsync: async () => {
            alert("Image Picker requires a native rebuild.");
            return { canceled: true, assets: [] };
        }
    };
}
import { ActivityIndicator } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { useAlert } from '@/contexts/AlertContext';
import { storageService } from '@/services/storageService';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export default function EditProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const { selectedChild, updateChild } = useChild();
    const { showAlert } = useAlert();

    if (!selectedChild) {
        router.back();
        return null;
    }

    const [formData, setFormData] = useState({
        firstName: selectedChild.first_name,
        lastName: selectedChild.last_name || '',
        dateOfBirth: selectedChild.date_of_birth ? new Date(selectedChild.date_of_birth).toISOString().split('T')[0] : '',
        gender: selectedChild.gender,
        photoUrl: selectedChild.photo_url || '',
    });

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled) {
                const selectedUri = result.assets[0].uri;
                setUploading(true);
                
                // Upload to Firebase Storage
                const path = `children/${selectedChild.id}/profile_${Date.now()}.jpg`;
                const downloadUrl = await storageService.uploadImage(selectedUri, path);
                
                setFormData({ ...formData, photoUrl: downloadUrl });
                showAlert('Success', 'Profile photo updated locally. Remember to save changes.', [], 'success');
            }
        } catch (error) {
            console.error('Error picking/uploading image:', error);
            showAlert('Error', 'Failed to update photo', [], 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.firstName) {
            showAlert('Validation Error', 'First name is required.', [], 'error');
            return;
        }

        try {
            setSaving(true);
            await updateChild(selectedChild.id, {
                ...selectedChild,
                first_name: formData.firstName,
                last_name: formData.lastName,
                date_of_birth: formData.dateOfBirth,
                gender: formData.gender,
                photoUrl: formData.photoUrl
            });
            showAlert('Success', 'Profile updated successfully!', [], 'success');
            router.back();
        } catch (error) {
            console.error('Error saving profile:', error);
            showAlert('Error', 'Failed to save changes.', [], 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Edit Profile"
                showBack={true}
                rightComponent={
                    <TouchableOpacity onPress={handleSave} disabled={saving || uploading}>
                        {saving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text
                                style={[styles.saveButton, { color: '#FFFFFF' }]}
                                numberOfLines={1}
                            >
                                Save
                            </Text>
                        )}
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
                    <View style={[styles.avatarContainer, { backgroundColor: `${colorScheme.primary}15` }]}>
                        {formData.photoUrl ? (
                            <Image
                                source={{ uri: formData.photoUrl }}
                                style={styles.profilePhoto}
                            />
                        ) : (
                            <MaterialIcons name="person" size={60} color={colorScheme.primary} />
                        )}
                        {uploading && (
                            <View style={styles.uploadingOverlay}>
                                <ActivityIndicator color="#FFF" />
                            </View>
                        )}
                    </View>
                    <TouchableOpacity 
                        style={[styles.changePhotoButton, { backgroundColor: colorScheme.primary }]}
                        onPress={pickImage}
                        disabled={uploading}
                    >
                        <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                        <Text style={styles.changePhotoText}>Change Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.form}>
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colorScheme.textSecondary }]}>First Name</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={formData.firstName}
                            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                            placeholderTextColor={colorScheme.textTertiary}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Last Name</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={formData.lastName}
                            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                            placeholderTextColor={colorScheme.textTertiary}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colorScheme.textSecondary }]}>Date of Birth (YYYY-MM-DD)</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            value={formData.dateOfBirth}
                            onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                            placeholder="YYYY-MM-DD"
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
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: Spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    profilePhoto: {
        width: '100%',
        height: '100%',
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
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
