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
import { useAlert } from '@/contexts/AlertContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { PRIMARY_TEETH } from '@/constants/teethData';

const STORAGE_KEY = 'teething_data';

export default function TeethingChartScreen() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();
    const { showAlert } = useAlert();

    const [eruptedTeeth, setEruptedTeeth] = useState({});
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
            if (stored) setEruptedTeeth(JSON.parse(stored));
            else setEruptedTeeth({});
        } catch (e) {
            console.error('Error loading teething data:', e);
        }
    };

    const saveData = async (data) => {
        try {
            const key = `${STORAGE_KEY}_${childId}`;
            await AsyncStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving teething data:', e);
        }
    };

    const handleToothPress = (tooth) => {
        if (eruptedTeeth[tooth.id]) {
            // Already erupted, ask to un-mark
            showAlert(
                'Remove Tooth',
                `Remove "${tooth.name}" from erupted teeth?`,
                [
                    { text: 'Cancel' },
                    {
                        text: 'Remove',
                        onPress: () => {
                            const updated = { ...eruptedTeeth };
                            delete updated[tooth.id];
                            setEruptedTeeth(updated);
                            saveData(updated);
                        }
                    }
                ],
                'warning'
            );
        } else {
            // Mark as erupted
            const updated = {
                ...eruptedTeeth,
                [tooth.id]: { date: new Date().toISOString() }
            };
            setEruptedTeeth(updated);
            saveData(updated);
        }
    };

    const upperRight = PRIMARY_TEETH.filter(t => t.position === 'upper' && t.side === 'right').sort((a, b) => b.order - a.order);
    const upperLeft = PRIMARY_TEETH.filter(t => t.position === 'upper' && t.side === 'left').sort((a, b) => a.order - b.order);
    const lowerRight = PRIMARY_TEETH.filter(t => t.position === 'lower' && t.side === 'right').sort((a, b) => b.order - a.order);
    const lowerLeft = PRIMARY_TEETH.filter(t => t.position === 'lower' && t.side === 'left').sort((a, b) => a.order - b.order);
    const eruptedCount = Object.keys(eruptedTeeth).length;

    const getToothColor = (toothId) => {
        if (eruptedTeeth[toothId]) return '#4CAF50';
        return colorScheme.border;
    };

    // "Upper Right Central Incisor" → "Central Incisor"
    const getShortName = (name) => name.replace(/^(Upper|Lower)\s+(Right|Left)\s+/, '');

    const renderTooth = (tooth) => {
        const isErupted = !!eruptedTeeth[tooth.id];
        return (
            <TouchableOpacity
                key={tooth.id}
                style={[
                    styles.toothCell,
                    {
                        backgroundColor: isErupted ? '#4CAF5020' : colorScheme.surface,
                        borderColor: isErupted ? '#4CAF50' : colorScheme.border,
                    }
                ]}
                onPress={() => handleToothPress(tooth)}
            >
                <Text style={styles.toothEmoji}>🦷</Text>
                <Text style={[styles.toothName, {
                    color: isErupted ? '#4CAF50' : colorScheme.textPrimary,
                }]} numberOfLines={2}>
                    {getShortName(tooth.name)}
                </Text>
                <Text style={[styles.toothAge, {
                    color: colorScheme.textTertiary,
                }]}>
                    {tooth.eruptionMonths} mo
                </Text>
                {isErupted && (
                    <View style={styles.checkMark}>
                        <MaterialIcons name="check-circle" size={14} color="#4CAF50" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Teething Chart" showBack={true} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Progress */}
                <View style={[styles.progressCard, { backgroundColor: colorScheme.surface }]}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.progressTitle, { color: colorScheme.textPrimary }]}>
                            Teeth Erupted
                        </Text>
                        <Text style={[styles.progressCount, { color: colorScheme.primary }]}>
                            {eruptedCount} / 20
                        </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: colorScheme.border }]}>
                        <View style={[styles.progressFill, {
                            width: `${(eruptedCount / 20) * 100}%`,
                            backgroundColor: colorScheme.primary,
                        }]} />
                    </View>
                </View>

                {/* Dental Chart */}
                <View style={styles.chartSection}>
                    {/* Upper Jaw */}
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                        Upper Jaw
                    </Text>
                    <View style={styles.jawContainer}>
                        <Text style={[styles.sideLabel, { color: colorScheme.textTertiary }]}>L</Text>
                        <View style={styles.halfRowRight}>
                            {upperRight.map((tooth) => renderTooth(tooth))}
                        </View>
                        <View style={[styles.centerLine, { backgroundColor: colorScheme.border }]} />
                        <View style={styles.halfRowLeft}>
                            {upperLeft.map((tooth) => renderTooth(tooth))}
                        </View>
                        <Text style={[styles.sideLabel, { color: colorScheme.textTertiary }]}>R</Text>
                    </View>

                    <View style={[styles.jawDivider, { borderColor: colorScheme.border }]}>
                        <Text style={[styles.jawDividerText, { color: colorScheme.textTertiary }]}>
                            ─── JAW LINE ───
                        </Text>
                    </View>

                    {/* Lower Jaw */}
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                        Lower Jaw
                    </Text>
                    <View style={styles.jawContainer}>
                        <Text style={[styles.sideLabel, { color: colorScheme.textTertiary }]}>L</Text>
                        <View style={styles.halfRowRight}>
                            {lowerRight.map((tooth) => renderTooth(tooth))}
                        </View>
                        <View style={[styles.centerLine, { backgroundColor: colorScheme.border }]} />
                        <View style={styles.halfRowLeft}>
                            {lowerLeft.map((tooth) => renderTooth(tooth))}
                        </View>
                        <Text style={[styles.sideLabel, { color: colorScheme.textTertiary }]}>R</Text>
                    </View>
                </View>

                {/* Legend */}
                <View style={styles.legendSection}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                        How to Use
                    </Text>
                    <View style={[styles.legendCard, { backgroundColor: colorScheme.surface }]}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colorScheme.border }]} />
                            <Text style={[styles.legendText, { color: colorScheme.textSecondary }]}>
                                Tap a tooth to mark it as erupted
                            </Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                            <Text style={[styles.legendText, { color: colorScheme.textSecondary }]}>
                                Green = tooth has erupted
                            </Text>
                        </View>
                        <View style={styles.legendItem}>
                            <MaterialIcons name="info-outline" size={14} color={colorScheme.textTertiary} />
                            <Text style={[styles.legendText, { color: colorScheme.textSecondary }]}>
                                First teeth usually appear at 6-10 months
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    progressCard: {
        margin: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        ...Shadow.md,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    progressTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    progressCount: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    chartSection: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.sm,
    },
    jawContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    halfRowRight: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        gap: 4,
        flex: 1,
    },
    halfRowLeft: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 4,
        flex: 1,
    },
    centerLine: {
        width: 2,
        height: '100%',
        marginHorizontal: 4,
        minHeight: 90,
        borderRadius: 1,
    },
    sideLabel: {
        fontSize: 11,
        fontWeight: '700',
        width: 16,
        textAlign: 'center',
    },
    toothCell: {
        width: 60,
        height: 78,
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        paddingHorizontal: 2,
        position: 'relative',
    },
    toothEmoji: {
        fontSize: 18,
    },
    toothName: {
        textAlign: 'center',
        fontSize: 9,
        fontWeight: '600',
        marginTop: 2,
        lineHeight: 11,
    },
    toothAge: {
        textAlign: 'center',
        fontSize: 8,
        marginTop: 1,
    },
    checkMark: {
        position: 'absolute',
        top: -4,
        right: -4,
    },
    jawDivider: {
        marginVertical: Spacing.lg,
        alignItems: 'center',
    },
    jawDividerText: {
        fontSize: Typography.fontSize.xs,
        letterSpacing: 2,
    },
    legendSection: {
        paddingHorizontal: Spacing.lg,
    },
    legendCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        ...Shadow.sm,
        gap: Spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    legendDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    legendText: {
        fontSize: Typography.fontSize.sm,
        flex: 1,
    },
});
