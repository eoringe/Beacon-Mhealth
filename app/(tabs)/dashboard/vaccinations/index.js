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
    Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { useAlert } from '@/contexts/AlertContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import {
    VACCINATION_SCHEDULE,
    getVaccinationStatus,
    formatAge,
    calculateAgeInWeeks
} from '@/constants/vaccinationSchedule';

const STORAGE_KEY = 'completed_vaccines';
const SKIPPED_STORAGE_KEY = 'skipped_vaccines';

export default function VaccinationsScreen() {
    const insets = useSafeAreaInsets();
    const router = require('expo-router').useRouter();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();
    const { showAlert } = useAlert();

    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [completedVaccines, setCompletedVaccines] = useState([]);
    const [skippedVaccines, setSkippedVaccines] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    // Load vaccines from storage
    useEffect(() => {
        loadVaccineData();
    }, [selectedChild]);

    const loadVaccineData = async () => {
        if (!selectedChild?.id) return;
        try {
            const completedKey = `${STORAGE_KEY}_${selectedChild.id}`;
            const skippedKey = `${SKIPPED_STORAGE_KEY}_${selectedChild.id}`;
            
            const [completedStored, skippedStored] = await Promise.all([
                AsyncStorage.getItem(completedKey),
                AsyncStorage.getItem(skippedKey)
            ]);

            setCompletedVaccines(completedStored ? JSON.parse(completedStored) : []);
            setSkippedVaccines(skippedStored ? JSON.parse(skippedStored) : []);
        } catch (error) {
            console.error('Error loading vaccine data:', error);
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

    const saveSkippedVaccines = async (vaccines) => {
        if (!selectedChild?.id) return;
        try {
            const key = `${SKIPPED_STORAGE_KEY}_${selectedChild.id}`;
            await AsyncStorage.setItem(key, JSON.stringify(vaccines));
        } catch (error) {
            console.error('Error saving skipped vaccines:', error);
        }
    };

    const handleMarkAsGiven = useCallback((vaccine) => {
        showAlert(
            'Confirm Administration',
            `Confirm "${vaccine.name}" was administered?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        const updated = [
                            ...completedVaccines,
                            {
                                id: vaccine.id,
                                givenDate: new Date().toISOString(),
                            },
                        ];
                        setCompletedVaccines(updated);
                        saveCompletedVaccines(updated);
                    },
                },
            ],
            'info'
        );
    }, [completedVaccines, selectedChild]);

    const handleMarkAsNotGiven = useCallback((vaccine) => {
        showAlert(
            'Remove Record',
            `Undo registration for "${vaccine.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const updatedCompleted = completedVaccines.filter(v => v.id !== vaccine.id);
                        const updatedSkipped = skippedVaccines.filter(v => v.id !== vaccine.id);
                        setCompletedVaccines(updatedCompleted);
                        setSkippedVaccines(updatedSkipped);
                        saveCompletedVaccines(updatedCompleted);
                        saveSkippedVaccines(updatedSkipped);
                    },
                },
            ],
            'warning'
        );
    }, [completedVaccines, skippedVaccines, selectedChild]);

    const handleSkipVaccine = useCallback((vaccine) => {
        showAlert(
            'Skip Vaccine',
            `Mark "${vaccine.name}" as not applicable? (e.g. not in a high-risk county)`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Skip',
                    onPress: () => {
                        const updated = [
                            ...skippedVaccines,
                            {
                                id: vaccine.id,
                                skippedDate: new Date().toISOString(),
                                status: 'skipped'
                            },
                        ];
                        setSkippedVaccines(updated);
                        saveSkippedVaccines(updated);
                    },
                },
            ],
            'info'
        );
    }, [skippedVaccines, selectedChild]);

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
        const skippedIds = skippedVaccines.map(v => v.id);
        return getVaccinationStatus(selectedChild.date_of_birth, completedIds, skippedIds);
    }, [selectedChild?.date_of_birth, completedVaccines, skippedVaccines]);

    const handleMarkAllOverdueAsGiven = useCallback(() => {
        const overdueVaccines = vaccinationStatus.overdueVaccines;
        if (overdueVaccines.length === 0) {
            showAlert('All Good', 'All vaccines are up to date!', [], 'info');
            return;
        }

        showAlert(
            'Confirm Administration',
            `Confirm that ${overdueVaccines.length} pending vaccine(s) have been administered?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm All',
                    onPress: () => {
                        const newCompleted = overdueVaccines.map((v) => ({
                            id: v.id,
                            givenDate: new Date().toISOString(),
                        }));
                        const updated = [...completedVaccines, ...newCompleted];
                        setCompletedVaccines(updated);
                        saveCompletedVaccines(updated);
                    },
                },
            ],
            'info'
        );
    }, [vaccinationStatus.overdueVaccines, completedVaccines, selectedChild]);

    // Combine vaccines with status for display
    const allVaccines = useMemo(() => {
        const vaccines = [];
        const completedMap = completedVaccines.reduce((acc, v) => {
            acc[v.id] = { date: v.givenDate, status: 'completed' };
            return acc;
        }, {});
        const skippedMap = skippedVaccines.reduce((acc, v) => {
            acc[v.id] = { date: v.skippedDate, status: 'skipped' };
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
            const skipData = skippedMap[v.id];
            if (skipData) {
                vaccines.push({ ...v, status: 'skipped', skippedDate: skipData.date });
            } else {
                vaccines.push({ ...v, status: 'completed', givenDate: completedMap[v.id]?.date });
            }
        });

        return vaccines;
    }, [vaccinationStatus, completedVaccines, skippedVaccines]);

    // Filter vaccines
    const filteredVaccines = useMemo(() => {
        return allVaccines.filter(vaccine => {
            const matchesFilter =
                selectedFilter === 'all' ||
                vaccine.status === selectedFilter ||
                (selectedFilter === 'action' && (vaccine.status === 'due' || vaccine.status === 'overdue'));

            return matchesFilter;
        });
    }, [allVaccines, selectedFilter]);

    const getStatusColor = (status) => {
        if (status === 'completed') return colorScheme.vaccineCompleted;
        if (status === 'skipped') return colorScheme.textTertiary;
        if (status === 'upcoming') return colorScheme.vaccineUpcoming;
        if (status === 'overdue') return '#FF9800'; // Amber, no red
        if (status === 'due') return '#FF9800';
        return colorScheme.textTertiary;
    };

    const getStatusLabel = (status) => {
        if (status === 'completed') return 'Received';
        if (status === 'skipped') return 'Skipped';
        if (status === 'due' || status === 'overdue') return 'Confirm Administration';
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
        ? formatAge(vaccinationStatus.ageInWeeks, selectedChild.date_of_birth)
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
                        <MaterialIcons name="calendar-today" size={24} color="#FFFFFF" />
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
                    <View style={styles.childInfoTopRow}>
                        <MaterialIcons name="vaccines" size={32} color="#FFFFFF" />
                        <View style={styles.childInfoText}>
                            <Text style={styles.childName} allowFontScaling={false} numberOfLines={2}>
                                {childName}'s Immunization
                            </Text>
                            <Text style={styles.childAge} allowFontScaling={false}>
                                Age: {childAge}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.viewScheduleBtn}
                        onPress={() => setShowScheduleModal(true)}
                    >
                        <Text style={styles.viewScheduleBtnText} allowFontScaling={false}>View Full Schedule</Text>
                    </TouchableOpacity>
                </View>

                {/* Alert for Pending Review */}
                {stats.actionRequired > 0 && (
                    <View style={[styles.alertCard, { backgroundColor: '#FFF3E0' }]}>
                        <MaterialIcons name="info-outline" size={24} color="#FF9800" />
                        <View style={styles.alertText}>
                            <Text style={[styles.alertTitle, { color: '#E65100' }]}>
                                Vaccination Status
                            </Text>
                            <Text style={[styles.alertSubtitle, { color: '#F57C00' }]}>
                                {stats.actionRequired} vaccine(s) are recommended for review.
                            </Text>
                            <TouchableOpacity
                                style={styles.markAllButton}
                                onPress={handleMarkAllOverdueAsGiven}
                            >
                                <MaterialIcons name="check" size={16} color="#FFFFFF" />
                                <Text style={styles.markAllButtonText}>Confirm All Administered</Text>
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
                                Received
                            </Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: colorScheme.border }]} />
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
                                {stats.actionRequired}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: colorScheme.textSecondary }]}>
                                Pending Review
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

                {/* Filters */}
                <View style={styles.filtersContainer}>
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'action', label: 'Pending Review' },
                        { key: 'completed', label: 'Received' },
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
                                            name={vaccine.status === 'completed' ? 'check-circle' : vaccine.status === 'skipped' ? 'block' : 'vaccines'}
                                            size={24}
                                            color={getStatusColor(vaccine.status)}
                                        />
                                    </View>
                                    <View style={styles.vaccineInfo}>
                                        <View style={styles.vaccineHeaderRow}>
                                            <Text style={[styles.vaccineName, { color: colorScheme.textPrimary }]} numberOfLines={2}>
                                                {vaccine.name}
                                            </Text>
                                            <MaterialIcons
                                                name={expandedId === vaccine.id ? 'expand-less' : 'expand-more'}
                                                size={24}
                                                color={colorScheme.textTertiary}
                                            />
                                        </View>
                                        
                                        <Text style={[styles.vaccineFullName, { color: colorScheme.textSecondary }]}>
                                            {vaccine.fullName}
                                        </Text>
                                        <Text style={[styles.scheduleAge, { color: colorScheme.textTertiary }]}>
                                            Schedule: {vaccine.ageLabel}
                                        </Text>

                                        <View style={styles.statusRow}>
                                            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(vaccine.status)}20` }]}>
                                                <Text style={[styles.statusText, { color: getStatusColor(vaccine.status) }]}>
                                                    {getStatusLabel(vaccine.status)}
                                                </Text>
                                            </View>
                                            {vaccine.highRiskCountiesOnly && (
                                                <View style={styles.highRiskBadge}>
                                                    <MaterialIcons name="location-on" size={10} color="#E65100" />
                                                    <Text style={styles.highRiskBadgeText}>High-Risk Counties Only</Text>
                                                </View>
                                            )}
                                        </View>
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
                                        {vaccine.status === 'skipped' && vaccine.skippedDate && (
                                            <View style={styles.detailRow}>
                                                <MaterialIcons name="block" size={16} color={colorScheme.textTertiary} />
                                                <Text style={[styles.detailText, { color: colorScheme.textTertiary }]}>
                                                    Skipped on: {new Date(vaccine.skippedDate).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Action Buttons */}
                                        <View style={styles.actionButtons}>
                                            {(vaccine.status === 'due' || vaccine.status === 'overdue') ? (
                                                <View style={{ gap: Spacing.sm, width: '100%' }}>
                                                    <TouchableOpacity
                                                        style={[styles.markButton, { backgroundColor: colorScheme.vaccineCompleted }]}
                                                        onPress={() => handleMarkAsGiven(vaccine)}
                                                    >
                                                        <MaterialIcons name="check" size={18} color="#FFFFFF" />
                                                        <Text style={styles.markButtonText}>Confirm Administration</Text>
                                                    </TouchableOpacity>
                                                    
                                                    {vaccine.highRiskCountiesOnly && (
                                                        <TouchableOpacity
                                                            style={[styles.markButton, { backgroundColor: colorScheme.background, borderWidth: 1, borderColor: colorScheme.border }]}
                                                            onPress={() => handleSkipVaccine(vaccine)}
                                                        >
                                                            <MaterialIcons name="skip-next" size={18} color={colorScheme.textSecondary} />
                                                            <Text style={[styles.markButtonText, { color: colorScheme.textSecondary }]}>Skip (Not Applicable)</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            ) : (vaccine.status === 'completed' || vaccine.status === 'skipped') ? (
                                                <TouchableOpacity
                                                    style={[styles.markButton, { backgroundColor: '#999' }]}
                                                    onPress={() => handleMarkAsNotGiven(vaccine)}
                                                >
                                                    <MaterialIcons name="undo" size={18} color="#FFFFFF" />
                                                    <Text style={styles.markButtonText}>Undo Status</Text>
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>

                                    </View>
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Kenya MOH Attribution */}
                <View style={[styles.attribution, { paddingHorizontal: 20 }]}>
                    <Text style={[styles.attributionText, { color: colorScheme.textTertiary, textAlign: 'center', lineHeight: 18 }]}>
                        Based on Kenya Ministry of Health Immunization Schedule (KEPI).{'\n'}Source:{' '}
                    </Text>
                    <TouchableOpacity
                        onPress={() => Linking.openURL('http://guidelines.health.go.ke:8000/media/Kenya_National_Immunization_Policy_Guidelines_Version_signed.pdf')}
                    >
                        <Text style={[styles.attributionText, { color: '#1565C0', textDecorationLine: 'underline', textAlign: 'center' }]}>
                            Kenya MOH Immunization Guidelines
                        </Text>
                    </TouchableOpacity>
                    <Text style={[styles.attributionText, { color: colorScheme.textTertiary, textAlign: 'center', lineHeight: 18, marginTop: 6 }]}>
                        Disclaimer: The Beacon Children's Centre app is an independent platform and does not represent the Kenya Ministry of Health or any other government entity.
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
                        backgroundColor: colorScheme.primary,
                        paddingTop: insets.top + Spacing.md,
                        borderBottomColor: colorScheme.primary
                    }]}>
                        <Text style={[styles.modalTitle, { color: '#FFFFFF' }]}>
                            Kenya MOH Vaccination Schedule
                        </Text>
                        <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                            <MaterialIcons name="close" size={24} color="#FFFFFF" />
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
                                    const isSkipped = skippedVaccines.some(sv => sv.id === v.id);
                                    return (
                                        <View
                                            key={v.id}
                                            style={[styles.scheduleItem, { backgroundColor: colorScheme.surface }]}
                                        >
                                            <MaterialIcons
                                                name={isCompleted ? 'check-circle' : isSkipped ? 'block' : 'radio-button-unchecked'}
                                                size={20}
                                                color={isCompleted ? colorScheme.vaccineCompleted : isSkipped ? colorScheme.textTertiary : colorScheme.textTertiary}
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
        flexDirection: 'column',
        gap: Spacing.sm,
        margin: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
    },
    childInfoTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flexShrink: 1,
    },
    childInfoText: {
        flex: 1,
        flexShrink: 1,
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
        alignSelf: 'flex-start',
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
        justifyContent: 'space-around',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    summaryDivider: {
        width: 1,
        height: 30,
        opacity: 0.5,
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: 2,
        textAlign: 'center',
    },
    summaryLabel: {
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 14,
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
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    vaccineIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vaccineInfo: {
        flex: 1,
        paddingRight: Spacing.xs,
    },
    vaccineName: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.bold,
        lineHeight: 20,
    },
    vaccineFullName: {
        fontSize: 11,
        lineHeight: 15,
        marginTop: 2,
    },
    scheduleAge: {
        fontSize: Typography.fontSize.xs,
        marginTop: 2,
    },
    highRiskBadgeText: {
        fontSize: 9,
        color: '#E65100',
        fontWeight: '600',
    },
    highRiskBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#FBE9E7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    vaccineHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginTop: Spacing.xs,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
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
        opacity: 0.9,
    },
});
