import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    ScrollView,
    Pressable,
    BackHandler,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChild } from '@/contexts/ChildContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.82;

const NAV_SECTIONS = [
    {
        title: 'Health',
        items: [
            { id: 'growth', label: 'Growth Chart', icon: 'show-chart', route: '/dashboard/growth-chart', color: '#2196F3' },
            { id: 'vaccinations', label: 'Vaccinations', icon: 'vaccines', route: '/dashboard/vaccinations', color: '#4CAF50' },
            { id: 'milestone_check', label: 'Milestone Checker', icon: 'checklist', route: '/dashboard/milestone-checklist', color: '#4CAF50' },
            { id: 'prescriptions', label: 'Prescriptions', icon: 'medication', route: '/dashboard/prescriptions', color: '#E91E63' },
            { id: 'reports', label: 'Medical Reports', icon: 'folder-open', route: '/dashboard/medical-reports', color: '#9C27B0' },
        ],
    },
    {
        title: 'Daily Care',
        items: [
            { id: 'feeding', label: 'Feeding Tracker', icon: 'restaurant', route: '/dashboard/feeding', color: '#E91E63' },
            { id: 'sleep', label: 'Sleep Tracker', icon: 'bedtime', route: '/dashboard/sleep', color: '#5C6BC0' },
            { id: 'teething', label: 'Teething Chart', icon: 'face', route: '/dashboard/teething', color: '#FF5722' },
        ],
    },
    {
        title: 'Development',
        items: [
            { id: 'firsts', label: "Baby's Firsts", icon: 'emoji-events', route: '/dashboard/firsts', color: '#FF9800' },
            { id: 'activities', label: 'Daily Activities', icon: 'sports-handball', route: '/dashboard/activities', color: '#009688' },
        ],
    },
];

export default function NavigationDrawer({ visible, onClose }) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const { user, logout } = useAuth();
    const { selectedChild, children: childrenList } = useChild();
    const [isRendered, setIsRendered] = useState(false);

    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setIsRendered(true);
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -DRAWER_WIDTH,
                    duration: 220,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setIsRendered(false);
            });
        }
    }, [visible]);

    // Handle Android back button
    useEffect(() => {
        if (!visible || Platform.OS !== 'android') return;
        const handler = BackHandler.addEventListener('hardwareBackPress', () => {
            onClose();
            return true;
        });
        return () => handler.remove();
    }, [visible]);

    const handleNavigate = (route) => {
        onClose();
        setTimeout(() => {
            router.push(route);
        }, 300);
    };

    const handleLogout = () => {
        onClose();
        setTimeout(() => {
            logout();
        }, 300);
    };

    if (!isRendered && !visible) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
            {/* Overlay */}
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            {/* Drawer */}
            <Animated.View style={[
                styles.drawer,
                {
                    width: DRAWER_WIDTH,
                    backgroundColor: colorScheme.background,
                    transform: [{ translateX: slideAnim }],
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                },
            ]}>
                {/* User Profile Header */}
                <View style={[styles.profileSection, { backgroundColor: colorScheme.primary }]}>
                    <View style={styles.profileAvatar}>
                        <MaterialIcons name="account-circle" size={52} color="rgba(255,255,255,0.9)" />
                    </View>
                    <Text style={styles.profileName} numberOfLines={1}>
                        {user?.displayName || 'Parent'}
                    </Text>
                    <Text style={styles.profileEmail} numberOfLines={1}>
                        {user?.email || ''}
                    </Text>
                    {selectedChild && (
                        <View style={styles.childBadge}>
                            <MaterialIcons name="face" size={16} color="#FFFFFF" />
                            <Text style={styles.childBadgeText}>
                                {selectedChild.first_name} {selectedChild.last_name}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Nav Sections */}
                <ScrollView
                    style={styles.navContent}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    {NAV_SECTIONS.map((section) => (
                        <View key={section.title} style={styles.navSection}>
                            <Text style={[styles.sectionLabel, { color: colorScheme.textTertiary }]}>
                                {section.title}
                            </Text>
                            {section.items.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.navItem, { borderColor: colorScheme.border }]}
                                    onPress={() => handleNavigate(item.route)}
                                    activeOpacity={0.6}
                                >
                                    <MaterialIcons
                                        name={item.icon}
                                        size={22}
                                        color={item.color || colorScheme.primary}
                                    />
                                    <Text style={[styles.navItemLabel, { color: colorScheme.textPrimary }]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </ScrollView>

                {/* Footer */}
                <View style={[styles.footer, { borderTopColor: colorScheme.border }]}>
                    <View style={styles.footerRow}>
                        <ThemeToggle />
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <MaterialIcons name="logout" size={20} color="#FF5252" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawer: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    profileSection: {
        padding: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.lg,
    },
    profileAvatar: {
        marginBottom: Spacing.sm,
    },
    profileName: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    profileEmail: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: Typography.fontSize.sm,
        marginTop: 2,
    },
    childBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.md,
        alignSelf: 'flex-start',
    },
    childBadgeText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    navContent: {
        flex: 1,
    },
    navSection: {
        paddingHorizontal: Spacing.md,
        marginTop: Spacing.md,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: Typography.fontWeight.bold,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: Spacing.xs,
        paddingHorizontal: Spacing.sm,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: 11,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    navItemLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    footer: {
        borderTopWidth: 1,
        padding: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    logoutText: {
        color: '#FF5252',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
});
