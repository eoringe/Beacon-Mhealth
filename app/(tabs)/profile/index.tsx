import React, { ComponentProps } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { SafeHeader } from '@/components/SafeHeader';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme, isDark, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const { showAlert } = useAlert(); // Added this line

    const handleLogout = () => {
        showAlert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (error) {
                            console.error('Logout failed:', error);
                            showAlert('Error', 'Failed to logout', [], 'error');
                        }
                    }
                }
            ],
            'warning'
        );
    };

    const isNavigating = React.useRef(false);

    const handleNavigation = (path: string) => {
        if (isNavigating.current) return;
        isNavigating.current = true;
        router.push(path as any);
        // Reset navigation lock after a delay
        setTimeout(() => {
            isNavigating.current = false;
        }, 1000);
    };

    const profileSections: Array<{
        title: string;
        items: Array<{
            icon: IconName;
            label: string;
            color: string;
            subtitle?: string;
            hasArrow?: boolean;
            onPress: () => void;
        }>;
    }> = [
            {
                title: 'Quick Actions',
                items: [
                    {
                        icon: 'edit' as IconName,
                        label: 'Edit Profile',
                        color: colorScheme.primary,
                        onPress: () => {
                            handleNavigation('/profile/edit');
                        },
                    },
                    {
                        icon: 'settings' as IconName,
                        label: 'Settings',
                        color: colorScheme.info,
                        onPress: () => {
                            handleNavigation('/settings');
                        },
                    },
                    {
                        icon: 'help' as IconName,
                        label: 'Help & Support',
                        color: colorScheme.success,
                        onPress: () => {
                            handleNavigation('/help');
                        },
                    },
                ],
            },
            {
                title: 'Preferences',
                items: [
                    {
                        icon: 'notifications' as IconName,
                        label: 'Notifications',
                        color: colorScheme.warning,
                        hasArrow: true,
                        onPress: () => {
                            handleNavigation('/notifications');
                        },
                    },
                    {
                        icon: (isDark ? 'light-mode' : 'dark-mode') as IconName,
                        label: 'Theme',
                        color: colorScheme.textSecondary,
                        hasArrow: false,
                        subtitle: isDark ? 'Dark Mode' : 'Light Mode',
                        onPress: () => {
                            toggleTheme();
                        },
                    },
                    {
                        icon: 'language' as IconName,
                        label: 'Language',
                        color: colorScheme.primary,
                        subtitle: 'English',
                        hasArrow: true,
                        onPress: () => {
                            // Language selection not yet implemented
                        },
                    },
                ],
            },
            {
                title: 'About',
                items: [
                    {
                        icon: 'description' as IconName,
                        label: 'Terms of Service',
                        color: colorScheme.textSecondary,
                        hasArrow: true,
                        onPress: () => {
                            Linking.openURL('https://www.beaconchildrencenter.co.ke/terms-of-service');
                        },
                    },
                    {
                        icon: 'privacy-tip' as IconName,
                        label: 'Privacy Policy',
                        color: colorScheme.textSecondary,
                        hasArrow: true,
                        onPress: () => {
                            Linking.openURL('https://www.beaconchildrencenter.co.ke/privacy-policy');
                        },
                    },
                    {
                        icon: 'info-outline' as IconName,
                        label: 'App Version',
                        color: colorScheme.textTertiary,
                        subtitle: '1.0.0',
                        onPress: () => { },
                    },
                ],
            },
        ];

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Profile" showBack={false} showMenu={true} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={[styles.profileHeader, { backgroundColor: colorScheme.surface }]}>
                    <View style={[styles.avatarContainer, { backgroundColor: colorScheme.primaryLight }]}>
                        <MaterialIcons name="person" size={48} color={colorScheme.primary} />
                    </View>
                    <Text style={[styles.userName, { color: colorScheme.textPrimary }]}>
                        {user?.displayName || 'User'}
                    </Text>
                    <Text style={[styles.userEmail, { color: colorScheme.textSecondary }]}>
                        {user?.email || 'No email attached'}
                    </Text>
                </View>

                {/* Profile Sections */}
                {profileSections.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                            {section.title}
                        </Text>
                        <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                            {section.items.map((item, itemIndex) => (
                                <React.Fragment key={itemIndex}>
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={item.onPress}
                                        activeOpacity={0.7}
                                    >
                                        <View
                                            style={[
                                                styles.iconContainer,
                                                { backgroundColor: `${item.color}15` },
                                            ]}
                                        >
                                            <MaterialIcons name={item.icon} size={20} color={item.color} />
                                        </View>
                                        <View style={styles.menuContent}>
                                            <Text style={[styles.menuLabel, { color: colorScheme.textPrimary }]}>
                                                {item.label}
                                            </Text>
                                            {item.subtitle && (
                                                <Text style={[styles.menuSubtitle, { color: colorScheme.textSecondary }]}>
                                                    {item.subtitle}
                                                </Text>
                                            )}
                                        </View>
                                        {item.hasArrow && (
                                            <MaterialIcons
                                                name="chevron-right"
                                                size={24}
                                                color={colorScheme.textTertiary}
                                            />
                                        )}
                                    </TouchableOpacity>
                                    {itemIndex < section.items.length - 1 && (
                                        <View style={[styles.divider, { backgroundColor: colorScheme.border }]} />
                                    )}
                                </React.Fragment>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Logout Button */}
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colorScheme.error }]}
                    activeOpacity={0.8}
                    onPress={handleLogout}
                >
                    <MaterialIcons name="logout" size={20} color="#FFFFFF" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
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
    profileHeader: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
        marginBottom: Spacing.lg,
        ...Shadow.sm,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    userName: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.xs,
    },
    userEmail: {
        fontSize: Typography.fontSize.base,
    },
    section: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
    card: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        ...Shadow.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    menuLabel: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
    },
    menuSubtitle: {
        fontSize: Typography.fontSize.sm,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.xs,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: Spacing.lg,
        marginVertical: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    logoutText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
});
