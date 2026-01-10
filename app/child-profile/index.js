import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { LoadingSection } from '@/components/LoadingComponents';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import patientService from '@/services/patientService';

import { useChild } from '@/contexts/ChildContext';

export default function ChildProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();
    const [clinicalData, setClinicalData] = useState(null);
    const [loadingClinical, setLoadingClinical] = useState(false);
    const [mediaList, setMediaList] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Placeholder data for sections not yet connected to backend
    const childData = {
        growth: {
            height: { value: '--', unit: 'cm', percentile: '--' },
            weight: { value: '--', unit: 'kg', percentile: '--' },
            headCirc: { value: '--', unit: 'cm', percentile: '--' },
            lastUpdated: 'No data',
        },
        milestones: {
            completed: 0,
            total: 0,
            byCategory: {
                physical: { completed: 0, total: 0 },
                cognitive: { completed: 0, total: 0 },
                social: { completed: 0, total: 0 },
                language: { completed: 0, total: 0 },
                selfhelp: { completed: 0, total: 0 },
            },
        },
        vaccinations: {
            completed: 0,
            total: 0,
            nextDue: { name: 'No upcoming vaccines', date: '--' },
        },
        recentActivity: [],
    };

    // Fetch clinical data and media if registration number exists
    useEffect(() => {
        if (selectedChild?.registration_number) {
            fetchClinicalData();
            fetchMediaList();
        }
    }, [selectedChild]);

    const fetchClinicalData = async (forceRefresh = false) => {
        try {
            setLoadingClinical(true);
            const data = await patientService.lookupPatient(selectedChild.registration_number, forceRefresh);
            setClinicalData(data);
        } catch (error) {
            console.error('Error fetching clinical data:', error);
        } finally {
            setLoadingClinical(false);
        }
    };

    const fetchMediaList = async (forceRefresh = false) => {
        try {
            setLoadingMedia(true);
            const media = await patientService.getMediaList(selectedChild.registration_number, forceRefresh);
            setMediaList(media);
        } catch (error) {
            console.error('Error fetching media:', error);
        } finally {
            setLoadingMedia(false);
        }
    };

    // Pull-to-refresh handler
    const onRefresh = useCallback(async () => {
        if (!selectedChild?.registration_number) return;

        setRefreshing(true);
        console.log('🔄 PULL TO REFRESH: Fetching fresh data from remote...');

        try {
            await Promise.all([
                fetchClinicalData(true),
                fetchMediaList(true)
            ]);
        } finally {
            setRefreshing(false);
        }
    }, [selectedChild]);

    const handleOpenReport = (media) => {
        const downloadUrl = patientService.getMediaDownloadUrl(media.id);
        // For PDFs, we can use Linking to open them externally
        import('expo-linking').then(Linking => {
            Linking.openURL(downloadUrl);
        });
    };

    if (!selectedChild) {
        return (
            <View style={[styles.container, { backgroundColor: colorScheme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colorScheme.textPrimary }}>No child selected</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: colorScheme.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const calculateAge = (dob) => {
        if (!dob) return 'Age unknown';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age === 0) {
            const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
            return `${months} months`;
        }

        return `${age} years`;
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const handleViewChart = () => {
        router.push({ pathname: '/growth-chart', params: { childId: selectedChild.id } });
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'measurement': return 'straighten';
            case 'vaccine': return 'vaccines';
            case 'milestone': return 'stars';
            case 'appointment': return 'event';
            default: return 'circle';
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case 'measurement': return colorScheme.chartHeight;
            case 'vaccine': return colorScheme.vaccineCompleted;
            case 'milestone': return colorScheme.warning;
            case 'appointment': return colorScheme.appointmentScheduled;
            default: return colorScheme.textTertiary;
        }
    };

    // Construct profile display data
    const displayName = selectedChild.first_name && selectedChild.last_name
        ? `${selectedChild.first_name} ${selectedChild.last_name}`
        : selectedChild.fullname || 'Unnamed Child';

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader
                title="Child Profile"
                showBack={true}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colorScheme.primary}
                        colors={[colorScheme.primary]}
                    />
                }
            >
                {/* Profile Header */}
                <View style={[styles.headerSection, { backgroundColor: colorScheme.surface }]}>
                    <View style={styles.photoContainer}>
                        <View style={[styles.profilePhotoPlaceholder, { backgroundColor: `${colorScheme.primary}20`, borderColor: colorScheme.surface }]}>
                            <MaterialIcons name="person" size={60} color={colorScheme.primary} />
                        </View>
                        <TouchableOpacity style={[styles.editPhotoButton, { backgroundColor: colorScheme.primary }]}>
                            <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.childName, { color: colorScheme.textPrimary }]}>{displayName}</Text>
                    <Text style={[styles.childAge, { color: colorScheme.textSecondary }]}>
                        {calculateAge(selectedChild.date_of_birth)} • {selectedChild.gender}
                    </Text>
                    <Text style={[styles.dateOfBirth, { color: colorScheme.textTertiary }]}>
                        Born {formatDate(selectedChild.date_of_birth)}
                    </Text>
                    {selectedChild.registration_number && (
                        <Text style={[styles.regNumber, { color: colorScheme.primary, backgroundColor: `${colorScheme.primary}15` }]}>
                            Reg: {selectedChild.registration_number}
                        </Text>
                    )}

                    <TouchableOpacity
                        style={[styles.editProfileButton, { borderColor: colorScheme.border }]}
                        onPress={() => router.push({ pathname: '/children/edit', params: { id: selectedChild.id } })}
                    >
                        <MaterialIcons name="edit" size={18} color={colorScheme.primary} />
                        <Text style={[styles.editProfileText, { color: colorScheme.primary }]}>
                            Edit Profile
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Clinical Info Section - Only if Reg Number exists */}
                {/* Clinical Info Section - Only if Reg Number exists */}
                {selectedChild.registration_number && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                                Clinic Details
                            </Text>
                        </View>

                        {loadingClinical ? (
                            <LoadingSection text="Loading clinic details..." />
                        ) : clinicalData ? (
                            <View style={{ gap: Spacing.md }}>
                                {/* Parent/Guardian Info */}
                                {clinicalData.parent && (
                                    <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                                        <Text style={[styles.cardTitle, { color: colorScheme.textPrimary, marginBottom: Spacing.md, fontWeight: '600' }]}>
                                            Parent / Guardian
                                        </Text>
                                        <View style={styles.clinicalItem}>
                                            <View style={[styles.clinicalIcon, { backgroundColor: `${colorScheme.primary}15` }]}>
                                                <MaterialIcons name="person" size={24} color={colorScheme.primary} />
                                            </View>
                                            <View style={styles.clinicalContent}>
                                                <Text style={[styles.clinicalLabel, { color: colorScheme.textSecondary }]}>Name</Text>
                                                <Text style={[styles.clinicalValue, { color: colorScheme.textPrimary }]}>
                                                    {clinicalData.parent.displayName}
                                                </Text>
                                                <Text style={[styles.clinicalSubtext, { color: colorScheme.textTertiary }]}>
                                                    {clinicalData.parent.relationship}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={[styles.divider, { backgroundColor: colorScheme.border }]} />
                                        <View style={styles.clinicalItem}>
                                            <View style={[styles.clinicalIcon, { backgroundColor: `${colorScheme.primary}15` }]}>
                                                <MaterialIcons name="phone" size={24} color={colorScheme.primary} />
                                            </View>
                                            <View style={styles.clinicalContent}>
                                                <Text style={[styles.clinicalLabel, { color: colorScheme.textSecondary }]}>Contact</Text>
                                                <Text style={[styles.clinicalValue, { color: colorScheme.textPrimary }]}>
                                                    {clinicalData.parent.telephone}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* Last Visit & Vitals */}
                                <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                                    <Text style={[styles.cardTitle, { color: colorScheme.textPrimary, marginBottom: Spacing.md, fontWeight: '600' }]}>
                                        Recent Visit & Vitals
                                    </Text>

                                    {/* Last Visit */}
                                    <View style={styles.clinicalItem}>
                                        <View style={[styles.clinicalIcon, { backgroundColor: `${colorScheme.primary}15` }]}>
                                            <MaterialIcons name="event-available" size={24} color={colorScheme.primary} />
                                        </View>
                                        <View style={styles.clinicalContent}>
                                            <Text style={[styles.clinicalLabel, { color: colorScheme.textSecondary }]}>Last Visit</Text>
                                            <Text style={[styles.clinicalValue, { color: colorScheme.textPrimary }]}>
                                                {clinicalData.lastVisit ? formatDate(clinicalData.lastVisit.visitDate) : 'No recorded visits'}
                                            </Text>
                                            {clinicalData.lastVisit?.visitType && (
                                                <Text style={[styles.clinicalSubtext, { color: colorScheme.textTertiary }]}>
                                                    {clinicalData.lastVisit.visitType}
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    <View style={[styles.divider, { backgroundColor: colorScheme.border }]} />

                                    {/* Doctor */}
                                    <View style={styles.clinicalItem}>
                                        <View style={[styles.clinicalIcon, { backgroundColor: `${colorScheme.primary}15` }]}>
                                            <MaterialIcons name="medical-services" size={24} color={colorScheme.primary} />
                                        </View>
                                        <View style={styles.clinicalContent}>
                                            <Text style={[styles.clinicalLabel, { color: colorScheme.textSecondary }]}>Doctor Seen</Text>
                                            <Text style={[styles.clinicalValue, { color: colorScheme.textPrimary }]}>
                                                {clinicalData.lastVisit?.doctorName || 'N/A'}
                                            </Text>
                                            {clinicalData.lastVisit?.doctorSpecialization && (
                                                <Text style={[styles.clinicalSubtext, { color: colorScheme.textTertiary }]}>
                                                    {clinicalData.lastVisit.doctorSpecialization}
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    {/* Latest Triage (Vitals) */}
                                    {clinicalData.latestTriage && clinicalData.latestTriage.data && (
                                        <>
                                            <View style={[styles.divider, { backgroundColor: colorScheme.border, marginVertical: Spacing.md }]} />
                                            <Text style={[styles.cardSubtitle, { color: colorScheme.textSecondary, marginBottom: Spacing.sm }]}>
                                                Latest Vitals ({formatDate(clinicalData.latestTriage.createdAt)})
                                            </Text>

                                            <View style={styles.vitalsGrid}>
                                                {Object.entries(clinicalData.latestTriage.data).map(([key, value], index) => (
                                                    <View key={index} style={[styles.vitalItem, { backgroundColor: `${colorScheme.primary}10` }]}>
                                                        <Text style={[styles.vitalLabel, { color: colorScheme.textSecondary }]}>
                                                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                                                        </Text>
                                                        <Text style={[styles.vitalValue, { color: colorScheme.primary }]}>
                                                            {String(value)}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </>
                                    )}
                                </View>
                            </View>
                        ) : (
                            <Text style={{ color: colorScheme.textSecondary, fontStyle: 'italic', textAlign: 'center' }}>
                                Could not load clinic details.
                            </Text>
                        )}
                    </View>
                )}

                {/* Medical Reports Section */}
                {selectedChild.registration_number && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>
                                Medical Reports
                            </Text>
                        </View>

                        {loadingMedia ? (
                            <LoadingSection text="Loading reports..." />
                        ) : mediaList.length > 0 ? (
                            <View style={{ gap: Spacing.sm }}>
                                {mediaList.map((media, index) => (
                                    <TouchableOpacity
                                        key={media.id || index}
                                        style={[styles.card, { backgroundColor: colorScheme.surface }]}
                                        onPress={() => handleOpenReport(media)}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={[styles.clinicalIcon, { backgroundColor: `${colorScheme.primary}15` }]}>
                                                <MaterialIcons
                                                    name={media.mimeType?.includes('pdf') ? 'picture-as-pdf' : 'insert-drive-file'}
                                                    size={24}
                                                    color={colorScheme.primary}
                                                />
                                            </View>
                                            <View style={styles.clinicalContent}>
                                                <Text
                                                    style={[styles.clinicalValue, { color: colorScheme.textPrimary }]}
                                                    numberOfLines={1}
                                                >
                                                    {media.name}
                                                </Text>
                                                <Text style={[styles.clinicalSubtext, { color: colorScheme.textTertiary }]}>
                                                    {media.collection} • {media.sizeFormatted}
                                                </Text>
                                                <Text style={[styles.clinicalSubtext, { color: colorScheme.textTertiary }]}>
                                                    {new Date(media.uploadedAt).toLocaleDateString()}
                                                </Text>
                                            </View>
                                            <MaterialIcons name="open-in-new" size={20} color={colorScheme.textTertiary} />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <Text style={{ color: colorScheme.textSecondary, fontStyle: 'italic', textAlign: 'center' }}>
                                No medical reports available.
                            </Text>
                        )}
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary, marginBottom: Spacing.md }]}>
                        Quick Actions
                    </Text>

                    <View style={styles.quickActionsGrid}>
                        <TouchableOpacity
                            style={[styles.quickActionButton, { backgroundColor: colorScheme.surface }]}
                            onPress={handleViewChart}
                        >
                            <MaterialIcons name="straighten" size={24} color={colorScheme.primary} />
                            <Text style={[styles.quickActionLabel, { color: colorScheme.textPrimary }]}>
                                Growth Chart
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickActionButton, { backgroundColor: colorScheme.surface }]}
                            onPress={() => router.push('/milestone-checklist')}
                        >
                            <MaterialIcons name="check-circle" size={24} color={colorScheme.primary} />
                            <Text style={[styles.quickActionLabel, { color: colorScheme.textPrimary }]}>
                                Milestones
                            </Text>
                        </TouchableOpacity>
                    </View>
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
    headerSection: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadow.md,
    },
    photoContainer: {
        position: 'relative',
        marginBottom: Spacing.lg,
    },
    profilePhotoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editPhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    childName: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.xs,
    },
    childAge: {
        fontSize: Typography.fontSize.md,
        marginBottom: Spacing.xs,
    },
    dateOfBirth: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.sm,
    },
    regNumber: {
        fontSize: Typography.fontSize.sm,
        fontWeight: '600',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    editProfileText: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
    },
    section: {
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
    },
    card: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        ...Shadow.md,
    },
    clinicalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    clinicalIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    clinicalContent: {
        flex: 1,
    },
    clinicalLabel: {
        fontSize: Typography.fontSize.sm,
        marginBottom: 2,
    },
    clinicalValue: {
        fontSize: Typography.fontSize.md,
        fontWeight: '600',
    },
    clinicalSubtext: {
        fontSize: Typography.fontSize.xs,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.sm,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    quickActionButton: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
        ...Shadow.md,
    },
    quickActionLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        textAlign: 'center',
    },
    cardTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    cardSubtitle: {
        fontSize: Typography.fontSize.sm,
        fontStyle: 'italic',
    },
    vitalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    vitalItem: {
        width: '48%',
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
    },
    vitalLabel: {
        fontSize: Typography.fontSize.xs,
        marginBottom: 2,
    },
    vitalValue: {
        fontSize: Typography.fontSize.md,
        fontWeight: '700',
    },
});
