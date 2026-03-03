import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { getActivitiesForAge, getDailyPick, DEVELOPMENTAL_AREAS } from '@/constants/activitiesData';

const STORAGE_KEY = 'activities_done';

export default function ActivitiesScreen() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();

    const [doneToday, setDoneToday] = useState({});
    const childId = selectedChild?.id;

    // Calculate child age
    const childAgeMonths = selectedChild?.date_of_birth
        ? Math.floor((Date.now() - new Date(selectedChild.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        : selectedChild?.dob
            ? Math.floor((Date.now() - new Date(selectedChild.dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
            : 6;

    const activities = getActivitiesForAge(childAgeMonths);
    const dailyPick = getDailyPick(childAgeMonths);

    useFocusEffect(
        useCallback(() => {
            if (childId) loadDone();
        }, [childId])
    );

    const loadDone = async () => {
        try {
            const todayKey = `${STORAGE_KEY}_${childId}_${new Date().toDateString()}`;
            const stored = await AsyncStorage.getItem(todayKey);
            if (stored) setDoneToday(JSON.parse(stored));
            else setDoneToday({});
        } catch (e) {
            console.error('Error loading activities:', e);
        }
    };

    const toggleDone = async (activityId) => {
        const updated = { ...doneToday };
        if (updated[activityId]) {
            delete updated[activityId];
        } else {
            updated[activityId] = true;
        }
        setDoneToday(updated);
        try {
            const todayKey = `${STORAGE_KEY}_${childId}_${new Date().toDateString()}`;
            await AsyncStorage.setItem(todayKey, JSON.stringify(updated));
        } catch (e) {
            console.error('Error saving activities:', e);
        }
    };

    const getAreaInfo = (areaId) => DEVELOPMENTAL_AREAS.find(a => a.id === areaId) || DEVELOPMENTAL_AREAS[0];
    const doneCount = Object.keys(doneToday).length;

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Daily Activities" showBack={true} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Daily Pick */}
                {dailyPick && (
                    <View style={[styles.dailyPickCard, { backgroundColor: '#9C27B0' }]}>
                        <View style={styles.pickHeader}>
                            <MaterialIcons name="auto-awesome" size={24} color="#FFFFFF" />
                            <Text style={styles.pickTitle}>Today's Pick</Text>
                        </View>
                        <Text style={styles.pickActivityTitle}>{dailyPick.title}</Text>
                        <Text style={styles.pickDescription}>{dailyPick.description}</Text>
                        {dailyPick.materials && (
                            <View style={styles.materialsRow}>
                                <MaterialIcons name="inventory-2" size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.materialsText}>{dailyPick.materials}</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={[styles.donePickButton, {
                                backgroundColor: doneToday[dailyPick.id] ? '#4CAF50' : 'rgba(255,255,255,0.2)',
                            }]}
                            onPress={() => toggleDone(dailyPick.id)}
                        >
                            <MaterialIcons
                                name={doneToday[dailyPick.id] ? 'check-circle' : 'radio-button-unchecked'}
                                size={20}
                                color="#FFFFFF"
                            />
                            <Text style={styles.donePickText}>
                                {doneToday[dailyPick.id] ? 'Done!' : 'Mark as Done'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Today's Progress */}
                <View style={[styles.progressRow, { backgroundColor: colorScheme.surface }]}>
                    <MaterialIcons name="emoji-events" size={20} color={colorScheme.primary} />
                    <Text style={[styles.progressText, { color: colorScheme.textPrimary }]}>
                        {doneCount} of {activities.length} activities done today
                    </Text>
                </View>

                {/* Activities List */}
                <View style={styles.activitiesSection}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                        All Activities for {childAgeMonths}m old
                    </Text>
                    {activities.map((activity) => {
                        const area = getAreaInfo(activity.area);
                        const isDone = !!doneToday[activity.id];
                        return (
                            <View
                                key={activity.id}
                                style={[
                                    styles.activityCard,
                                    {
                                        backgroundColor: isDone ? `${area.color}08` : colorScheme.surface,
                                        borderColor: isDone ? area.color : colorScheme.border,
                                    }
                                ]}
                            >
                                <View style={styles.activityContent}>
                                    <View style={styles.activityHeader}>
                                        <View style={[styles.areaTag, { backgroundColor: `${area.color}20` }]}>
                                            <MaterialIcons name={area.icon} size={14} color={area.color} />
                                            <Text style={[styles.areaLabel, { color: area.color }]}>{area.label}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.activityTitle, { color: colorScheme.textPrimary }]}>
                                        {activity.title}
                                    </Text>
                                    <Text style={[styles.activityDesc, { color: colorScheme.textSecondary }]}>
                                        {activity.description}
                                    </Text>
                                    {activity.materials && (
                                        <View style={styles.materialsRowSmall}>
                                            <MaterialIcons name="inventory-2" size={12} color={colorScheme.textTertiary} />
                                            <Text style={[styles.materialsTextSmall, { color: colorScheme.textTertiary }]}>
                                                {activity.materials}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={[styles.doneButton, {
                                        backgroundColor: isDone ? area.color : colorScheme.surface,
                                        borderColor: isDone ? area.color : colorScheme.border,
                                    }]}
                                    onPress={() => toggleDone(activity.id)}
                                >
                                    <MaterialIcons
                                        name={isDone ? 'check' : 'radio-button-unchecked'}
                                        size={20}
                                        color={isDone ? '#FFFFFF' : colorScheme.textTertiary}
                                    />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    dailyPickCard: {
        margin: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
    },
    pickHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    pickTitle: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    pickActivityTitle: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.xs,
    },
    pickDescription: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: Typography.fontSize.sm,
        lineHeight: 20,
    },
    materialsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
    },
    materialsText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: Typography.fontSize.xs,
    },
    donePickButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    donePickText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginHorizontal: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        ...Shadow.sm,
    },
    progressText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    activitiesSection: {
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
    activityCard: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        ...Shadow.sm,
    },
    activityContent: { flex: 1 },
    activityHeader: {
        flexDirection: 'row',
        marginBottom: Spacing.xs,
    },
    areaTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    areaLabel: {
        fontSize: 10,
        fontWeight: Typography.fontWeight.semibold,
        textTransform: 'uppercase',
    },
    activityTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 2,
    },
    activityDesc: {
        fontSize: Typography.fontSize.sm,
        lineHeight: 18,
    },
    materialsRowSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: Spacing.xs,
    },
    materialsTextSmall: {
        fontSize: Typography.fontSize.xs,
    },
    doneButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: Spacing.sm,
        alignSelf: 'center',
    },
});
