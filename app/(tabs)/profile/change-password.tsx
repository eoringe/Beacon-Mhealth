import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, DarkColors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Feather } from '@expo/vector-icons';
import { validatePassword, getPasswordStrength } from '@/utils/validation';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colorScheme } = useTheme();
    const { changePassword } = useAuth();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<any>(null);

    const handlePasswordChange = (text) => {
        setNewPassword(text);
        if (text) {
            setPasswordStrength(getPasswordStrength(text));
        } else {
            setPasswordStrength(null);
        }
    };

    const handleSave = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        const validation = validatePassword(newPassword);
        if (!validation.isValid) {
            Alert.alert('Weak Password', validation.errors.join('\n'));
            return;
        }

        setLoading(true);
        try {
            const result = await changePassword(newPassword);
            Alert.alert('Success', result.message, [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const isDark = colorScheme === 'dark';
    const textColor = isDark ? Colors.white : Colors.textPrimary;
    const placeholderColor = isDark ? '#888' : '#999';
    const inputBg = isDark ? '#333' : Colors.white;
    const borderColor = isDark ? '#444' : Colors.border;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? DarkColors.background : Colors.background }]}>
            <SafeHeader title="Change Password" showBack={true} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={[styles.description, { color: isDark ? '#CCC' : Colors.textSecondary }]}>
                        Create a new strong password for your account.
                    </Text>

                    {/* New Password */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: textColor }]}>New Password</Text>
                        <View style={[styles.passwordContainer, { backgroundColor: inputBg, borderColor: borderColor }]}>
                            <TextInput
                                style={[styles.passwordInput, { color: textColor }]}
                                value={newPassword}
                                onChangeText={handlePasswordChange}
                                secureTextEntry={!showNewPassword}
                                placeholder="Enter new password"
                                placeholderTextColor={placeholderColor}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Feather name={showNewPassword ? "eye" : "eye-off"} size={18} color={placeholderColor} />
                            </TouchableOpacity>
                        </View>

                        {/* Password Strength */}
                        {passwordStrength && (
                            <View style={styles.strengthContainer}>
                                <View style={styles.strengthBar}>
                                    <View
                                        style={[
                                            styles.strengthFill,
                                            {
                                                width: passwordStrength.level === 'weak' ? '33%' : passwordStrength.level === 'medium' ? '66%' : '100%',
                                                backgroundColor: passwordStrength.color
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                                    {passwordStrength.text}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: textColor }]}>Confirm New Password</Text>
                        <View style={[styles.passwordContainer, { backgroundColor: inputBg, borderColor: borderColor }]}>
                            <TextInput
                                style={[styles.passwordInput, { color: textColor }]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                placeholder="Re-enter new password"
                                placeholderTextColor={placeholderColor}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={18} color={placeholderColor} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: Colors.primary }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Update Password</Text>
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
    keyboardView: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
    },
    description: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.lg,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: Spacing.md,
        fontSize: Typography.fontSize.base,
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
    strengthContainer: {
        marginTop: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
    },
    strengthText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
    },
});
