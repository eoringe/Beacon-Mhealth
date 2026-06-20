import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    KeyboardAvoidingView,
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
import { FeedingChart } from '@/components/FeedingChart';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import {
    FEEDING_TYPES,
    BREAST_SIDES,
    FOOD_CATEGORIES,
    BOTTLE_VOLUMES,
    DURATION_OPTIONS,
    FEEDING_FREQUENCIES,
} from '@/constants/feedingTracker';
import { FEEDING_GUIDELINES, GENERAL_TIPS, SOURCE_INFO } from '@/constants/feedingGuidelines';

const STORAGE_KEY = 'feeding_logs';

export default function FeedingTrackerScreen() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();
    const { showAlert } = useAlert();

    const [logs, setLogs] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAdviceModal, setShowAdviceModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [feedingType, setFeedingType] = useState('breast');

    // Breast fields
    const [breastSide, setBreastSide] = useState('left');
    const [duration, setDuration] = useState(15);

    // Bottle fields
    const [volume, setVolume] = useState(120);

    // Solid fields
    const [foodCategory, setFoodCategory] = useState('fruits');
    const [foodName, setFoodName] = useState('');
    const [feedingFrequency, setFeedingFrequency] = useState('demand');

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
            id: editingId || Date.now().toString(),
            type: feedingType,
            timestamp: editingId ? logs.find(l => l.id === editingId).timestamp : new Date().toISOString(),
        };

        if (feedingType === 'breast') {
            entry.side = breastSide;
            entry.duration = duration;
        } else if (feedingType === 'bottle') {
            entry.volume = volume;
        } else {
            entry.foodCategory = foodCategory;
            entry.foodName = foodName;
        }

        entry.frequency = feedingFrequency;

        let updated;
        if (editingId) {
            updated = logs.map(l => l.id === editingId ? entry : l);
        } else {
            updated = [entry, ...logs];
        }

        setLogs(updated);
        saveLogs(updated);
        resetForm();
        setShowAddModal(false);
    };

    const handleEditEntry = (entry) => {
        setEditingId(entry.id);
        setFeedingType(entry.type);
        if (entry.type === 'breast') {
            setBreastSide(entry.side);
            setDuration(entry.duration);
        } else if (entry.type === 'bottle') {
            setVolume(entry.volume);
        } else {
            setFoodCategory(entry.foodCategory);
            setFoodName(entry.foodName || '');
        }
        setFeedingFrequency(entry.frequency || 'demand');
        setShowAddModal(true);
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
        setEditingId(null);
        setFeedingType('breast');
        setBreastSide('left');
        setDuration(15);
        setVolume(120);
        setFoodCategory('fruits');
        setFoodName('');
        setFeedingFrequency('demand');
    };

    // Today's summary
    const today = new Date().toDateString();
    const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today);
    const breastCount = todayLogs.filter(l => l.type === 'breast').length;
    const bottleCount = todayLogs.filter(l => l.type === 'bottle').length;
    const solidCount = todayLogs.filter(l => l.type === 'solid').length;
    const uniqueSolidCategoriesToday = new Set(
        todayLogs.filter(l => l.type === 'solid' && l.foodCategory).map(l => l.foodCategory)
    );
    const solidDiversityCount = uniqueSolidCategoriesToday.size;
    const hasSuboptimalFrequency = todayLogs.some(l => l.frequency === '1hr' || l.frequency === '2hr');
    const hasSolids = solidCount > 0;
    const isOptimal = hasSolids ? (solidDiversityCount >= 4 && !hasSuboptimalFrequency) : true;

    const formatTime = (isoString) => {
        const d = new Date(isoString);
        const h = d.getHours();
        const m = d.getMinutes().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h % 12 || 12}:${m} ${ampm}`;
    };

    const formatDate = (isoString) => {
        const d = new Date(isoString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        });
    };

    // Group logs by date
    const groupedLogs = useMemo(() => {
        const groups = {};
        logs.forEach(log => {
            const date = new Date(log.timestamp).toDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(log);
        });
        return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    }, [logs]);

    const getChartData = () => {
        const last7Days = [];
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push({
                date: date.toDateString(),
                label: daysOfWeek[date.getDay()],
                breast: 0,
                bottle: 0,
                solid: 0,
                total: 0
            });
        }

        logs.forEach(log => {
            const logDate = new Date(log.timestamp).toDateString();
            const day = last7Days.find(d => d.date === logDate);
            if (day) {
                if (log.type === 'breast') day.breast++;
                else if (log.type === 'bottle') day.bottle++;
                else if (log.type === 'solid') day.solid++;
                day.total++;
            }
        });

        return last7Days;
    };

    const getTypeInfo = (typeId) => FEEDING_TYPES.find(t => t.id === typeId) || FEEDING_TYPES[0];

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Feeding Tracker"
                showBack={true}
                rightComponent={
                    <TouchableOpacity onPress={() => setShowAdviceModal(true)}>
                        <MaterialIcons name="info-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                }
            />

            {/* Feeding Recommendations Modal */}
            <Modal
                visible={showAdviceModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowAdviceModal(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: colorScheme.background }]}>
                    <View style={[styles.modalHeader, { backgroundColor: colorScheme.primary, paddingTop: insets.top + Spacing.md }]}>
                        <Text style={[styles.modalTitle, { color: '#FFFFFF' }]}>Feeding Recommendations</Text>
                        <TouchableOpacity onPress={() => setShowAdviceModal(false)}>
                            <MaterialIcons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: Spacing.xxxl }}>
                        <Text style={[styles.adviceIntro, { color: colorScheme.textSecondary }]}>
                            Nutrition guidelines to help your child grow healthy and strong.
                        </Text>

                        {FEEDING_GUIDELINES.map((item) => (
                            <View key={item.id} style={[styles.adviceCard, { backgroundColor: colorScheme.surface }]}>
                                <View style={[styles.adviceHeader, { borderLeftColor: item.color }]}>
                                    <View style={[styles.adviceIcon, { backgroundColor: `${item.color}15` }]}>
                                        <MaterialIcons name={item.icon} size={20} color={item.color} />
                                    </View>
                                    <View>
                                        <Text style={[styles.adviceAge, { color: item.color }]}>{item.age}</Text>
                                        <Text style={[styles.adviceTitle, { color: colorScheme.textPrimary }]}>{item.title}</Text>
                                    </View>
                                </View>
                                <View style={styles.tipsList}>
                                    {item.tips.map((tip, idx) => (
                                        <View key={idx} style={styles.tipItem}>
                                            <View style={[styles.tipDot, { backgroundColor: item.color }]} />
                                            <Text style={[styles.tipText, { color: colorScheme.textSecondary }]}>{tip}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}

                        <View style={[styles.generalSection, { backgroundColor: `${colorScheme.primary}05` }]}>
                            <Text style={[styles.generalHeader, { color: colorScheme.textPrimary }]}>General Tips</Text>
                            {GENERAL_TIPS.map((tip, idx) => (
                                <View key={idx} style={styles.generalTip}>
                                    <Text style={[styles.generalTipTitle, { color: colorScheme.primary }]}>{tip.title}</Text>
                                    <Text style={[styles.generalTipText, { color: colorScheme.textSecondary }]}>{tip.text}</Text>
                                </View>
                            ))}
                        </View>

                        <Text style={[styles.sourceLabel, { color: colorScheme.textTertiary }]}>
                            {SOURCE_INFO}
                        </Text>
                    </ScrollView>
                </View>
            </Modal>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Instruction Header */}
                <View style={[styles.instructionBox, { backgroundColor: '#EEF2F6', borderColor: '#CFD8DC', borderWidth: 1, margin: Spacing.lg, padding: Spacing.md, borderRadius: BorderRadius.md }]}>
                    <View style={{ flexDirection: 'row', gap: Spacing.xs, alignItems: 'center', marginBottom: 4 }}>
                        <MaterialIcons name="lightbulb-outline" size={18} color="#37474F" />
                        <Text style={{ fontWeight: 'bold', color: '#37474F', fontSize: 13 }}>Why track feeding?</Text>
                    </View>
                    <Text style={{ color: '#455A64', fontSize: 12, lineHeight: 16 }}>
                        Tracking what your baby eats helps ensure they get enough nutrients to grow strong. It also helps you spot patterns in their appetite.
                    </Text>
                    
                    <View style={{ height: 1, backgroundColor: '#CFD8DC', marginVertical: Spacing.sm }} />
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                        <MaterialIcons name="restaurant" size={16} color={solidDiversityCount >= 4 ? '#10B981' : '#F59E0B'} />
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#37474F' }}>
                            WHO Nutrition Goal: {'>='} 4 food groups/day
                        </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#455A64', marginTop: 2 }}>
                        Today your child has eaten <Text style={{ fontWeight: 'bold', color: solidDiversityCount >= 4 ? '#10B981' : '#F59E0B' }}>{solidDiversityCount} / 7</Text> groups. {solidDiversityCount >= 4 ? "Excellent diversity!" : "Try to include at least 4 different food groups for healthy development."}
                    </Text>
                </View>

                {/* Add Entry Button */}
                <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
                    <TouchableOpacity
                        style={[styles.addEntryBtnLarge, { backgroundColor: '#FBBF24' }]}
                        onPress={() => {
                            resetForm();
                            setShowAddModal(true);
                        }}
                    >
                        <MaterialIcons name="add" size={20} color="#1F2937" />
                        <Text style={[styles.addEntryBtnLargeText, { color: '#1F2937' }]}>Add Feeding Entry Here</Text>
                    </TouchableOpacity>
                </View>

                {/* Today's Summary */}
                <View style={[styles.summaryCard, { backgroundColor: colorScheme.primary }]}>
                    <Text style={styles.summaryTitle}>Today{"'"}s Summary</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{breastCount}</Text>
                            <Text style={styles.summaryLabel}>Breastfeed</Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{bottleCount}</Text>
                            <Text style={styles.summaryLabel}>Liquids</Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{solidCount}</Text>
                            <Text style={styles.summaryLabel}>Solid Food</Text>
                        </View>
                    </View>
                </View>

                {/* Feeding Visualization Chart */}
                <FeedingChart 
                    data={getChartData()} 
                    themeColors={{
                        surface: colorScheme.surface,
                        border: colorScheme.border,
                        textPrimary: colorScheme.textPrimary,
                        textSecondary: colorScheme.textSecondary,
                        textTertiary: colorScheme.textTertiary,
                        primary: colorScheme.primary
                    }}
                />

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
                                Tap a category above to log a feed
                            </Text>
                        </View>
                    ) : (
                        groupedLogs.map(([date, dateLogs]) => (
                            <View key={date} style={{ marginBottom: Spacing.lg }}>
                                <Text style={[styles.dateHeader, { color: colorScheme.textTertiary }]}>{formatDate(date)}</Text>
                                {dateLogs.map((entry) => {
                                    const typeInfo = getTypeInfo(entry.type);
                                    return (
                                        <View
                                            key={entry.id}
                                            style={[styles.logCard, { backgroundColor: colorScheme.surface }]}
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
                                                    {entry.type === 'bottle' && 'encourage liquids after every meal'}
                                                    {entry.type === 'solid' && (() => {
                                                        const cat = FOOD_CATEGORIES.find(c => c.id === entry.foodCategory);
                                                        return `${cat?.icon || ''} ${cat?.label || entry.foodCategory}${entry.foodName ? `: ${entry.foodName}` : ''}`;
                                                    })()}
                                                </Text>
                                            </View>
                                            <View style={styles.logActions}>
                                                <View style={styles.logTimeRow}>
                                                    {entry.frequency && (
                                                        <View style={[styles.freqBadge, { backgroundColor: `${colorScheme.primary}10` }]}>
                                                            <Text style={[styles.freqBadgeText, { color: colorScheme.primary }]}>
                                                                {FEEDING_FREQUENCIES.find(f => f.id === entry.frequency)?.label}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    <Text style={[styles.logTime, { color: colorScheme.textTertiary }]}>
                                                        {formatTime(entry.timestamp)}
                                                    </Text>
                                                </View>
                                                <View style={styles.actionButtons}>
                                                    <TouchableOpacity onPress={() => handleEditEntry(entry)} style={styles.actionBtn}>
                                                        <MaterialIcons name="edit" size={18} color={colorScheme.primary} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)} style={styles.actionBtn}>
                                                        <MaterialIcons name="delete-outline" size={18} color={colorScheme.error || '#FF5252'} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ))
                    )}
                </View>

                {/* Feeding Interpretation Card */}
                {selectedChild && (
                    <View style={styles.interpretationSection}>
                        <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                            Interpretation
                        </Text>
                        <View style={[
                            styles.interpretationCard,
                            {
                                backgroundColor: todayLogs.length === 0
                                    ? '#F1F5F9'
                                    : !hasSolids
                                        ? '#ECFDF5'
                                        : isOptimal
                                            ? '#ECFDF5'
                                            : '#FEF2F2',
                                borderColor: todayLogs.length === 0
                                    ? '#E2E8F0'
                                    : !hasSolids
                                        ? '#10B98125'
                                        : isOptimal
                                            ? '#10B98125'
                                            : '#EF444425',
                            }
                        ]}>
                            <View style={styles.interpretationHeader}>
                                <MaterialIcons 
                                    name={
                                        todayLogs.length === 0
                                            ? "info"
                                            : !hasSolids
                                                ? "check-circle"
                                                : isOptimal
                                                    ? "check-circle"
                                                    : "warning"
                                    } 
                                    size={18} 
                                    color={
                                        todayLogs.length === 0
                                            ? "#6B7280"
                                            : !hasSolids
                                                ? "#10B981"
                                                : isOptimal
                                                    ? "#10B981"
                                                    : "#EF4444"
                                    } 
                                />
                                <Text style={[styles.interpretationStatus, { 
                                    color: todayLogs.length === 0
                                        ? "#6B7280"
                                        : !hasSolids
                                            ? "#10B981"
                                            : isOptimal
                                                ? "#10B981"
                                                : "#EF4444"
                                }]}>
                                    Interpretation: {
                                        todayLogs.length === 0
                                            ? "No Data"
                                            : !hasSolids
                                                ? "Encourage liquids after every meal"
                                                : isOptimal
                                                    ? "Optimal Diversity"
                                                    : "Suboptimal"
                                    }
                                </Text>
                            </View>
                            <Text style={[styles.interpretationDesc, { color: colorScheme.textSecondary }]}>
                                {todayLogs.length === 0
                                    ? "Please log feeding entries for today to see the interpretation."
                                    : !hasSolids
                                        ? "Ensure your child is hydrated by offering liquids after every meal."
                                        : isOptimal
                                            ? "Your child's diet has optimal diversity today."
                                            : hasSuboptimalFrequency
                                                ? "Your child's feeding frequency is less than 3-hourly, which is suboptimal."
                                                : "Your child's diet has suboptimal diversity today. Try to include at least 4 different food groups."}
                            </Text>
                        </View>
                    </View>
                )}
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
                            {editingId ? 'Edit Feeding' : 'Log Feeding'}
                        </Text>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <MaterialIcons name="close" size={24} color={colorScheme.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            style={styles.modalContent}
                            contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
                            keyboardShouldPersistTaps="handled"
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
                                        <Text 
                                            style={{
                                                color: feedingType === type.id ? '#FFFFFF' : colorScheme.textPrimary,
                                                fontSize: Typography.fontSize.xs,
                                                fontWeight: Typography.fontWeight.medium,
                                            }}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                        >
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

                            {/* Liquid Fields */}
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
                                    <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>Food Category</Text>
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

                                    <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>Food Type</Text>
                                    <TextInput
                                        style={[styles.textInput, {
                                            backgroundColor: colorScheme.surface,
                                            color: colorScheme.textPrimary,
                                            borderColor: colorScheme.border,
                                        }]}
                                        placeholder="e.g. Mashed banana, oats porridge"
                                        placeholderTextColor={colorScheme.textTertiary}
                                        value={foodName}
                                        onChangeText={setFoodName}
                                    />
                                </>
                            )}

                            {/* Frequency Section */}
                            <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>Feeding Frequency</Text>
                            <View style={styles.durationRow}>
                                {FEEDING_FREQUENCIES.map((f) => (
                                    <TouchableOpacity
                                        key={f.id}
                                        style={[
                                            styles.durationChip,
                                            {
                                                backgroundColor: feedingFrequency === f.id ? colorScheme.primary : colorScheme.surface,
                                                borderColor: feedingFrequency === f.id ? colorScheme.primary : colorScheme.border,
                                            }
                                        ]}
                                        onPress={() => setFeedingFrequency(f.id)}
                                    >
                                        <Text style={{
                                            color: feedingFrequency === f.id ? '#FFFFFF' : colorScheme.textPrimary,
                                            fontSize: Typography.fontSize.xs,
                                        }}>
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: colorScheme.primary }]}
                                onPress={handleAddEntry}
                            >
                                <Text style={styles.saveButtonText}>
                                    {editingId ? 'Update Log' : 'Log Feeding'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
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
    quickLogContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    quickLogItem: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        ...Shadow.sm,
    },
    quickLogIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    quickLogLabel: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
        textAlign: 'center',
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
    logTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    freqBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    freqBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
    },
    dateHeader: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
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
        minWidth: 80,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.sm,
        paddingHorizontal: 4,
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
        gap: 4,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    logActions: {
        alignItems: 'flex-end',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        padding: 4,
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
    // Advice Modal Styles
    adviceIntro: {
        fontSize: Typography.fontSize.sm,
        lineHeight: 20,
        marginBottom: Spacing.lg,
    },
    adviceCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadow.sm,
    },
    adviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        borderLeftWidth: 4,
        paddingLeft: Spacing.md,
        marginBottom: Spacing.md,
    },
    adviceIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    adviceAge: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    adviceTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: 'bold',
    },
    tipsList: {
        gap: Spacing.sm,
    },
    tipItem: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    tipDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 6,
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    generalSection: {
        marginTop: Spacing.md,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    generalHeader: {
        fontSize: Typography.fontSize.md,
        fontWeight: 'bold',
        marginBottom: Spacing.md,
    },
    generalTip: {
        marginBottom: Spacing.md,
    },
    generalTipTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    generalTipText: {
        fontSize: 12,
        lineHeight: 16,
    },
    sourceLabel: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: Spacing.xl,
        fontStyle: 'italic',
        paddingHorizontal: Spacing.lg,
    },
    addEntryBtnLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        ...Shadow.md,
    },
    addEntryBtnLargeText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    interpretationSection: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        marginTop: Spacing.md,
    },
    interpretationCard: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    interpretationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: 4,
    },
    interpretationStatus: {
        fontSize: Typography.fontSize.sm,
        fontWeight: 'bold',
    },
    interpretationDesc: {
        fontSize: 12,
        lineHeight: 16,
    },
});
