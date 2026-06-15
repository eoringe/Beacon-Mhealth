import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { useAlert } from '@/contexts/AlertContext';
import { SafeHeader } from '@/components/SafeHeader';
import { SleepChart } from '@/components/SleepChart';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

const STORAGE_KEY = 'sleep_logs';

const SLEEP_TYPES = [
    { id: 'nap', label: 'Nap', icon: 'wb-sunny', color: '#FF9800' },
    { id: 'night', label: 'Night Sleep', icon: 'nightlight-round', color: '#5C6BC0' },
];

// Recommended sleep by age (hours per day)
const RECOMMENDED_SLEEP = [
    { maxMonths: 3, minHours: 14, maxHours: 17, label: '14-17 hrs (AASM/NSF)' },
    { maxMonths: 11, minHours: 12, maxHours: 16, label: '12-16 hrs (AASM)' }, // 4-11 months
    { maxMonths: 24, minHours: 11, maxHours: 14, label: '11-14 hrs (AASM)' }, // 12-24 months
    { maxMonths: 60, minHours: 10, maxHours: 13, label: '10-13 hrs (AASM)' }, // 3-5 years
];

const getSleepInterpretation = (totalMinutes, recommendedRange) => {
    const hrs = totalMinutes / 60;
    if (totalMinutes === 0) return { text: 'No entry', color: '#9CA3AF', description: 'Log today\'s sleep sessions to see developmental interpretation.' };
    if (hrs < recommendedRange.minHours) return { text: 'Short', color: '#F59E0B', description: 'Sleeping less than the AASM recommended range for this age.' };
    if (hrs > recommendedRange.maxHours) return { text: 'Long', color: '#8B5CF6', description: 'Sleeping more than the AASM recommended range for this age.' };
    return { text: 'Recommended', color: '#10B981', description: 'Perfect! Total sleep is within the AASM recommended range.' };
};

const HOUR_OPTIONS = Array.from({ length: 13 }, (_, i) => i); // 0-12
const MINUTE_OPTIONS = [0, 15, 30, 45];

