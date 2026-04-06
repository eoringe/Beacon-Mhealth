import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAlert } from '@/contexts/AlertContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Colors } from '@/constants/theme';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/config/firebase';
import authService from '@/services/authService';
// Safe import to prevent crashes without native module
let ImagePicker: any;
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
import { MaterialIcons } from '@expo/vector-icons';
import { storageService } from '@/services/storageService';
import { Image } from 'react-native';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();
    const { colorScheme } = useTheme();
    const { showAlert } = useAlert();

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [photoUrl, setPhotoUrl] = useState(user?.photoURL || null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Load full profile from backend on mount to get phone number
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profile = await authService.getProfile();
                if (profile && profile.user) {
                    if (profile.user.phone_number) setPhoneNumber(profile.user.phone_number);
                    if (profile.user.display_name) setDisplayName(profile.user.display_name);
                    if (profile.user.photo_url) setPhotoUrl(profile.user.photo_url);
                }
            } catch (e) {
                console.log('Failed to load backend profile details', e);
            } finally {
                setInitialLoading(false);
            }
        };
        loadProfile();
    }, []);

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
                setSelectedImage(selectedUri);
                setUploading(true);
                
                // Immediately upload to Firebase Storage
                const path = `profiles/${user?.uid}/avatar_${Date.now()}.jpg`;
                const downloadUrl = await storageService.uploadImage(selectedUri, path);
                setPhotoUrl(downloadUrl);
                setSelectedImage(null); // Clear local image once uploaded
                showAlert('Success', 'Profile photo updated!', [], 'success');
            }
        } catch (error) {
            console.error('Error picking/uploading image:', error);
            showAlert('Error', 'Failed to update photo', [], 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            showAlert('Error', 'Name cannot be empty', [], 'error');
            return;
        }

        setLoading(true);
        try {
            let finalPhotoUrl = photoUrl;

            // 1. Update Firebase Profile
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: displayName,
                    photoURL: finalPhotoUrl
                });
            }

            // 3. Update Backend Profile
            await authService.updateProfile({
                displayName,
                phoneNumber,
                photoUrl: finalPhotoUrl
            });

            // 4. Refresh the AuthContext user object
            await refreshProfile();

            showAlert('Success', 'Profile updated successfully', [], 'success');
            setSelectedImage(null);
            setPhotoUrl(finalPhotoUrl);
        } catch (error: any) {
            console.error(error);
            showAlert('Error', 'Failed to update profile: ' + (error?.message || 'Unknown error'), [], 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Edit Profile" showBack={true} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.profileImageContainer}>
                        <TouchableOpacity onPress={pickImage} style={styles.imageWrapper} disabled={uploading}>
                            {selectedImage || photoUrl ? (
                                <Image 
                                    source={{ uri: (selectedImage || photoUrl) as string }} 
                                    style={styles.profileImage} 
                                />
                            ) : (
                                <View style={[styles.imagePlaceholder, { backgroundColor: colorScheme.surface }]}>
                                    <MaterialIcons name="person" size={50} color={colorScheme.primary} />
                                </View>
                            )}
                            
                            {uploading && (
                                <View style={styles.uploadingOverlay}>
                                    <ActivityIndicator size="large" color="#FFF" />
                                    <Text style={styles.uploadingText}>Uploading...</Text>
                                </View>
                            )}

                            <View style={[styles.editIconContainer, { backgroundColor: colorScheme.primary }]}>
                                <MaterialIcons name="edit" size={20} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.imageActionText, { color: colorScheme.primary }]}>
                            Change Profile Photo
                        </Text>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colorScheme.textPrimary }]}>Full Name</Text>
                        <TextInput
                            style={[styles.input, {
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                                backgroundColor: colorScheme.surface
                            }]}
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Enter your name"
                            placeholderTextColor={colorScheme.textSecondary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colorScheme.textPrimary }]}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, {
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                                backgroundColor: colorScheme.surface
                            }]}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            placeholder="e.g. 0712345678"
                            placeholderTextColor={colorScheme.textSecondary}
                            keyboardType="phone-pad"
                        />
                        <Text style={[styles.helperText, { color: colorScheme.textSecondary }]}>
                            Used for appointment bookings.
                        </Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colorScheme.textPrimary }]}>Email</Text>
                        <View style={[styles.input, {
                            backgroundColor: colorScheme.surface,
                            borderColor: colorScheme.border,
                            opacity: 0.7
                        }]}>
                            <Text style={{ color: colorScheme.textSecondary }}>{user?.email}</Text>
                        </View>
                        <Text style={[styles.helperText, { color: colorScheme.textSecondary }]}>
                            Email cannot be changed directly.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.changePasswordButton, { borderColor: colorScheme.primary }]}
                        onPress={() => router.push('/profile/change-password')}
                    >
                        <Text style={[styles.changePasswordText, { color: colorScheme.primary }]}>Change Password</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colorScheme.primary }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.lg },
    inputGroup: { marginBottom: Spacing.lg },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.base,
    },
    helperText: {
        fontSize: Typography.fontSize.xs,
        marginTop: Spacing.xs,
    },
    saveButton: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: Typography.fontSize.md,
    },
    changePasswordButton: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginTop: Spacing.xs,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    changePasswordText: {
        fontWeight: '600',
        fontSize: Typography.fontSize.md,
    },
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    imageWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        position: 'relative',
        marginBottom: Spacing.sm,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    imagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E1E1E1',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    imageActionText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: '600',
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 60,
        zIndex: 1000,
        elevation: 10,
    },
    uploadingText: {
        color: '#FFF',
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600',
    }
});
