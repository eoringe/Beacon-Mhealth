import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme, isDark } = useTheme();
    const {
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        deleteNotification
    } = useNotifications();

    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', label: 'All', icon: 'notifications' },
        { id: 'appointments', label: 'Appointments', icon: 'event' },
        { id: 'vaccinations', label: 'Vaccinations', icon: 'vaccines' },
        { id: 'milestones', label: 'Milestones', icon: 'child-care' },
        { id: 'system', label: 'System', icon: 'settings' },
    ];

    const getCategoryIcon = (category) => {
        const cat = categories.find((c) => c.id === category);
        return cat?.icon || 'notifications';
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'appointments':
                return colorScheme.appointmentScheduled;
            case 'vaccinations':
                return colorScheme.vaccineCompleted;
            case 'milestones':
                return colorScheme.success;
            case 'system':
                return colorScheme.textSecondary;
            default:
                return colorScheme.primary;
        }
    };

    const filteredNotifications = notifications.filter(
        (notif) => selectedCategory === 'all' || notif.category === selectedCategory
    );

    const formatTime = (isoString) => {
        try {
            return formatDistanceToNow(new Date(isoString), { addSuffix: true });
        } catch (e) {
            return 'Just now';
        }
    };

    return (
        <View
            style={[styles.container, { backgroundColor: colorScheme.background }]}
        >
            <SafeHeader
                title="Notifications"
                showBack={true}
                rightComponent={
                    unreadCount > 0 && (
                        <View
                            style={[
                                styles.badge,
                                { backgroundColor: colorScheme.error },
                            ]}
                        >
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )
                }
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Category Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersContainer}
                    contentContainerStyle={styles.filtersContent}
                >
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor:
                                        selectedCategory === category.id
                                            ? colorScheme.primary
                                            : (isDark ? colorScheme.surface : '#FFFFFF'),
                                    borderColor: isDark ? colorScheme.border : (selectedCategory === category.id ? colorScheme.primary : '#E5E7EB'),
                                },
                            ]}
                            onPress={() => setSelectedCategory(category.id)}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons
                                name={category.icon}
                                size={18}
                                color={
                                    selectedCategory === category.id
                                        ? '#FFFFFF'
                                        : colorScheme.textSecondary
                                }
                            />
                            <Text
                                style={[
                                    styles.filterLabel,
                                    {
                                        color:
                                            selectedCategory === category.id
                                                ? '#FFFFFF'
                                                : colorScheme.textPrimary,
                                    },
                                ]}
                            >
                                {category.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Clear All Button */}
                {unreadCount > 0 && (
                    <TouchableOpacity
                        style={styles.clearAllButton}
                        activeOpacity={0.7}
                        onPress={markAllRead}
                    >
                        <Text
                            style={[styles.clearAllText, { color: colorScheme.primary }]}
                        >
                            Mark all as read
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Notifications List */}
                <View style={styles.section}>
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification) => (
                            <TouchableOpacity
                                key={notification.id}
                                style={[
                                    styles.notificationCard,
                                    {
                                        backgroundColor: notification.isRead
                                            ? colorScheme.surface
                                            : (isDark ? `${colorScheme.primary}20` : '#F0F7FF'),
                                        borderLeftColor: getCategoryColor(notification.category),
                                    },
                                ]}
                                activeOpacity={0.7}
                                onPress={() => markRead(notification.id)}
                            >
                                <View style={styles.notificationHeader}>
                                    <View
                                        style={[
                                            styles.iconContainer,
                                            {
                                                backgroundColor: `${getCategoryColor(
                                                    notification.category
                                                )}20`,
                                            },
                                        ]}
                                    >
                                        <MaterialIcons
                                            name={getCategoryIcon(notification.category)}
                                            size={20}
                                            color={getCategoryColor(notification.category)}
                                        />
                                    </View>
                                    <View style={styles.notificationContent}>
                                        <Text
                                            style={[
                                                styles.notificationTitle,
                                                {
                                                    color: colorScheme.textPrimary,
                                                    fontWeight: notification.isRead ? '500' : '700',
                                                },
                                            ]}
                                        >
                                            {notification.title}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.notificationMessage,
                                                { color: colorScheme.textSecondary },
                                            ]}
                                        >
                                            {notification.message}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.notificationTime,
                                                { color: colorScheme.textTertiary },
                                            ]}
                                        >
                                            {formatTime(notification.time)}
                                        </Text>
                                    </View>
                                    {!notification.isRead && (
                                        <View
                                            style={[
                                                styles.unreadDot,
                                                { backgroundColor: colorScheme.primary },
                                            ]}
                                        />
                                    )}
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.notificationActions}>
                                    <TouchableOpacity
                                        style={[
                                            styles.actionButton,
                                            { borderColor: colorScheme.border },
                                        ]}
                                        activeOpacity={0.7}
                                        onPress={() => deleteNotification(notification.id)}
                                    >
                                        <MaterialIcons
                                            name="delete-outline"
                                            size={16}
                                            color={colorScheme.error}
                                        />
                                        <Text
                                            style={[
                                                styles.actionButtonText,
                                                { color: colorScheme.error },
                                            ]}
                                        >
                                            Delete
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <MaterialIcons
                                name="notifications-off"
                                size={64}
                                color={colorScheme.textTertiary}
                            />
                            <Text
                                style={[styles.emptyStateText, { color: colorScheme.textSecondary }]}
                            >
                                No notifications found
                            </Text>
                        </View>
                    )}
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
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    filtersContainer: {
        marginVertical: Spacing.md,
    },
    filtersContent: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    filterLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    clearAllButton: {
        alignSelf: 'flex-end',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xs,
    },
    clearAllText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    section: {
        paddingHorizontal: Spacing.lg,
    },
    notificationCard: {
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderLeftWidth: 4,
        ...Shadow.sm,
    },
    notificationHeader: {
        flexDirection: 'row',
        marginBottom: Spacing.sm,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationContent: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    notificationTitle: {
        fontSize: Typography.fontSize.base,
        marginBottom: Spacing.xs,
    },
    notificationMessage: {
        fontSize: Typography.fontSize.sm,
        lineHeight: 18,
        marginBottom: Spacing.xs,
    },
    notificationTime: {
        fontSize: Typography.fontSize.xs,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 4,
    },
    notificationActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        gap: 4,
    },
    actionButtonText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl * 2,
    },
    emptyStateText: {
        marginTop: Spacing.md,
        fontSize: Typography.fontSize.base,
    },
});