export default function SleepTrackerScreen() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();
    const { showAlert } = useAlert();

    const [logs, setLogs] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [sleepType, setSleepType] = useState('nap');
    const [hours, setHours] = useState(1);
    const [minutes, setMinutes] = useState(0);
    const [logDate, setLogDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

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
            console.error('Error loading sleep logs:', e);
        }
    };

    const saveLogs = async (newLogs) => {
        try {
            const key = `${STORAGE_KEY}_${childId}`;
            await AsyncStorage.setItem(key, JSON.stringify(newLogs));
        } catch (e) {
            console.error('Error saving sleep logs:', e);
        }
    };

    const handleAddEntry = () => {
        if (hours === 0 && minutes === 0) return;
        
        const dateStr = logDate.toDateString();
        const existingNightIndex = sleepType === 'night' 
            ? logs.findIndex(l => l.type === 'night' && new Date(l.timestamp).toDateString() === dateStr)
            : -1;

        const entry = {
            id: existingNightIndex >= 0 ? logs[existingNightIndex].id : Date.now().toString(),
            type: sleepType,
            hours,
            minutes,
            totalMinutes: hours * 60 + minutes,
            timestamp: existingNightIndex >= 0 ? logs[existingNightIndex].timestamp : logDate.toISOString(),
        };

        let updated;
        if (existingNightIndex >= 0) {
            updated = [...logs];
            updated[existingNightIndex] = entry;
        } else {
            updated = [entry, ...logs];
        }

        setLogs(updated);
        saveLogs(updated);
        setShowAddModal(false);
        setSleepType('nap');
        setHours(1);
        setMinutes(0);
        setLogDate(new Date());
    };

    const handleDeleteEntry = (entryId) => {
        showAlert(
            'Delete Entry',
            'Remove this sleep log entry?',
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

    // Today's totals
    const today = new Date().toDateString();
    const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today);
    const todayTotalMinutes = todayLogs.reduce((sum, l) => sum + l.totalMinutes, 0);
    const todayHours = Math.floor(todayTotalMinutes / 60);
    const todayMins = todayTotalMinutes % 60;

    // Recommended sleep
    const childAgeMonths = selectedChild?.date_of_birth
        ? Math.floor((Date.now() - new Date(selectedChild.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        : 12;
    const recommended = RECOMMENDED_SLEEP.find(r => childAgeMonths <= r.maxMonths) || RECOMMENDED_SLEEP[RECOMMENDED_SLEEP.length - 1];
    const progressPercent = Math.min(100, Math.round((todayTotalMinutes / (recommended.minHours * 60)) * 100));
    const interpretation = getSleepInterpretation(todayTotalMinutes, recommended);

    const formatTime = (isoString) => {
        const d = new Date(isoString);
        const h = d.getHours();
        const m = d.getMinutes().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h % 12 || 12}:${m} ${ampm}`;
    };

    const getChartData = () => {
        const last7Days = [];
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push({
                date: date.toDateString(),
                label: daysOfWeek[date.getDay()],
                nap: 0,
                night: 0,
                total: 0
            });
        }

        logs.forEach(log => {
            const logDate = new Date(log.timestamp).toDateString();
            const day = last7Days.find(d => d.date === logDate);
            if (day) {
                if (log.type === 'nap') day.nap += log.totalMinutes;
                else day.night += log.totalMinutes;
                day.total += log.totalMinutes;
            }
        });

        return last7Days;
    };

    const getGroupedLogs = () => {
        const groups = {};
        logs.forEach(log => {
            const date = new Date(log.timestamp).toDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(log);
        });
        return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        const today = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (dateString === today) return 'Today';
        if (dateString === yesterdayStr) return 'Yesterday';

        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Sleep Tracker"
                showBack={true}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Instruction Header */}
                <View style={[styles.instructionBox, { backgroundColor: '#EEF2F6', borderColor: '#CFD8DC', borderWidth: 1, margin: Spacing.lg, padding: Spacing.md, borderRadius: BorderRadius.md }]}>
                    <View style={{ flexDirection: 'row', gap: Spacing.xs, alignItems: 'center', marginBottom: 4 }}>
                        <MaterialIcons name="lightbulb-outline" size={18} color="#37474F" />
                        <Text style={{ fontWeight: 'bold', color: '#37474F', fontSize: 13 }}>Why track sleep?</Text>
                    </View>
                    <Text style={{ color: '#455A64', fontSize: 12, lineHeight: 16 }}>
                        {"Sleep helps your baby's brain and body grow strong. It keeps them happy and gives them energy to learn."}
                    </Text>
                </View>

                {/* Add Entry Button */}
                <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
                    <TouchableOpacity
                        style={[styles.addEntryBtnLarge, { backgroundColor: colorScheme.primary }]}
                        onPress={() => {
                            setLogDate(new Date());
                            setShowAddModal(true);
                        }}
                    >
                        <MaterialIcons name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.addEntryBtnLargeText}>Add Sleep Entry</Text>
                    </TouchableOpacity>
                </View>

                {/* Today's Summary */}
                <View style={[styles.summaryCard, { backgroundColor: '#5C6BC0' }]}>
                    <MaterialIcons name="bedtime" size={32} color="#FFFFFF" />
                    <Text style={styles.summaryTitle}>{"Today's Sleep"}</Text>
                    <Text style={styles.summaryBig}>
                        {todayHours}h {todayMins}m
                    </Text>
                    <Text style={styles.summaryRecommended}>
                        Recommended: {recommended.label}
                    </Text>

                    {/* Interpretation Badge */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm }}>
                        <View style={{ backgroundColor: interpretation.color, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.md }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>
                                Status: {interpretation.text}
                            </Text>
                        </View>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, textAlign: 'center', marginTop: Spacing.xs, paddingHorizontal: Spacing.md, fontStyle: 'italic' }}>
                        {interpretation.description}
                    </Text>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{progressPercent}%</Text>
                    </View>
                </View>

                {/* Sleep Visualization Chart */}
                <SleepChart 
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
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary, marginBottom: Spacing.md }]}>
                        Recent Sleep Logs
                    </Text>
                    {logs.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: colorScheme.surface }]}>
                            <MaterialIcons name="bedtime" size={48} color={colorScheme.textTertiary} />
                            <Text style={[styles.emptyText, { color: colorScheme.textSecondary }]}>
                                No sleep logs yet
                            </Text>
                            <Text style={[styles.emptySubtext, { color: colorScheme.textTertiary }]}>
                                Tap + to log sleep
                            </Text>
                        </View>
                    ) : (
                        getGroupedLogs().map(([date, dateLogs]) => (
                            <View key={date} style={{ marginBottom: Spacing.lg }}>
                                <Text style={[styles.dateHeader, { color: colorScheme.textTertiary }]}>
                                    {formatDate(date)}
                                </Text>
                                {dateLogs.map((entry) => {
                                    const typeInfo = SLEEP_TYPES.find(t => t.id === entry.type) || SLEEP_TYPES[0];
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
                                                    {entry.hours}h {entry.minutes}m
                                                </Text>
                                            </View>
                                            <Text style={[styles.logTime, { color: colorScheme.textTertiary }]}>
                                                {formatTime(entry.timestamp)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Add Sleep Modal */}
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
                        <Text style={[styles.modalTitle, { color: colorScheme.textPrimary }]}>Log Sleep</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <MaterialIcons name="close" size={24} color={colorScheme.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 40 }}>
                        {/* Date Picker */}
                        <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary, marginTop: 0 }]}>Date</Text>
                        <TouchableOpacity
                            style={[styles.dateSelectBtn, { backgroundColor: colorScheme.surface, borderColor: colorScheme.border, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.sm }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <MaterialIcons name="calendar-today" size={18} color={colorScheme.primary} />
                            <Text style={{ fontSize: Typography.fontSize.sm, color: colorScheme.textPrimary }}>
                                {logDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={logDate}
                                mode="date"
                                display="default"
                                maximumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(false);
                                    if (selectedDate) setLogDate(selectedDate);
                                }}
                            />
                        )}

                        {/* Type */}
                        <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>Type</Text>
                        <View style={styles.typeRow}>
                            {SLEEP_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.typeChip,
                                        {
                                            backgroundColor: sleepType === type.id ? type.color : colorScheme.surface,
                                            borderColor: sleepType === type.id ? type.color : colorScheme.border,
                                        }
                                    ]}
                                    onPress={() => setSleepType(type.id)}
                                >
                                    <MaterialIcons
                                        name={type.icon}
                                        size={20}
                                        color={sleepType === type.id ? '#FFFFFF' : colorScheme.textSecondary}
                                    />
                                    <Text style={{
                                        color: sleepType === type.id ? '#FFFFFF' : colorScheme.textPrimary,
                                        fontSize: Typography.fontSize.sm,
                                        fontWeight: Typography.fontWeight.medium,
                                    }}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Hours */}
                        <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>
                            Hours: {hours}
                        </Text>
                        <View style={styles.durationRow}>
                            {HOUR_OPTIONS.map((h) => (
                                <TouchableOpacity
                                    key={h}
                                    style={[
                                        styles.durationChip,
                                        {
                                            backgroundColor: hours === h ? colorScheme.primary : colorScheme.surface,
                                            borderColor: hours === h ? colorScheme.primary : colorScheme.border,
                                        }
                                    ]}
                                    onPress={() => setHours(h)}
                                >
                                    <Text style={{
                                        color: hours === h ? '#FFFFFF' : colorScheme.textPrimary,
                                        fontSize: Typography.fontSize.sm,
                                    }}>
                                        {h}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Minutes */}
                        <Text style={[styles.fieldLabel, { color: colorScheme.textPrimary }]}>
                            Minutes: {minutes}
                        </Text>
                        <View style={styles.durationRow}>
                            {MINUTE_OPTIONS.map((m) => (
                                <TouchableOpacity
                                    key={m}
                                    style={[
                                        styles.durationChip,
                                        {
                                            backgroundColor: minutes === m ? colorScheme.primary : colorScheme.surface,
                                            borderColor: minutes === m ? colorScheme.primary : colorScheme.border,
                                        }
                                    ]}
                                    onPress={() => setMinutes(m)}
                                >
                                    <Text style={{
                                        color: minutes === m ? '#FFFFFF' : colorScheme.textPrimary,
                                        fontSize: Typography.fontSize.sm,
                                    }}>
                                        {m}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Preview */}
                        <View style={[styles.previewCard, { backgroundColor: colorScheme.surface }]}>
                            <Text style={[styles.previewLabel, { color: colorScheme.textSecondary }]}>Duration</Text>
                            <Text style={[styles.previewValue, { color: colorScheme.primary }]}>
                                {hours}h {minutes}m
                            </Text>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.saveButton, {
                                backgroundColor: colorScheme.primary,
                                opacity: (hours === 0 && minutes === 0) ? 0.5 : 1,
                            }]}
                            onPress={handleAddEntry}
                            disabled={hours === 0 && minutes === 0}
                        >
                            <Text style={styles.saveButtonText}>Log Sleep</Text>
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
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    summaryTitle: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        marginTop: Spacing.sm,
    },
    summaryBig: {
        color: '#FFFFFF',
        fontSize: 36,
        fontWeight: Typography.fontWeight.bold,
        marginTop: Spacing.xs,
    },
    summaryRecommended: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: Typography.fontSize.sm,
        marginTop: Spacing.xs,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.md,
        width: '100%',
    },
    progressTrack: {
        flex: 1,
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
    },
    progressText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.bold,
    },
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
    logTime: { fontSize: Typography.fontSize.xs },
    dateHeader: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
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
    modalContent: { flex: 1, padding: Spacing.lg },
    fieldLabel: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.sm,
        marginTop: Spacing.lg,
    },
    typeRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    typeChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
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
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    previewCard: {
        marginTop: Spacing.xl,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        ...Shadow.sm,
    },
    previewLabel: { fontSize: Typography.fontSize.sm },
    previewValue: {
        fontSize: 28,
        fontWeight: Typography.fontWeight.bold,
        marginTop: Spacing.xs,
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
    addEntryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.md,
        ...Shadow.sm,
    },
    addEntryButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: '600',
    },
    addEntryBtnLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        ...Shadow.sm,
    },
    addEntryBtnLargeText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: 'bold',
    },
});
