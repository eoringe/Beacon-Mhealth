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
    Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChild } from '@/contexts/ChildContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

const NAV_SECTIONS = [
    {
        title: 'Health',
        items: [
            { id: 'growth', label: 'Growth Chart', icon: 'show-chart', route: '/dashboard/growth-chart', color: '#2196F3' },
            { id: 'vaccinations', label: 'Vaccinations', icon: 'vaccines', route: '/dashboard/vaccinations', color: '#4CAF50' },
            { id: 'milestone_check', label: 'Milestones Checker', icon: 'checklist', route: '/dashboard/milestone-checklist', color: '#4CAF50' },
            { id: 'milestone_overview', label: 'Milestones Overview', icon: 'flag', route: '/explore', color: '#673AB7' },
            { id: 'asd_screener', label: 'ASD Screener', icon: 'psychology', route: '/asd-checklist', color: '#673AB7' },
            { id: 'reports', label: 'Medical Reports', icon: 'folder-open', route: '/dashboard/medical-reports', color: '#9C27B0' },
            { id: 'firsts', label: "Baby's Firsts", icon: 'emoji-events', route: '/dashboard/firsts', color: '#FF9800' },
        ],
    },
    {
        title: 'Daily Care',
        items: [
            { id: 'feeding', label: 'Feeding Tracker', icon: 'restaurant', route: '/dashboard/feeding', color: '#E91E63' },
            { id: 'sleep', label: 'Sleep Tracker', icon: 'bedtime', route: '/dashboard/sleep', color: '#5C6BC0' },
            { id: 'teething', label: 'Teething Chart', icon: 'face', route: '/dashboard/teething', color: '#FF5722' },
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
    const isNavigating = useRef(false);

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

    const pathname = usePathname();
    const handleNavigate = (route) => {
        if (isNavigating.current) return;
        
        // Prevent duplicate navigation if already on the route
        if (pathname === route || (route.startsWith('/(tabs)') && pathname === route.replace('/(tabs)', ''))) {
            onClose();
            return;
        }

        isNavigating.current = true;
        onClose();
        
        setTimeout(() => {
            router.push(route);
            // Reset navigation lock after a bit
            setTimeout(() => { isNavigating.current = false; }, 500);
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
                        {user?.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
                        ) : (
                            <MaterialIcons name="account-circle" size={64} color="rgba(255,255,255,0.9)" />
                        )}
                    </View>
                    <Text style={styles.profileName} numberOfLines={1}>
                        {user?.displayName || 'Parent'}
                    </Text>
                    <Text style={styles.profileEmail} numberOfLines={1}>
                        {user?.email || ''}
                    </Text>
                    {selectedChild && (
                        <View style={styles.childBadge}>
                            {selectedChild.photo_url ? (
                                <Image source={{ uri: selectedChild.photo_url }} style={styles.childBadgeImage} />
                            ) : (
                                <MaterialIcons name="face" size={16} color="#FFFFFF" />
                            )}
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
                    {/* ── Beacon AI Highlighted Link ── */}
                    <View style={[styles.navSection, { marginTop: Spacing.md }]}>
                        <TouchableOpacity
                            style={[styles.aiNavButton, { backgroundColor: `${colorScheme.primary}18`, borderColor: `${colorScheme.primary}40` }]}
                            onPress={() => handleNavigate('/beacon-ai')}
                            activeOpacity={0.75}
                        >
                            <View style={[styles.aiNavIcon, { backgroundColor: colorScheme.primary }]}>
                                <MaterialIcons name="smart-toy" size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.aiNavText}>
                                <Text style={[styles.aiNavLabel, { color: colorScheme.primary }]}>Ask Beacon AI</Text>
                                <Text style={[styles.aiNavSub, { color: colorScheme.textSecondary }]}>Your Beacon assistant</Text>
                            </View>
                            <View style={styles.aiOnlineDot} />
                        </TouchableOpacity>
                    </View>

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
    // AI Nav Button
    aiNavButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    aiNavIcon: {
        width: 38,
        height: 38,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiNavText: {
        flex: 1,
    },
    aiNavLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.bold,
    },
    aiNavSub: {
        fontSize: Typography.fontSize.xs,
        marginTop: 1,
    },
    aiOnlineDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: '#22C55E',
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
    avatarImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    childBadgeImage: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
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
