import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { useAlert } from '@/contexts/AlertContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import {
    FEEDING_TYPES,
    BREAST_SIDES,
    FOOD_CATEGORIES,
    FOOD_REACTIONS,
    BOTTLE_VOLUMES,
    DURATION_OPTIONS,
} from '@/constants/feedingTracker';

const STORAGE_KEY = 'feeding_logs';

export default function FeedingTrackerScreen() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();
    const { showAlert } = useAlert();

    const [logs, setLogs] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [feedingType, setFeedingType] = useState('breast');

    // Breast fields
    const [breastSide, setBreastSide] = useState('left');
    const [duration, setDuration] = useState(15);

    // Bottle fields
    const [volume, setVolume] = useState(120);

    // Solid fields
    const [foodCategory, setFoodCategory] = useState('fruits');
    const [foodName, setFoodName] = useState('');
    const [reaction, setReaction] = useState('none');

    const childId = selectedChild?.id;

    useFocusEffect(
        useCallback(() => {
            if (childId) loadLogs();
        }, [childId])
    );

    const loadLogs = async () => {
        try {
            const key = `${STORAGE_KEY}_${childId}`;
            const stored = await AsyncStorage.getItem(key);
            if (stored) setLogs(JSON.parse(stored));
            else setLogs([]);
        } catch (e) {
            console.error('Error loading feeding logs:', e);
        }
    };

    const saveLogs = async (newLogs) => {
        try {
            const key = `${STORAGE_KEY}_${childId}`;
            await AsyncStorage.setItem(key, JSON.stringify(newLogs));
        } catch (e) {
            console.error('Error saving feeding logs:', e);
        }
    };

    const handleAddEntry = () => {
        const entry = {
            id: Date.now().toString(),
            type: feedingType,
            timestamp: new Date().toISOString(),
        };

        if (feedingType === 'breast') {
            entry.side = breastSide;
            entry.duration = duration;
        } else if (feedingType === 'bottle') {
            entry.volume = volume;
        } else {
            entry.foodCategory = foodCategory;
            entry.foodName = foodName;
            entry.reaction = reaction;
        }

        const updated = [entry, ...logs];
        setLogs(updated);
        saveLogs(updated);
        resetForm();
        setShowAddModal(false);
    };

    const handleDeleteEntry = (entryId) => {
        showAlert(
            'Delete Entry',
            'Remove this feeding log entry?',
            [
                { text: 'Cancel' },
                {
                    text: 'Delete',
                    onPress: () => {
                        const updated = logs.filter(l => l.id !== entryId);
                        setLogs(updated);
                        saveLogs(updated);
                    }
                }
            ],
            'warning'
        );
    };

    const resetForm = () => {
        setFeedingType('breast');
        setBreastSide('left');
        setDuration(15);
        setVolume(120);
        setFoodCategory('fruits');
        setFoodName('');
        setReaction('none');
    };

    // Today's summary
    const today = new Date().toDateString();
    const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today);
    const breastCount = todayLogs.filter(l => l.type === 'breast').length;
    const bottleCount = todayLogs.filter(l => l.type === 'bottle').length;
    const solidCount = todayLogs.filter(l => l.type === 'solid').length;

    const formatTime = (isoString) => {
        const d = new Date(isoString);
        const h = d.getHours();
        const m = d.getMinutes().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h % 12 || 12}:${m} ${ampm}`;
    };

    const getTypeInfo = (typeId) => FEEDING_TYPES.find(t => t.id === typeId) || FEEDING_TYPES[0];

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Feeding Tracker"
                showBack={true}
                rightComponent={
                    <TouchableOpacity onPress={() => setShowAddModal(true)}>
                        <MaterialIcons name="add" size={24} color={colorScheme.primary} />
                    </TouchableOpacity>
                }
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Today's Summary */}
                <View style={[styles.summaryCard, { backgroundColor: colorScheme.primary }]}>
                    <Text style={styles.summaryTitle}>Today's Summary</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{breastCount}</Text>
                            <Text style={styles.summaryLabel}>Breastfeed</Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{bottleCount}</Text>
                            <Text style={styles.summaryLabel}>Bottle</Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{solidCount}</Text>
                            <Text style={styles.summaryLabel}>Solid Food</Text>
                        </View>
                    </View>
                </View>

                {/* Log List */}
                <View style={styles.logSection}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                        Recent Feeds
                    </Text>
                    {logs.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: colorScheme.surface }]}>
                            <MaterialIcons name="restaurant" size={48} color={colorScheme.textTertiary} />
                            <Text style={[styles.emptyText, { color: colorScheme.textSecondary }]}>
                                No feeding logs yet
                            </Text>
                            <Text style={[styles.emptySubtext, { color: colorScheme.textTertiary }]}>
                                Tap + to log a feed
                            </Text>
                        </View>
                    ) : (
                        logs.slice(0, 20).map((entry) => {
                            const typeInfo = getTypeInfo(entry.type);
                            return (
                                <TouchableOpacity
                                    key={entry.id}
                                    style={[styles.logCard, { backgroundColor: colorScheme.surface }]}
                                    onLongPress={() => handleDeleteEntry(entry.id)}
                                >
                                    <View style={[styles.logIcon, { backgroundColor: `${typeInfo.color}15` }]}>
                                        <MaterialIcons name={typeInfo.icon} size={24} color={typeInfo.color} />
                                    </View>
                                    <View style={styles.logInfo}>
                                        <Text style={[styles.logTitle, { color: colorScheme.textPrimary }]}>
                                            {typeInfo.label}
                                        </Text>
                                        <Text style={[styles.logDetail, { color: colorScheme.textSecondary }]}>
                                            {entry.type === 'breast' && `${entry.side} side • ${entry.duration} min`}
                                            {entry.type === 'bottle' && `${entry.volume} ml`}
                                            {entry.type === 'solid' && `${entry.foodName || entry.foodCategory}`}
                                        </Text>
                                    </View>
                                    <Text style={[styles.logTime, { color: colorScheme.textTertiary }]}>
                                        {formatTime(entry.timestamp)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* Add Feeding Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: colorScheme.background }]}>
                    <View style={[styles.modalHeader, {
                        backgroundColor: colorScheme.surface,
                        paddingTop: insets.top + Spacing.md
                    }]}>
                        <Text style={[styles.modalTitle, { color: colorScheme.textPrimary }]}>
                            Log Feeding
                        </Text>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <MaterialIcons name="close" size={24} color={colorScheme.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={styles.modalContent}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                        {/* Type Selector */}
                        <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>Type</Text>
                        <View style={styles.typeRow}>
                            {FEEDING_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.typeChip,
                                        {
                                            backgroundColor: feedingType === type.id ? type.color : colorScheme.surface,
                                            borderColor: feedingType === type.id ? type.color : colorScheme.border,
                                        }
                                    ]}
                                    onPress={() => setFeedingType(type.id)}
                                >
                                    <MaterialIcons
                                        name={type.icon}
                                        size={20}
                                        color={feedingType === type.id ? '#FFFFFF' : colorScheme.textSecondary}
                                    />
                                    <Text style={{
                                        color: feedingType === type.id ? '#FFFFFF' : colorScheme.textPrimary,
                                        fontSize: Typography.fontSize.sm,
                                        fontWeight: Typography.fontWeight.medium,
                                    }}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Breast Fields */}
                        {feedingType === 'breast' && (
                            <>
                                <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>Side</Text>
                                <View style={styles.typeRow}>
                                    {BREAST_SIDES.map((s) => (
                                        <TouchableOpacity
                                            key={s.id}
                                            style={[
                                                styles.sideChip,
                                                {
                                                    backgroundColor: breastSide === s.id ? colorScheme.primary : colorScheme.surface,
                                                    borderColor: breastSide === s.id ? colorScheme.primary : colorScheme.border,
                                                }
                                            ]}
                                            onPress={() => setBreastSide(s.id)}
                                        >
                                            <Text style={{
                                                color: breastSide === s.id ? '#FFFFFF' : colorScheme.textPrimary,
                                                fontSize: Typography.fontSize.sm,
                                            }}>
                                                {s.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>
                                    Duration: {duration} minutes
                                </Text>
                                <View style={styles.durationRow}>
                                    {DURATION_OPTIONS.map((d) => (
                                        <TouchableOpacity
                                            key={d}
                                            style={[
                                                styles.durationChip,
                                                {
                                                    backgroundColor: duration === d ? colorScheme.primary : colorScheme.surface,
                                                    borderColor: duration === d ? colorScheme.primary : colorScheme.border,
                                                }
                                            ]}
                                            onPress={() => setDuration(d)}
                                        >
                                            <Text style={{
                                                color: duration === d ? '#FFFFFF' : colorScheme.textPrimary,
                                                fontSize: Typography.fontSize.xs,
                                            }}>
                                                {d}m
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Bottle Fields */}
                        {feedingType === 'bottle' && (
                            <>
                                <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>
                                    Volume: {volume} ml
                                </Text>
                                <View style={styles.durationRow}>
                                    {BOTTLE_VOLUMES.map((v) => (
                                        <TouchableOpacity
                                            key={v}
                                            style={[
                                                styles.durationChip,
                                                {
                                                    backgroundColor: volume === v ? colorScheme.primary : colorScheme.surface,
                                                    borderColor: volume === v ? colorScheme.primary : colorScheme.border,
                                                }
                                            ]}
                                            onPress={() => setVolume(v)}
                                        >
                                            <Text style={{
                                                color: volume === v ? '#FFFFFF' : colorScheme.textPrimary,
                                                fontSize: Typography.fontSize.xs,
                                            }}>
                                                {v}ml
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Solid Fields */}
                        {feedingType === 'solid' && (
                            <>
                                <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>Category</Text>
                                <View style={styles.durationRow}>
                                    {FOOD_CATEGORIES.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.foodCatChip,
                                                {
                                                    backgroundColor: foodCategory === cat.id ? colorScheme.primary : colorScheme.surface,
                                                    borderColor: foodCategory === cat.id ? colorScheme.primary : colorScheme.border,
                                                }
                                            ]}
                                            onPress={() => setFoodCategory(cat.id)}
                                        >
                                            <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                                            <Text style={{
                                                color: foodCategory === cat.id ? '#FFFFFF' : colorScheme.textPrimary,
                                                fontSize: Typography.fontSize.xs,
                                            }}>
                                                {cat.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>Food Name</Text>
                                <TextInput
                                    style={[styles.textInput, {
                                        backgroundColor: colorScheme.surface,
                                        color: colorScheme.textPrimary,
                                        borderColor: colorScheme.border,
                                    }]}
                                    placeholder="e.g. Mashed banana"
                                    placeholderTextColor={colorScheme.textTertiary}
                                    value={foodName}
                                    onChangeText={setFoodName}
                                />

                                <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>Reaction</Text>
                                <View style={styles.typeRow}>
                                    {FOOD_REACTIONS.map((r) => (
                                        <TouchableOpacity
                                            key={r.id}
                                            style={[
                                                styles.reactionChip,
                                                {
                                                    backgroundColor: reaction === r.id ? r.color : colorScheme.surface,
                                                    borderColor: reaction === r.id ? r.color : colorScheme.border,
                                                }
                                            ]}
                                            onPress={() => setReaction(r.id)}
                                        >
                                            <MaterialIcons
                                                name={r.icon}
                                                size={16}
                                                color={reaction === r.id ? '#FFFFFF' : colorScheme.textSecondary}
                                            />
                                            <Text style={{
                                                color: reaction === r.id ? '#FFFFFF' : colorScheme.textPrimary,
                                                fontSize: Typography.fontSize.xs,
                                            }}>
                                                {r.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colorScheme.primary }]}
                            onPress={handleAddEntry}
                        >
                            <Text style={styles.saveButtonText}>Log Feeding</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    summaryCard: {
        margin: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
    },
    summaryTitle: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: 2,
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: Typography.fontSize.xs,
    },
    summaryDivider: { width: 1, height: 40 },
    logSection: { paddingHorizontal: Spacing.lg },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        padding: Spacing.xxxl,
        borderRadius: BorderRadius.lg,
        ...Shadow.sm,
    },
    emptyText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginTop: Spacing.md,
    },
    emptySubtext: {
        fontSize: Typography.fontSize.sm,
        marginTop: Spacing.xs,
    },
    logCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
        ...Shadow.sm,
    },
    logIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    logInfo: { flex: 1 },
    logTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    logDetail: {
        fontSize: Typography.fontSize.sm,
        marginTop: 2,
    },
    logTime: {
        fontSize: Typography.fontSize.xs,
    },
    // Modal styles
    modalContainer: { flex: 1 },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        ...Shadow.sm,
    },
    modalTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    modalContent: {
        flex: 1,
        padding: Spacing.lg,
    },
    fieldLabel: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.sm,
        marginTop: Spacing.lg,
    },
    typeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    typeChip: {
        flex: 1,
        minWidth: 90,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    sideChip: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    durationRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    durationChip: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    foodCatChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    reactionChip: {
        flex: 1,
        minWidth: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.base,
    },
    saveButton: {
        marginTop: Spacing.xxl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        ...Shadow.md,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
});
