import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeHeader } from '@/components/SafeHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

// External URLs for legal pages
const TERMS_URL = 'https://beaconchildrencenter.co.ke/terms-of-use?token=mobile-app-secure-access';
const PRIVACY_URL = 'https://beaconchildrencenter.co.ke/privacy-policy?token=mobile-app-secure-access';

export default function SettingsScreen() {
    const { colorScheme } = useTheme();
    const router = useRouter();
    const { deleteAccount, logout } = useAuth();
    const { showAlert } = useAlert();
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDeleteAccount = () => {
        showAlert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
            [
                { text: 'Cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            setIsDeleting(true);
                            await deleteAccount();
                            // AuthContext handles redirect after logout/delete
                        } catch (error: any) {
                            // Handle Firebase requires-recent-login error
                            if (error?.code === 'auth/requires-recent-login') {
                                showAlert(
                                    'Session Expired',
                                    'For your security, please log out and log back in before deleting your account.',
                                    [{ text: 'OK' }],
                                    'warning'
                                );
                            } else {
                                showAlert('Error', error?.message || 'Failed to delete account. Please try again.', [], 'error');
                            }
                        } finally {
                            setIsDeleting(false);
                        }
                    }
                }
            ],
            'warning'
        );
    };

    const openExternalLink = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch (error) {
            showAlert('Error', 'Could not open the link. Please try again.', [], 'error');
        }
    };

    const SettingItem = ({ icon, title, onPress, destructive = false }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; onPress: () => void; destructive?: boolean }) => (
        <TouchableOpacity
            style={[styles.item, { borderBottomColor: colorScheme.border }]}
            onPress={onPress}
        >
            <View style={styles.itemLeft}>
                <View style={[
                    styles.iconContainer,
                    { backgroundColor: destructive ? '#FEE2E2' : (colorScheme as any).surfaceVariant || colorScheme.primaryLight }
                ]}>
                    <MaterialIcons
                        name={icon}
                        size={20}
                        color={destructive ? Colors.error : colorScheme.primary}
                    />
                </View>
                <Text style={[
                    styles.itemTitle,
                    { color: destructive ? Colors.error : colorScheme.textPrimary }
                ]}>
                    {title}
                </Text>
            </View>
            <MaterialIcons
                name="chevron-right"
                size={24}
                color={colorScheme.textTertiary}
            />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Settings" showBack={true} />

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textSecondary }]}>
                        Legal
                    </Text>
                    <View style={[styles.sectionContent, { backgroundColor: colorScheme.surface }]}>
                        <SettingItem
                            icon="description"
                            title="Terms of Service"
                            onPress={() => openExternalLink(TERMS_URL)}
                        />
                        <SettingItem
                            icon="privacy-tip"
                            title="Privacy Policy"
                            onPress={() => openExternalLink(PRIVACY_URL)}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textSecondary }]}>
                        Account
                    </Text>
                    <View style={[styles.sectionContent, { backgroundColor: colorScheme.surface }]}>
                        <SettingItem
                            icon="child-care"
                            title="My Children"
                            onPress={() => router.push('/profile/children')}
                        />
                        <SettingItem
                            icon="delete-forever"
                            title={isDeleting ? "Deleting..." : "Delete Account"}
                            onPress={handleDeleteAccount}
                            destructive={true}
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.versionText, { color: colorScheme.textTertiary }]}>
                        Version 1.1.0
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flex: 1,
        padding: Spacing.md,
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionContent: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderBottomWidth: 1,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTitle: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    versionText: {
        fontSize: Typography.fontSize.sm,
    },
});
