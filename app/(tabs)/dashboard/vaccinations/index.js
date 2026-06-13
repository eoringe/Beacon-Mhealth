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
import DateTimePicker from '@react-native-community/datetimepicker';
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
const ADDITIONAL_VACCINES_KEY = 'additional_vaccines';

const ADDITIONAL_VACCINES = [
    { id: 'influenza', name: 'Influenza', diseases: ['Seasonal Flu'], note: 'Recommended annually from 6 months of age' },
    { id: 'chicken_pox', name: 'Chicken Pox', diseases: ['Varicella'], note: 'Usually given between 12-15 months and 4-6 years' },
    { id: 'typhoid', name: 'Typhoid', diseases: ['Typhoid Fever'], note: 'Recommended for children from 2 years of age' },
    { id: 'hepatitis_a', name: 'Hepatitis A', diseases: ['Hepatitis A virus infection'], note: 'Given as 2 doses from 1 year of age' },
    { id: 'cholera', name: 'Cholera', diseases: ['Cholera'], note: 'Recommended for travel or high-risk areas' },
    { id: 'meningococcal', name: 'Meningococcal', diseases: ['Meningococcal Meningitis'], note: 'Protects against bacterial meningitis' },
    { id: 'covid', name: 'COVID-19', diseases: ['SARS-CoV-2'], note: 'According to recommended schedules' },
    { id: 'rabies', name: 'Rabies', diseases: ['Rabies virus infection'], note: 'Recommended post-exposure or for high-risk contact' },
];

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
    
    const [activeTab, setActiveTab] = useState('moh');
    const [additionalVaccines, setAdditionalVaccines] = useState({});
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [activeVaccineId, setActiveVaccineId] = useState(null);

    // Load vaccines from storage
    useEffect(() => {
        loadVaccineData();
    }, [selectedChild]);

    const loadVaccineData = async () => {
        if (!selectedChild?.id) return;
        try {
            const completedKey = `${STORAGE_KEY}_${selectedChild.id}`;
            const skippedKey = `${SKIPPED_STORAGE_KEY}_${selectedChild.id}`;
            const addKey = `${ADDITIONAL_VACCINES_KEY}_${selectedChild.id}`;
            
            const [completedStored, skippedStored, addStored] = await Promise.all([
                AsyncStorage.getItem(completedKey),
                AsyncStorage.getItem(skippedKey),
                AsyncStorage.getItem(addKey)
            ]);

            setCompletedVaccines(completedStored ? JSON.parse(completedStored) : []);
            setSkippedVaccines(skippedStored ? JSON.parse(skippedStored) : []);
            setAdditionalVaccines(addStored ? JSON.parse(addStored) : {});
        } catch (error) {
            console.error('Error loading vaccine data:', error);
        }
    };

    const saveAdditionalVaccines = async (data) => {
        if (!selectedChild?.id) return;
        try {
            const key = `${ADDITIONAL_VACCINES_KEY}_${selectedChild.id}`;
            await AsyncStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving additional vaccines:', error);
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

    const handleToggleAdditional = (id) => {
        const isCurrentCompleted = !!additionalVaccines[id]?.completed;
        const updated = {
            ...additionalVaccines,
            [id]: {
                completed: !isCurrentCompleted,
                date: !isCurrentCompleted ? new Date().toISOString() : null
            }
        };
        setAdditionalVaccines(updated);
        saveAdditionalVaccines(updated);
    };

    const handleAdditionalDateChange = (id, date) => {
        if (!date) return;
        const updated = {
            ...additionalVaccines,
            [id]: {
                ...additionalVaccines[id],
                date: date.toISOString()
            }
        };
        setAdditionalVaccines(updated);
        saveAdditionalVaccines(updated);
    };

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
        missedCount: vaccinationStatus.overdueVaccines.length,
        unconfirmedCount: vaccinationStatus.dueVaccines.length,
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
                        {/* 1. Missed Vaccines */}
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                                {stats.missedCount}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: colorScheme.textSecondary }]}>
                                Missed
                            </Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: colorScheme.border }]} />
                        
                        {/* 2. Unconfirmed */}
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
                                {stats.unconfirmedCount}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: colorScheme.textSecondary }]}>
                                Unconfirmed
                            </Text>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: colorScheme.border }]} />
                        
                        {/* 3. Overall Status */}
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { 
                                fontSize: 13, 
                                color: stats.missedCount > 0 ? '#F44336' : stats.unconfirmedCount > 0 ? '#FF9800' : '#4CAF50',
                                fontWeight: 'bold'
                            }]}>
                                {stats.missedCount > 0 ? 'Missed' : stats.unconfirmedCount > 0 ? 'Pending' : 'Up-to-date'}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: colorScheme.textSecondary }]}>
                                Status
                            </Text>
                        </View>
                    </View>
                </View>

                {/* User Instruction Banner */}
                <View style={{ backgroundColor: '#FFF9C4', borderColor: '#FBC02D', borderWidth: 1, marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.md, flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' }}>
                    <MaterialIcons name="info" size={18} color="#F57F17" />
                    <Text style={{ color: '#F57F17', fontSize: 11, flex: 1, fontWeight: '500', lineHeight: 15 }}>
                        Instruction: Review missed or upcoming vaccines below. You can confirm administration or mark high-risk vaccines as skipped.
                    </Text>
                </View>

                {/* Segmented Control / Tab Switcher */}
                <View style={[styles.tabContainer, { borderColor: colorScheme.primary }]}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'moh' && { backgroundColor: colorScheme.primary }]}
                        onPress={() => setActiveTab('moh')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'moh' ? { color: '#FFFFFF' } : { color: colorScheme.textPrimary }]}>
                            MOH Schedule
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'additional' && { backgroundColor: colorScheme.primary }]}
                        onPress={() => setActiveTab('additional')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'additional' ? { color: '#FFFFFF' } : { color: colorScheme.textPrimary }]}>
                            Additional Vaccines
                        </Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'moh' ? (
                    <>
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
                    </>
                ) : (
                    <View style={styles.vaccineList}>
                        {ADDITIONAL_VACCINES.map((vaccine) => {
                            const isCompleted = !!additionalVaccines[vaccine.id]?.completed;
                            const completionDate = additionalVaccines[vaccine.id]?.date;
                            return (
                                <View key={vaccine.id} style={[styles.vaccineCard, { backgroundColor: colorScheme.surface }]}>
                                    <View style={styles.vaccineHeader}>
                                        <TouchableOpacity 
                                            style={[styles.vaccineIcon, { backgroundColor: isCompleted ? `${colorScheme.vaccineCompleted}15` : `${colorScheme.textTertiary}15` }]}
                                            onPress={() => handleToggleAdditional(vaccine.id)}
                                        >
                                            <MaterialIcons
                                                name={isCompleted ? 'check-box' : 'check-box-outline-blank'}
                                                size={26}
                                                color={isCompleted ? colorScheme.vaccineCompleted : colorScheme.textTertiary}
                                            />
                                        </TouchableOpacity>
                                        <View style={styles.vaccineInfo}>
                                            <Text style={[styles.vaccineName, { color: colorScheme.textPrimary }]}>
                                                {vaccine.name}
                                            </Text>
                                            <Text style={[styles.vaccineFullName, { color: colorScheme.textSecondary, marginTop: 2, fontSize: 11 }]}>
                                                Protects against: {vaccine.diseases.join(', ')}
                                            </Text>
                                            <Text style={[styles.scheduleAge, { color: colorScheme.textTertiary, marginTop: 2 }]}>
                                                {vaccine.note}
                                            </Text>
                                            
                                            {isCompleted && (
                                                <TouchableOpacity 
                                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm, backgroundColor: `${colorScheme.primary}15`, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm, alignSelf: 'flex-start' }}
                                                    onPress={() => {
                                                        setActiveVaccineId(vaccine.id);
                                                        setShowDatePicker(true);
                                                    }}
                                                >
                                                    <MaterialIcons name="event" size={14} color={colorScheme.primary} />
                                                    <Text style={{ fontSize: 11, color: colorScheme.primary, fontWeight: 'bold' }}>
                                                        Date: {completionDate ? new Date(completionDate).toLocaleDateString() : 'Set Date'}
                                                    </Text>
                                                    <MaterialIcons name="edit" size={10} color={colorScheme.primary} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {showDatePicker && activeVaccineId && (
                    <DateTimePicker
                        value={additionalVaccines[activeVaccineId]?.date ? new Date(additionalVaccines[activeVaccineId].date) : new Date()}
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) {
                                handleAdditionalDateChange(activeVaccineId, selectedDate);
                            }
                            setActiveVaccineId(null);
                        }}
                    />
                )}

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
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        borderWidth: 1,
    },
    tabButton: {
        flex: 1,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabButtonText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
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
