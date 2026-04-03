import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Platform,
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

const STORAGE_KEY = 'firsts_journal';

const DEFAULT_FIRSTS = [
    { id: 'first_smile', label: 'First Smile', icon: 'sentiment-very-satisfied', color: '#E91E63' },
    { id: 'first_laugh', label: 'First Laugh', icon: 'mood', color: '#FF9800' },
    { id: 'first_rollover', label: 'First Rollover', icon: 'autorenew', color: '#4CAF50' },
    { id: 'first_situp', label: 'Sat Up Alone', icon: 'accessibility', color: '#2196F3' },
    { id: 'first_crawl', label: 'First Crawl', icon: 'directions-walk', color: '#9C27B0' },
    { id: 'first_steps', label: 'First Steps', icon: 'directions-run', color: '#F44336' },
    { id: 'first_word', label: 'First Word', icon: 'record-voice-over', color: '#00BCD4' },
    { id: 'first_tooth', label: 'First Tooth', icon: 'face', color: '#FF5722' },
    { id: 'first_food', label: 'First Solid Food', icon: 'restaurant', color: '#8BC34A' },
    { id: 'first_clap', label: 'First Clap', icon: 'front-hand', color: '#FFC107' },
    { id: 'first_wave', label: 'First Wave', icon: 'waving-hand', color: '#3F51B5' },
    { id: 'first_haircut', label: 'First Haircut', icon: 'content-cut', color: '#795548' },
    { id: 'first_bath', label: 'First Bath', icon: 'bathtub', color: '#009688' },
    { id: 'first_sleepthrough', label: 'Slept Through Night', icon: 'bedtime', color: '#5C6BC0' },
];

import DateTimePicker from '@react-native-community/datetimepicker';

