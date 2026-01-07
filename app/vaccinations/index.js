import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import {
    VACCINATION_SCHEDULE,
    getVaccinationStatus,
    formatAge,
    calculateAgeInWeeks
} from '@/constants/vaccinationSchedule';

const STORAGE_KEY = 'completed_vaccines';

export default function VaccinationsScreen() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();

    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [completedVaccines, setCompletedVaccines] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    // Load completed vaccines from storage
    useEffect(() => {
        loadCompletedVaccines();
    }, [selectedChild]);

    const loadCompletedVaccines = async () => {
        if (!selectedChild?.id) return;
        try {
            const key = `${STORAGE_KEY}_${selectedChild.id}`;
            const stored = await AsyncStorage.getItem(key);
            if (stored) {
                setCompletedVaccines(JSON.parse(stored));
            } else {
                setCompletedVaccines([]);
            }
        } catch (error) {
            console.error('Error loading completed vaccines:', error);
        }
    };

    const saveCompletedVaccines = async (vaccines) => {
        if (!selectedChild?.id) return;
        try {
            const key = `${STORAGE_KEY}_${selectedChild.id}`;
            await AsyncStorage.setItem(key, JSON.stringify(vaccines));
        } catch (error) {
            console.error('Error saving completed vaccines:', error);
        }
    };

    const handleMarkAsGiven = useCallback((vaccine) => {
        Alert.alert(
            'Mark Vaccine as Given',
            `Mark "${vaccine.name}" as given on ${new Date().toLocaleDateString()}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Mark as Given',
                    onPress: () => {
                        const updated = [...completedVaccines, {
                            id: vaccine.id,
                            givenDate: new Date().toISOString(),
                        }];
                        setCompletedVaccines(updated);
                        saveCompletedVaccines(updated);
                    }
                }
            ]
        );
    }, [completedVaccines, selectedChild]);

    const handleMarkAsNotGiven = useCallback((vaccine) => {
        Alert.alert(
            'Remove Vaccine Record',
            `Remove "${vaccine.name}" from given vaccines?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const updated = completedVaccines.filter(v => v.id !== vaccine.id);
                        setCompletedVaccines(updated);
                        saveCompletedVaccines(updated);
                    }
                }
            ]
        );
    }, [completedVaccines, selectedChild]);

    // Calculate vaccination status based on child's age
    // MUST be defined before handleMarkAllOverdueAsGiven
    const vaccinationStatus = useMemo(() => {
        if (!selectedChild?.date_of_birth) {
            return {
                ageInWeeks: 0,
                dueVaccines: [],
                overdueVaccines: [],
                upcomingVaccines: VACCINATION_SCHEDULE,
                completedVaccines: [],
                totalVaccines: VACCINATION_SCHEDULE.length,
            };
        }
        const completedIds = completedVaccines.map(v => v.id);
        return getVaccinationStatus(selectedChild.date_of_birth, completedIds);
    }, [selectedChild?.date_of_birth, completedVaccines]);

    const handleMarkAllOverdueAsGiven = useCallback(() => {
        const overdueVaccines = vaccinationStatus.overdueVaccines;
        if (overdueVaccines.length === 0) {
            Alert.alert('No Overdue Vaccines', 'All vaccines are up to date!');
            return;
        }

        Alert.alert(
            'Mark All Overdue as Given',
            `Mark ${overdueVaccines.length} overdue vaccine(s) as given today?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Mark All as Given',
                    onPress: () => {
                        const newCompleted = overdueVaccines.map(v => ({
                            id: v.id,
                            givenDate: new Date().toISOString(),
                        }));
                        const updated = [...completedVaccines, ...newCompleted];
                        setCompletedVaccines(updated);
                        saveCompletedVaccines(updated);
                    }
                }
            ]
        );
    }, [vaccinationStatus.overdueVaccines, completedVaccines, selectedChild]);

    // Combine vaccines with status for display
    const allVaccines = useMemo(() => {
        const vaccines = [];
        const completedIds = completedVaccines.map(v => v.id);
        const completedMap = completedVaccines.reduce((acc, v) => {
            acc[v.id] = v.givenDate;
            return acc;
        }, {});

        vaccinationStatus.overdueVaccines.forEach(v => {
            vaccines.push({ ...v, status: 'overdue' });
        });
        vaccinationStatus.dueVaccines.forEach(v => {
            vaccines.push({ ...v, status: 'due' });
        });
        vaccinationStatus.upcomingVaccines.forEach(v => {
            vaccines.push({ ...v, status: 'upcoming' });
        });
        vaccinationStatus.completedVaccines.forEach(v => {
            vaccines.push({ ...v, status: 'completed', givenDate: completedMap[v.id] });
        });

        return vaccines;
    }, [vaccinationStatus, completedVaccines]);

    // Filter vaccines
    const filteredVaccines = useMemo(() => {
        return allVaccines.filter(vaccine => {
            const matchesFilter =
                selectedFilter === 'all' ||
                vaccine.status === selectedFilter ||
                (selectedFilter === 'action' && (vaccine.status === 'due' || vaccine.status === 'overdue'));

            const matchesSearch =
                vaccine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vaccine.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesFilter && matchesSearch;
        });
    }, [allVaccines, selectedFilter, searchQuery]);

    const getStatusColor = (status) => {
        if (status === 'completed') return colorScheme.vaccineCompleted;
        if (status === 'upcoming') return colorScheme.vaccineUpcoming;
        if (status === 'overdue') return '#F44336';
        if (status === 'due') return '#FF9800';
        return colorScheme.textTertiary;
    };

    const getStatusLabel = (status) => {
        if (status === 'due') return 'Due Now';
        if (status === 'overdue') return 'Overdue';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const stats = {
        total: VACCINATION_SCHEDULE.length,
        completed: vaccinationStatus.completedVaccines.length,
        actionRequired: vaccinationStatus.dueVaccines.length + vaccinationStatus.overdueVaccines.length,
        upcoming: vaccinationStatus.upcomingVaccines.length,
    };

    const childName = selectedChild?.first_name || selectedChild?.fullname || 'Your child';
    const childAge = selectedChild?.date_of_birth
        ? formatAge(calculateAgeInWeeks(selectedChild.date_of_birth))
        : 'Unknown age';

    // Group schedule by age for modal
    const scheduleByAge = useMemo(() => {
        const groups = {};
        VACCINATION_SCHEDULE.forEach(v => {
            if (!groups[v.ageLabel]) {
                groups[v.ageLabel] = [];
            }
            groups[v.ageLabel].push(v);
        });
        return Object.entries(groups);
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Vaccinations"
                showBack={true}
                rightComponent={
                    <TouchableOpacity
                        onPress={() => setShowScheduleModal(true)}
                        style={styles.scheduleButton}
                    >
                        <MaterialIcons name="calendar-today" size={24} color={colorScheme.primary} />
                    </TouchableOpacity>
                }
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Child Info & Age */}
                <View style={[styles.childInfoCard, { backgroundColor: colorScheme.primary }]}>
                    <MaterialIcons name="vaccines" size={32} color="#FFFFFF" />
                    <View style={styles.childInfoText}>
                        <Text style={styles.childName}>{childName}'s Immunization</Text>
                        <Text style={styles.childAge}>Age: {childAge}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.viewScheduleBtn}
                        onPress={() => setShowScheduleModal(true)}
                    >
                        <Text style={styles.viewScheduleBtnText}>View Full Schedule</Text>
                    </TouchableOpacity>
                </View>

                {/* Alert for Due/Overdue */}
                {stats.actionRequired > 0 && (
                    <View style={[styles.alertCard, { backgroundColor: '#FFF3E0' }]}>
                        <MaterialIcons name="warning" size={24} color="#FF9800" />
                        <View style={styles.alertText}>
                            <Text style={[styles.alertTitle, { color: '#E65100' }]}>
                                Action Required
                            </Text>
                            <Text style={[styles.alertSubtitle, { color: '#F57C00' }]}>
                                {stats.actionRequired} vaccine(s) are due or overdue.
                            </Text>
                            <TouchableOpacity
                                style={styles.markAllButton}
                                onPress={handleMarkAllOverdueAsGiven}
                            >
                                <MaterialIcons name="done-all" size={16} color="#FFFFFF" />
                                <Text style={styles.markAllButtonText}>Mark All as Given</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Progress Summary */}
                <View style={[styles.summaryCard, { backgroundColor: colorScheme.surface }]}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: colorScheme.vaccineCompleted }]}>
                                {stats.completed}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: colorScheme.textSecondary }]}>
                                Completed
                            </Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: colorScheme.border }]} />
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
                                {stats.actionRequired}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: colorScheme.textSecondary }]}>
                                Due Now
                            </Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: colorScheme.border }]} />
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: colorScheme.vaccineUpcoming }]}>
                                {stats.upcoming}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: colorScheme.textSecondary }]}>
                                Upcoming
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.section}>
                    <View style={[styles.searchBar, {
                        backgroundColor: colorScheme.surface,
                        borderColor: colorScheme.border,
                    }]}>
                        <MaterialIcons name="search" size={20} color={colorScheme.textTertiary} />
                        <TextInput
                            style={[styles.searchInput, { color: colorScheme.textPrimary }]}
                            placeholder="Search vaccines..."
                            placeholderTextColor={colorScheme.textTertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Filters */}
                <View style={styles.filtersContainer}>
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'action', label: 'Action Needed' },
                        { key: 'completed', label: 'Completed' },
                        { key: 'upcoming', label: 'Upcoming' },
                    ].map(filter => (
                        <TouchableOpacity
                            key={filter.key}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: selectedFilter === filter.key
                                        ? colorScheme.primary
                                        : colorScheme.surface,
                                    borderColor: colorScheme.border,
                                },
                            ]}
                            onPress={() => setSelectedFilter(filter.key)}
                        >
                            <Text style={{
                                color: selectedFilter === filter.key ? '#FFFFFF' : colorScheme.textPrimary,
                                fontSize: Typography.fontSize.xs,
                                fontWeight: Typography.fontWeight.medium,
                            }}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Vaccination List */}
                <View style={styles.vaccineList}>
                    {filteredVaccines.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="check-circle" size={48} color={colorScheme.textTertiary} />
                            <Text style={[styles.emptyText, { color: colorScheme.textSecondary }]}>
                                No vaccines found for this filter
                            </Text>
                        </View>
                    ) : (
                        filteredVaccines.map((vaccine) => (
                            <TouchableOpacity
                                key={vaccine.id}
                                style={[styles.vaccineCard, { backgroundColor: colorScheme.surface }]}
                                onPress={() => setExpandedId(expandedId === vaccine.id ? null : vaccine.id)}
                            >
                                <View style={styles.vaccineHeader}>
                                    <View style={[styles.vaccineIcon, { backgroundColor: `${getStatusColor(vaccine.status)}15` }]}>
                                        <MaterialIcons
                                            name={vaccine.status === 'completed' ? 'check-circle' : 'vaccines'}
                                            size={24}
                                            color={getStatusColor(vaccine.status)}
                                        />
                                    </View>
                                    <View style={styles.vaccineInfo}>
                                        <Text style={[styles.vaccineName, { color: colorScheme.textPrimary }]}>
                                            {vaccine.name}
                                        </Text>
                                        <Text style={[styles.vaccineFullName, { color: colorScheme.textSecondary }]}>
                                            {vaccine.fullName}
                                        </Text>
                                        <Text style={[styles.scheduleAge, { color: colorScheme.textTertiary }]}>
                                            Schedule: {vaccine.ageLabel}
                                        </Text>
                                    </View>
                                    <View style={styles.vaccineRight}>
                                        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(vaccine.status)}20` }]}>
                                            <Text style={[styles.statusText, { color: getStatusColor(vaccine.status) }]}>
                                                {getStatusLabel(vaccine.status)}
                                            </Text>
                                        </View>
                                        <MaterialIcons
                                            name={expandedId === vaccine.id ? 'expand-less' : 'expand-more'}
                                            size={24}
                                            color={colorScheme.textTertiary}
                                        />
                                    </View>
                                </View>

                                {expandedId === vaccine.id && (
                                    <View style={[styles.vaccineDetails, { borderTopColor: colorScheme.border }]}>
                                        <View style={styles.detailRow}>
                                            <MaterialIcons name="healing" size={16} color={colorScheme.textTertiary} />
                                            <Text style={[styles.detailText, { color: colorScheme.textSecondary }]}>
                                                Protects against: {vaccine.diseases.join(', ')}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <MaterialIcons name="medical-services" size={16} color={colorScheme.textTertiary} />
                                            <Text style={[styles.detailText, { color: colorScheme.textSecondary }]}>
                                                {vaccine.administrationMethod}
                                            </Text>
                                        </View>
                                        {vaccine.totalDoses > 1 && (
                                            <View style={styles.detailRow}>
                                                <MaterialIcons name="repeat" size={16} color={colorScheme.textTertiary} />
                                                <Text style={[styles.detailText, { color: colorScheme.textSecondary }]}>
                                                    Dose {vaccine.dose} of {vaccine.totalDoses}
                                                </Text>
                                            </View>
                                        )}
                                        {vaccine.note && (
                                            <View style={styles.detailRow}>
                                                <MaterialIcons name="info" size={16} color={colorScheme.textTertiary} />
                                                <Text style={[styles.detailText, { color: colorScheme.textSecondary }]}>
                                                    {vaccine.note}
                                                </Text>
                                            </View>
                                        )}
                                        {vaccine.status === 'completed' && vaccine.givenDate && (
                                            <View style={styles.detailRow}>
                                                <MaterialIcons name="event" size={16} color={colorScheme.vaccineCompleted} />
                                                <Text style={[styles.detailText, { color: colorScheme.vaccineCompleted }]}>
                                                    Given on: {new Date(vaccine.givenDate).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Action Buttons */}
                                        <View style={styles.actionButtons}>
                                            {vaccine.status !== 'completed' ? (
                                                <TouchableOpacity
                                                    style={[styles.markButton, { backgroundColor: colorScheme.vaccineCompleted }]}
                                                    onPress={() => handleMarkAsGiven(vaccine)}
                                                >
                                                    <MaterialIcons name="check" size={18} color="#FFFFFF" />
                                                    <Text style={styles.markButtonText}>Mark as Given</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <TouchableOpacity
                                                    style={[styles.markButton, { backgroundColor: '#999' }]}
                                                    onPress={() => handleMarkAsNotGiven(vaccine)}
                                                >
                                                    <MaterialIcons name="undo" size={18} color="#FFFFFF" />
                                                    <Text style={styles.markButtonText}>Undo</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Kenya MOH Attribution */}
                <View style={styles.attribution}>
                    <Text style={[styles.attributionText, { color: colorScheme.textTertiary }]}>
                        Based on Kenya Ministry of Health Immunization Schedule (KEPI)
                    </Text>
                </View>
            </ScrollView>

            {/* Full Schedule Modal */}
            <Modal
                visible={showScheduleModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowScheduleModal(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: colorScheme.background }]}>
                    <View style={[styles.modalHeader, {
                        backgroundColor: colorScheme.surface,
                        paddingTop: insets.top + Spacing.md
                    }]}>
                        <Text style={[styles.modalTitle, { color: colorScheme.textPrimary }]}>
                            Kenya MOH Vaccination Schedule
                        </Text>
                        <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                            <MaterialIcons name="close" size={24} color={colorScheme.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={styles.modalContent}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                        {scheduleByAge.map(([ageLabel, vaccines]) => (
                            <View key={ageLabel} style={styles.scheduleGroup}>
                                <View style={[styles.ageHeader, { backgroundColor: colorScheme.primary }]}>
                                    <MaterialIcons name="event" size={20} color="#FFF" />
                                    <Text style={styles.ageHeaderText}>{ageLabel}</Text>
                                </View>
                                {vaccines.map(v => {
                                    const isCompleted = completedVaccines.some(cv => cv.id === v.id);
                                    return (
                                        <View
                                            key={v.id}
                                            style={[styles.scheduleItem, { backgroundColor: colorScheme.surface }]}
                                        >
                                            <MaterialIcons
                                                name={isCompleted ? 'check-circle' : 'radio-button-unchecked'}
                                                size={20}
                                                color={isCompleted ? colorScheme.vaccineCompleted : colorScheme.textTertiary}
                                            />
                                            <View style={styles.scheduleItemText}>
                                                <Text style={[
                                                    styles.scheduleVaccineName,
                                                    { color: colorScheme.textPrimary },
                                                    isCompleted && styles.completedText
                                                ]}>
                                                    {v.name}
                                                </Text>
                                                <Text style={[styles.scheduleVaccineDesc, { color: colorScheme.textSecondary }]}>
                                                    {v.diseases.join(', ')}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
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
    scheduleButton: {
        padding: Spacing.sm,
    },
    childInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: Spacing.md,
        margin: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
    },
    childInfoText: {
        flex: 1,
    },
    childName: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    childAge: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: Typography.fontSize.sm,
        marginTop: 2,
    },
    viewScheduleBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
    },
    viewScheduleBtnText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    alertText: {
        flex: 1,
    },
    alertTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    alertSubtitle: {
        fontSize: Typography.fontSize.sm,
        marginTop: 2,
    },
    markAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: '#FF9800',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        marginTop: Spacing.sm,
        alignSelf: 'flex-start',
    },
    markAllButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    summaryCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        ...Shadow.md,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryDivider: {
        width: 1,
        height: 40,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.xs,
    },
    summaryLabel: {
        fontSize: Typography.fontSize.xs,
    },
    section: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.fontSize.base,
        paddingVertical: Spacing.xs,
    },
    filtersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    vaccineList: {
        paddingHorizontal: Spacing.lg,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
    },
    emptyText: {
        marginTop: Spacing.md,
        fontSize: Typography.fontSize.md,
    },
    vaccineCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    vaccineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vaccineIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    vaccineInfo: {
        flex: 1,
    },
    vaccineName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    vaccineFullName: {
        fontSize: Typography.fontSize.xs,
        marginTop: 2,
    },
    scheduleAge: {
        fontSize: Typography.fontSize.xs,
        marginTop: 2,
    },
    vaccineRight: {
        alignItems: 'flex-end',
        gap: Spacing.xs,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    statusText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    vaccineDetails: {
        borderTopWidth: 1,
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        gap: Spacing.sm,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    detailText: {
        fontSize: Typography.fontSize.sm,
        flex: 1,
        lineHeight: 20,
    },
    actionButtons: {
        marginTop: Spacing.md,
    },
    markButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    markButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    attribution: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    attributionText: {
        fontSize: Typography.fontSize.xs,
        fontStyle: 'italic',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    modalContent: {
        flex: 1,
        padding: Spacing.lg,
    },
    scheduleGroup: {
        marginBottom: Spacing.lg,
    },
    ageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
    },
    ageHeaderText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.sm,
        marginBottom: 4,
    },
    scheduleItemText: {
        flex: 1,
    },
    scheduleVaccineName: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    scheduleVaccineDesc: {
        fontSize: Typography.fontSize.xs,
        marginTop: 2,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.7,
    },
});
