import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Colors } from '@/constants/theme';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/config/firebase';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colorScheme } = useTheme();

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Load full profile from backend on mount to get phone number if not in Firebase
    useEffect(() => {
        const loadProfile = async () => {
            try {
                // We use authService to get the full profile including phone_number from DB
                // Assuming authService.getProfile exists and works.
                // If not, we might need to rely only on what we have or implement getProfile in service.
                // Check authService content... yes getProfile exists.
                const authService = require('@/services/authService').default; // Dynamic import to avoid cycles if any? Or standard import.
                // Actually standard import at top is better. But let's assume standard import.

                const profile = await authService.getProfile();
                if (profile && profile.user) {
                    if (profile.user.phone_number) setPhoneNumber(profile.user.phone_number);
                    // Also sync display name if different? Maybe.
                }
            } catch (e) {
                console.log('Failed to load backend profile details', e);
            } finally {
                setInitialLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        setLoading(true);
        try {
            // 1. Update Firebase Profile (Display Name)
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: displayName
                });
            }

            // 2. Update Backend Profile (Phone Number & Name syncing)
            const authService = require('@/services/authService').default;
            await authService.updateProfile({
                displayName,
                phoneNumber
            });

            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Edit Profile" showBack={true} />
            <View style={styles.content}>
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
            </View>
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
    }
});