export default function FirstsJournalScreen() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();
    const { showAlert } = useAlert();

    const [entries, setEntries] = useState({});
    const [showAddCustom, setShowAddCustom] = useState(false);
    const [customLabel, setCustomLabel] = useState('');
    const [customFirsts, setCustomFirsts] = useState([]);

    // Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerDate, setPickerDate] = useState(new Date());
    const [activeFirstId, setActiveFirstId] = useState(null);

    const childId = selectedChild?.id;

    useFocusEffect(
        useCallback(() => {
            if (childId) loadData();
        }, [childId])
    );

    const loadData = async () => {
        try {
            const key = `${STORAGE_KEY}_${childId}`;
            const stored = await AsyncStorage.getItem(key);
            if (stored) {
                const parsed = JSON.parse(stored);
                setEntries(parsed.entries || {});
                setCustomFirsts(parsed.customFirsts || []);
            } else {
                setEntries({});
                setCustomFirsts([]);
            }
        } catch (e) {
            console.error('Error loading firsts:', e);
        }
    };

    const saveData = async (newEntries, newCustom) => {
        try {
            const key = `${STORAGE_KEY}_${childId}`;
            await AsyncStorage.setItem(key, JSON.stringify({
                entries: newEntries,
                customFirsts: newCustom,
            }));
        } catch (e) {
            console.error('Error saving firsts:', e);
        }
    };

    const handleToggleFirst = (firstId) => {
        if (entries[firstId]) {
            showAlert(
                'Update Milestone',
                'What would you like to do?',
                [
                    { text: 'Cancel' },
                    {
                        text: 'Date',
                        onPress: () => {
                            setActiveFirstId(firstId);
                            setPickerDate(new Date(entries[firstId].date));
                            setShowDatePicker(true);
                        }
                    },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => {
                            const updated = { ...entries };
                            delete updated[firstId];
                            setEntries(updated);
                            saveData(updated, customFirsts);
                        }
                    }
                ],
                'info'
            );
        } else {
            setActiveFirstId(firstId);
            setPickerDate(new Date());
            setShowDatePicker(true);
        }
    };

    const onDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate && activeFirstId) {
            const updated = {
                ...entries,
                [activeFirstId]: { date: selectedDate.toISOString(), note: entries[activeFirstId]?.note || '' }
            };
            setEntries(updated);
            saveData(updated, customFirsts);
        }
    };

    const handleAddCustom = () => {
        if (!customLabel.trim()) return;
        const newCustom = [
            ...customFirsts,
            {
                id: `custom_${Date.now()}`,
                label: customLabel.trim(),
                icon: 'star',
                color: '#FF9800',
            }
        ];
        setCustomFirsts(newCustom);
        saveData(entries, newCustom);
        setCustomLabel('');
        setShowAddCustom(false);
    };

    const allFirsts = [...DEFAULT_FIRSTS, ...customFirsts];
    const completedCount = Object.keys(entries).length;

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Baby's Firsts"
                showBack={true}
                rightComponent={
                    <TouchableOpacity onPress={() => setShowAddCustom(true)}>
                        <MaterialIcons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                }
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Progress */}
                <View style={[styles.progressCard, { backgroundColor: colorScheme.primary }]}>
                    <MaterialIcons name="emoji-events" size={32} color="#FFFFFF" />
                    <Text style={styles.progressTitle}>Milestones Recorded</Text>
                    <Text style={styles.progressCount}>
                        {completedCount} / {allFirsts.length}
                    </Text>
                </View>

                {/* Firsts Grid */}
                <View style={styles.firstsSection}>
                    {allFirsts.map((first) => {
                        const isCompleted = !!entries[first.id];
                        return (
                            <TouchableOpacity
                                key={first.id}
                                style={[
                                    styles.firstCard,
                                    {
                                        backgroundColor: isCompleted ? `${first.color}10` : colorScheme.surface,
                                        borderColor: isCompleted ? first.color : colorScheme.border,
                                    }
                                ]}
                                onPress={() => handleToggleFirst(first.id)}
                            >
                                <View style={[styles.firstIcon, {
                                    backgroundColor: isCompleted ? `${first.color}20` : `${colorScheme.textTertiary}15`,
                                }]}>
                                    <MaterialIcons
                                        name={first.icon}
                                        size={28}
                                        color={isCompleted ? first.color : colorScheme.textTertiary}
                                    />
                                </View>
                                <Text style={[styles.firstLabel, {
                                    color: isCompleted ? colorScheme.textPrimary : colorScheme.textSecondary,
                                }]}>
                                    {first.label}
                                </Text>
                                {isCompleted ? (
                                    <View style={styles.completedInfo}>
                                        <MaterialIcons name="check-circle" size={18} color={first.color} />
                                        <Text style={[styles.dateText, { color: first.color }]}>
                                            {new Date(entries[first.id].date).toLocaleDateString()}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={[styles.tapHint, { color: colorScheme.textTertiary }]}>
                                        Tap to record
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Date Picker */}
            {showDatePicker && (
                <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    {...(Platform.OS === 'ios' ? {
                        onTouchCancel: () => setShowDatePicker(false),
                    } : {})}
                />
            )}
            {Platform.OS === 'ios' && showDatePicker && (
                <View style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    backgroundColor: colorScheme.surface,
                    borderTopWidth: 1,
                    borderTopColor: colorScheme.border,
                    padding: Spacing.md,
                }}>
                    <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={{ alignSelf: 'flex-end', padding: Spacing.sm }}
                    >
                        <Text style={{ color: colorScheme.primary, fontWeight: 'bold' }}>Done</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Add Custom First Modal */}
            <Modal
                visible={showAddCustom}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddCustom(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: colorScheme.background }]}>
                    <View style={[styles.modalHeader, {
                        backgroundColor: colorScheme.surface,
                        paddingTop: insets.top + Spacing.md,
                    }]}>
                        <Text style={[styles.modalTitle, { color: colorScheme.textPrimary }]}>
                            Add Custom "First"
                        </Text>
                        <TouchableOpacity onPress={() => setShowAddCustom(false)}>
                            <MaterialIcons name="close" size={24} color={colorScheme.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalContent}>
                        <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>
                            What was the "first"?
                        </Text>
                        <TextInput
                            style={[styles.textInput, {
                                backgroundColor: colorScheme.surface,
                                color: colorScheme.textPrimary,
                                borderColor: colorScheme.border,
                            }]}
                            placeholder="e.g. First trip to the park"
                            placeholderTextColor={colorScheme.textTertiary}
                            value={customLabel}
                            onChangeText={setCustomLabel}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={[styles.saveButton, {
                                backgroundColor: colorScheme.primary,
                                opacity: customLabel.trim() ? 1 : 0.5,
                            }]}
                            onPress={handleAddCustom}
                            disabled={!customLabel.trim()}
                        >
                            <Text style={styles.saveButtonText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    progressCard: {
        margin: Spacing.lg,
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    progressTitle: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        marginTop: Spacing.sm,
    },
    progressCount: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: Typography.fontWeight.bold,
        marginTop: Spacing.xs,
    },
    firstsSection: {
        paddingHorizontal: Spacing.lg,
    },
    firstCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        ...Shadow.sm,
    },
    firstIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    firstLabel: {
        flex: 1,
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
    },
    completedInfo: {
        alignItems: 'center',
        gap: 2,
    },
    dateText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    tapHint: {
        fontSize: Typography.fontSize.xs,
    },
    // Modal
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
        padding: Spacing.lg,
    },
    fieldLabel: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.base,
    },
    saveButton: {
        marginTop: Spacing.xl,
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
