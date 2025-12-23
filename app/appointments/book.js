import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import appointmentService from '@/services/appointmentService';

export default function BookAppointmentScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSpecialty, setExpandedSpecialty] = useState(null);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const data = await appointmentService.getDoctors();
            setDoctors(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load doctors. Please try again.');
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDoctorSelect = (doctor) => {
        router.push({
            pathname: '/appointments/select-slot',
            params: { doctor: JSON.stringify(doctor) }
        });
    };

    const toggleSpecialty = (specialty) => {
        setExpandedSpecialty(expandedSpecialty === specialty ? null : specialty);
    };

    // Group doctors by specialty
    const groupedDoctors = doctors.reduce((acc, doctor) => {
        const specialty = doctor.specialty || 'General';
        if (!acc[specialty]) {
            acc[specialty] = [];
        }
        acc[specialty].push(doctor);
        return acc;
    }, {});

    const specialties = Object.keys(groupedDoctors);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
                <SafeHeader title="Select Doctor" showBack={true} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colorScheme.primary} />
                    <Text style={[styles.loadingText, { color: colorScheme.textSecondary }]}>
                        Loading doctors...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Select Doctor" showBack={true} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {specialties.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colorScheme.textSecondary }]}>
                            No doctors available at the moment.
                        </Text>
                    </View>
                ) : (
                    specialties.map((specialty) => (
                        <Animated.View
                            key={specialty}
                            style={styles.specialtyContainer}
                            layout={LinearTransition.duration(300)}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.specialtyHeader,
                                    {
                                        backgroundColor: colorScheme.surface,
                                        borderColor: colorScheme.border,
                                    },
                                ]}
                                onPress={() => toggleSpecialty(specialty)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.specialtyTitleRow}>
                                    <View style={[styles.iconContainer, { backgroundColor: colorScheme.primaryLight }]}>
                                        <MaterialIcons name="medical-services" size={24} color={colorScheme.primary} />
                                    </View>
                                    <Text style={[styles.specialtyTitle, { color: colorScheme.textPrimary }]}>
                                        {specialty}
                                    </Text>
                                </View>
                                <MaterialIcons
                                    name={expandedSpecialty === specialty ? "expand-less" : "expand-more"}
                                    size={24}
                                    color={colorScheme.textSecondary}
                                />
                            </TouchableOpacity>

                            {expandedSpecialty === specialty && (
                                <Animated.View
                                    style={styles.doctorsList}
                                    entering={FadeIn}
                                    exiting={FadeOut}
                                >
                                    {groupedDoctors[specialty].map((doctor) => (
                                        <TouchableOpacity
                                            key={doctor.id}
                                            style={[
                                                styles.doctorCard,
                                                {
                                                    backgroundColor: colorScheme.surface,
                                                    borderColor: colorScheme.border,
                                                },
                                            ]}
                                            onPress={() => handleDoctorSelect(doctor)}
                                            activeOpacity={0.7}
                                        >
                                            {doctor.photo_url ? (
                                                <Image
                                                    source={{ uri: doctor.photo_url }}
                                                    style={styles.doctorPhoto}
                                                />
                                            ) : (
                                                <View
                                                    style={[
                                                        styles.doctorAvatar,
                                                        { backgroundColor: colorScheme.primaryLight },
                                                    ]}
                                                >
                                                    <MaterialIcons
                                                        name="person"
                                                        size={24}
                                                        color={colorScheme.primary}
                                                    />
                                                </View>
                                            )}
                                            <View style={styles.doctorInfo}>
                                                <Text
                                                    style={[
                                                        styles.doctorName,
                                                        { color: colorScheme.textPrimary },
                                                    ]}
                                                >
                                                    {doctor.name}
                                                </Text>
                                                {doctor.phone && (
                                                    <View style={styles.phoneRow}>
                                                        <MaterialIcons
                                                            name="phone"
                                                            size={14}
                                                            color={colorScheme.textTertiary}
                                                        />
                                                        <Text
                                                            style={[
                                                                styles.phoneText,
                                                                { color: colorScheme.textTertiary },
                                                            ]}
                                                        >
                                                            {doctor.phone}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <MaterialIcons
                                                name="chevron-right"
                                                size={24}
                                                color={colorScheme.textTertiary}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </Animated.View>
                            )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: Typography.fontSize.base,
    },
    specialtyContainer: {
        marginBottom: Spacing.md,
        overflow: 'hidden', // Ensure animation stays within bounds
    },
    specialtyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        ...Shadow.sm,
        zIndex: 1, // Keep header above list during animation
    },
    specialtyTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    specialtyTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    doctorsList: {
        marginTop: Spacing.sm,
        marginLeft: Spacing.md,
    },
    doctorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        ...Shadow.sm,
    },
    doctorPhoto: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.xl,
    },
    doctorAvatar: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doctorInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    doctorName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: 2,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    phoneText: {
        fontSize: Typography.fontSize.xs,
    },
    emptyContainer: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: Typography.fontSize.base,
    },
});
