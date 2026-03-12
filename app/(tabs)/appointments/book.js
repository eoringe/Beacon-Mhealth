import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { LoadingScreen } from '@/components/LoadingComponents';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import appointmentService from '@/services/appointmentService';

// Map specialization names to icons
const SPECIALIZATION_ICONS = {
    'General': 'local-hospital',
    'Pediatrics': 'child-care',
    'Dermatology': 'healing',
    'Dentistry': 'mood',
    'Cardiology': 'favorite',
    'Neurology': 'psychology',
    'Orthopedics': 'accessibility-new',
    'ENT': 'hearing',
    'Ophthalmology': 'visibility',
    'Nutrition': 'restaurant',
    'Physiotherapy': 'fitness-center',
    'Speech Therapy': 'record-voice-over',
    'Occupational Therapy': 'sports-handball',
};

const getSpecializationIcon = (name) => {
    if (!name) return 'medical-services';
    for (const [key, icon] of Object.entries(SPECIALIZATION_ICONS)) {
        if (name.toLowerCase().includes(key.toLowerCase())) return icon;
    }
    return 'medical-services';
};

export default function BookAppointmentScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();

    const [specializations, setSpecializations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const isNavigating = React.useRef(false);

    useEffect(() => {
        fetchSpecializations();
    }, []);

    const fetchSpecializations = async (forceRefresh = false) => {
        try {
            if (!forceRefresh) setLoading(true);
            const data = await appointmentService.getSpecializations(forceRefresh);
            setSpecializations(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load specializations. Please try again.');
            console.error('Error fetching specializations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchSpecializations(true);
    }, []);

    const handleSpecializationSelect = (spec) => {
        if (isNavigating.current) return;
        isNavigating.current = true;
        setTimeout(() => isNavigating.current = false, 1000);

        router.push({
            pathname: '/appointments/select-slot',
            params: { specialization: JSON.stringify(spec) }
        });
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
                <SafeHeader title="Select Specialization" showBack={true} />
                <LoadingScreen text="Loading specializations..." />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Select Specialization" showBack={true} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colorScheme.primary]}
                        tintColor={colorScheme.primary}
                    />
                }
            >
                {/* Info banner */}
                <View style={[styles.infoBanner, { backgroundColor: colorScheme.primaryLight }]}>
                    <MaterialIcons name="info-outline" size={20} color={colorScheme.primary} />
                    <Text style={[styles.infoText, { color: colorScheme.primary }]}>
                        Choose a specialization and we'll assign the best available doctor for you.
                    </Text>
                </View>

                {specializations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="medical-services" size={48} color={colorScheme.textTertiary} />
                        <Text style={[styles.emptyText, { color: colorScheme.textSecondary }]}>
                            No specializations available at the moment.
                        </Text>
                    </View>
                ) : (
                    specializations.map((spec, index) => (
                        <Animated.View
                            key={spec.id}
                            entering={FadeInDown.delay(index * 80).duration(400)}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.specCard,
                                    {
                                        backgroundColor: colorScheme.surface,
                                        borderColor: colorScheme.border,
                                    },
                                ]}
                                onPress={() => handleSpecializationSelect(spec)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: colorScheme.primaryLight }]}>
                                    <MaterialIcons
                                        name={getSpecializationIcon(spec.name)}
                                        size={28}
                                        color={colorScheme.primary}
                                    />
                                </View>
                                <View style={styles.specInfo}>
                                    <View style={styles.specTitleRow}>
                                        <Text style={[styles.specName, { color: colorScheme.textPrimary }]}>
                                            {spec.name}
                                        </Text>
                                        {spec.hasTeleconsult && (
                                            <View style={[styles.teleBadge, { backgroundColor: colorScheme.primary + '15' }]}>
                                                <MaterialIcons name="videocam" size={12} color={colorScheme.primary} />
                                                <Text style={[styles.teleBadgeText, { color: colorScheme.primary }]}>Teleconsult</Text>
                                            </View>
                                        )}
                                    </View>

                                    {spec.doctors && spec.doctors.length > 0 && (
                                        <Text style={[styles.doctorsList, { color: colorScheme.textSecondary }]} numberOfLines={1}>
                                            {spec.doctors.map(d => d.name).join(', ')}
                                        </Text>
                                    )}

                                    {spec.doctorCount > 0 && (
                                        <Text style={[styles.doctorCount, { color: colorScheme.textTertiary }]}>
                                            {spec.doctorCount} {spec.doctorCount === 1 ? 'doctor' : 'doctors'} available
                                        </Text>
                                    )}
                                </View>
                                <MaterialIcons
                                    name="chevron-right"
                                    size={24}
                                    color={colorScheme.textTertiary}
                                />
                            </TouchableOpacity>
                        </Animated.View>
                    ))
                )}
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
        padding: Spacing.md,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    infoText: {
        flex: 1,
        fontSize: Typography.fontSize.sm,
        lineHeight: 20,
    },
    specCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        ...Shadow.sm,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    specInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    specName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 2,
    },
    doctorCount: {
        fontSize: Typography.fontSize.xs,
    },
    emptyContainer: {
        padding: Spacing.xxxl,
        alignItems: 'center',
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: Typography.fontSize.base,
        textAlign: 'center',
    },
    specTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    teleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        gap: 2,
    },
    teleBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    doctorsList: {
        fontSize: Typography.fontSize.xs,
        marginBottom: 2,
        fontStyle: 'italic',
    },
});
