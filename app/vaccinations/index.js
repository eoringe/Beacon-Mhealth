import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

// Sample vaccination data
const VACCINATIONS = [
    {
        id: 'bcg',
        name: 'BCG',
        fullName: 'Bacillus Calmette-Guérin',
        scheduleAge: 'At birth',
        status: 'completed',
        dateGiven: '2023-06-15',
        description: 'Protects against tuberculosis',
    },
    {
        id: 'hepb1',
        name: 'Hepatitis B (1st dose)',
        scheduleAge: 'At birth',
        status: 'completed',
        dateGiven: '2023-06-15',
        description: 'First dose of Hepatitis B vaccine',
    },
    {
        id: 'dtap1',
        name: 'DTaP (1st dose)',
        fullName: 'Diphtheria, Tetanus, Pertussis',
        scheduleAge: '2 months',
        status: 'completed',
        dateGiven: '2023-08-15',
        description: 'Protects against diphtheria, tetanus, and whooping cough',
    },
    {
        id: 'mmr1',
        name: 'MMR (1st dose)',
        fullName: 'Measles, Mumps, Rubella',
        scheduleAge: '12 months',
        status: 'upcoming',
        dateGiven: null,
        description: 'Protects against measles, mumps, and rubella',
    },
    {
        id: 'mmr2',
        name: 'MMR (2nd dose)',
        fullName: 'Measles, Mumps, Rubella',
        scheduleAge: '18 months',
        status: 'upcoming',
        dateGiven: null,
        description: 'Second dose of MMR vaccine',
    },
];

export default function VaccinationsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();

    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const filteredVaccinations = VACCINATIONS.filter(vaccine => {
        const matchesFilter = selectedFilter === 'all' || vaccine.status === selectedFilter;
        const matchesSearch = vaccine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (vaccine.fullName && vaccine.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status) => {
        if (status === 'completed') return colorScheme.vaccineCompleted;
        if (status === 'upcoming') return colorScheme.vaccineUpcoming;
        if (status === 'overdue') return colorScheme.vaccineOverdue;
        return colorScheme.textTertiary;
    };

    const getStatusBadge = (status) => {
        return (
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
            </View>
        );
    };

    const stats = {
        total: VACCINATIONS.length,
        completed: VACCINATIONS.filter(v => v.status === 'completed').length,
        upcoming: VACCINATIONS.filter(v => v.status === 'upcoming').length,
    };

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Vaccinations"
                showBack={true}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Progress Summary */}
                <View style={[styles.summaryCard, { backgroundColor: colorScheme.surface }]}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: colorScheme.primary }]}>
                                {stats.completed}/{stats.total}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: colorScheme.textSecondary }]}>
                                Completed
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />
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
                    {['all', 'completed', 'upcoming'].map(filter => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: selectedFilter === filter
                                        ? colorScheme.primary
                                        : colorScheme.surface,
                                    borderColor: colorScheme.border,
                                },
                            ]}
                            onPress={() => setSelectedFilter(filter)}
                        >
                            <Text style={{
                                color: selectedFilter === filter ? '#FFFFFF' : colorScheme.textPrimary,
                                fontSize: Typography.fontSize.sm,
                                fontWeight: Typography.fontWeight.medium,
                            }}>
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Vaccination List */}
                <View style={styles.vaccineList}>
                    {filteredVaccinations.map((vaccine) => (
                        <TouchableOpacity
                            key={vaccine.id}
                            style={[styles.vaccineCard, { backgroundColor: colorScheme.surface }]}
                            onPress={() => setExpandedId(expandedId === vaccine.id ? null : vaccine.id)}
                        >
                            <View style={styles.vaccineHeader}>
                                <View style={styles.vaccineInfo}>
                                    <Text style={[styles.vaccineName, { color: colorScheme.textPrimary }]}>
                                        {vaccine.name}
                                    </Text>
                                    {vaccine.fullName && (
                                        <Text style={[styles.vaccineFullName, { color: colorScheme.textSecondary }]}>
                                            {vaccine.fullName}
                                        </Text>
                                    )}
                                    <Text style={[styles.scheduleAge, { color: colorScheme.textTertiary }]}>
                                        Schedule: {vaccine.scheduleAge}
                                    </Text>
                                </View>
                                <View style={styles.vaccineRight}>
                                    {getStatusBadge(vaccine.status)}
                                    <MaterialIcons
                                        name={expandedId === vaccine.id ? 'expand-less' : 'expand-more'}
                                        size={24}
                                        color={colorScheme.textTertiary}
                                    />
                                </View>
                            </View>

                            {expandedId === vaccine.id && (
                                <View style={[styles.vaccineDetails, { borderTopColor: colorScheme.border }]}>
                                    <Text style={[styles.description, { color: colorScheme.textSecondary }]}>
                                        {vaccine.description}
                                    </Text>

                                    {vaccine.status === 'completed' && vaccine.dateGiven && (
                                        <View style={styles.detailRow}>
                                            <MaterialIcons name="check-circle" size={16} color={colorScheme.vaccineCompleted} />
                                            <Text style={[styles.detailText, { color: colorScheme.textSecondary }]}>
                                                Given on {vaccine.dateGiven}
                                            </Text>
                                        </View>
                                    )}

                                    {vaccine.status === 'upcoming' && (
                                        <TouchableOpacity
                                            style={[styles.markCompletedButton, { backgroundColor: colorScheme.primary }]}
                                        >
                                            <MaterialIcons name="check" size={18} color="#FFFFFF" />
                                            <Text style={styles.markCompletedText}>Mark as Completed</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
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
    summaryCard: {
        margin: Spacing.lg,
        padding: Spacing.xl,
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
        backgroundColor: '#E0E0E0',
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.xs,
    },
    summaryLabel: {
        fontSize: Typography.fontSize.sm,
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
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    filterChip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    vaccineList: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
    },
    vaccineCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadow.md,
    },
    vaccineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    vaccineInfo: {
        flex: 1,
    },
    vaccineName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 2,
    },
    vaccineFullName: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.xs,
    },
    scheduleAge: {
        fontSize: Typography.fontSize.xs,
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
    description: {
        fontSize: Typography.fontSize.sm,
        lineHeight: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    detailText: {
        fontSize: Typography.fontSize.sm,
    },
    markCompletedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.xs,
    },
    markCompletedText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
});
