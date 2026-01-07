import React, { useState } from 'react';
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
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        setLoading(true);
        try {
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: displayName
                });
                Alert.alert('Success', 'Profile updated successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update profile');
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
    }
});
