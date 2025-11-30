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

export default function TeleconsultationScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const [selectedSpecialty, setSelectedSpecialty] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const specialties = [
        { id: 'all', label: 'All', icon: 'medical-services' },
        { id: 'pediatrics', label: 'Pediatrics', icon: 'child-care' },
        { id: 'general', label: 'General', icon: 'healing' },
        { id: 'dermatology', label: 'Dermatology', icon: 'face' },
    ];

    const doctors = [
        {
            id: 1,
            name: 'Dr. Sarah Johnson',
            specialty: 'Pediatrician',
            rating: 4.9,
            reviews: 245,
            experience: '15 years',
            price: 50,
            availability: 'Available Now',
            specialtyId: 'pediatrics',
        },
        {
            id: 2,
            name: 'Dr. Michael Chen',
            specialty: 'General Practitioner',
            rating: 4.8,
            reviews: 189,
            experience: '12 years',
            price: 45,
            availability: 'Available Today',
            specialtyId: 'general',
        },
        {
            id: 3,
            name: 'Dr. Emily Thompson',
            specialty: 'Dermatologist',
            rating: 4.7,
            reviews: 156,
            experience: '10 years',
            price: 60,
            availability: 'Available Tomorrow',
            specialtyId: 'dermatology',
        },
        {
            id: 4,
            name: 'Dr. James Wilson',
            specialty: 'Pediatrician',
            rating: 4.8,
            reviews: 203,
            experience: '18 years',
            price: 55,
            availability: 'Available Now',
            specialtyId: 'pediatrics',
        },
    ];

    const filteredDoctors = doctors.filter((doctor) => {
        const matchesSpecialty =
            selectedSpecialty === 'all' || doctor.specialtyId === selectedSpecialty;
        const matchesSearch =
            doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSpecialty && matchesSearch;
    });

    return (
        <View
            style={[styles.container, { backgroundColor: colorScheme.background }]}
        >
            <SafeHeader title="Teleconsultation" showBack={true} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View
                        style={[styles.searchBar, { backgroundColor: colorScheme.surface }]}
                    >
                        <MaterialIcons
                            name="search"
                            size={20}
                            color={colorScheme.textSecondary}
                        />
                        <TextInput
                            style={[styles.searchInput, { color: colorScheme.textPrimary }]}
                            placeholder="Search doctors..."
                            placeholderTextColor={colorScheme.textTertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Specialty Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersContainer}
                    contentContainerStyle={styles.filtersContent}
                >
                    {specialties.map((specialty) => (
                        <TouchableOpacity
                            key={specialty.id}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor:
                                        selectedSpecialty === specialty.id
                                            ? colorScheme.primary
                                            : colorScheme.surface,
                                    borderColor: colorScheme.border,
                                },
                            ]}
                            onPress={() => setSelectedSpecialty(specialty.id)}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons
                                name={specialty.icon}
                                size={18}
                                color={
                                    selectedSpecialty === specialty.id
                                        ? '#FFFFFF'
                                        : colorScheme.textSecondary
                                }
                            />
                            <Text
                                style={[
                                    styles.filterLabel,
                                    {
                                        color:
                                            selectedSpecialty === specialty.id
                                                ? '#FFFFFF'
                                                : colorScheme.textPrimary,
                                    },
                                ]}
                            >
                                {specialty.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Info Banner */}
                <View
                    style={[
                        styles.infoBanner,
                        { backgroundColor: `${colorScheme.info}15` },
                    ]}
                >
                    <MaterialIcons
                        name="videocam"
                        size={24}
                        color={colorScheme.info}
                    />
                    <View style={styles.bannerContent}>
                        <Text
                            style={[styles.bannerTitle, { color: colorScheme.textPrimary }]}
                        >
                            Video Consultation
                        </Text>
                        <Text
                            style={[styles.bannerText, { color: colorScheme.textSecondary }]}
                        >
                            Connect with specialists from the comfort of your home
                        </Text>
                    </View>
                </View>

                {/* Doctors List */}
                <View style={styles.section}>
                    <Text
                        style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}
                    >
                        Available Specialists ({filteredDoctors.length})
                    </Text>

                    {filteredDoctors.map((doctor) => (
                        <View
                            key={doctor.id}
                            style={[
                                styles.doctorCard,
                                { backgroundColor: colorScheme.surface },
                            ]}
                        >
                            <View style={styles.doctorHeader}>
                                <View
                                    style={[
                                        styles.doctorAvatar,
                                        { backgroundColor: colorScheme.primaryLight },
                                    ]}
                                >
                                    <MaterialIcons
                                        name="person"
                                        size={32}
                                        color={colorScheme.primary}
                                    />
                                </View>
                                <View style={styles.doctorInfo}>
                                    <Text
                                        style={[
                                            styles.doctorName,
                                            { color: colorScheme.textPrimary },
                                        ]}
                                    >
                                        {doctor.name}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.doctorSpecialty,
                                            { color: colorScheme.textSecondary },
                                        ]}
                                    >
                                        {doctor.specialty}
                                    </Text>
                                    <View style={styles.doctorMeta}>
                                        <View style={styles.metaItem}>
                                            <MaterialIcons
                                                name="star"
                                                size={14}
                                                color={colorScheme.warning}
                                            />
                                            <Text
                                                style={[styles.metaText, { color: colorScheme.textSecondary }]}
                                            >
                                                {doctor.rating} ({doctor.reviews})
                                            </Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <MaterialIcons
                                                name="work"
                                                size={14}
                                                color={colorScheme.textTertiary}
                                            />
                                            <Text
                                                style={[styles.metaText, { color: colorScheme.textSecondary }]}
                                            >
                                                {doctor.experience}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View
                                style={[styles.divider, { backgroundColor: colorScheme.border }]}
                            />

                            <View style={styles.doctorFooter}>
                                <View style={styles.availabilityContainer}>
                                    <View
                                        style={[
                                            styles.availabilityDot,
                                            {
                                                backgroundColor:
                                                    doctor.availability === 'Available Now'
                                                        ? colorScheme.success
                                                        : colorScheme.warning,
                                            },
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            styles.availabilityText,
                                            { color: colorScheme.textSecondary },
                                        ]}
                                    >
                                        {doctor.availability}
                                    </Text>
                                </View>
                                <View style={styles.priceAndButton}>
                                    <Text
                                        style={[styles.price, { color: colorScheme.primary }]}
                                    >
                                        ${doctor.price}
                                    </Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.bookButton,
                                            { backgroundColor: colorScheme.primary },
                                        ]}
                                        onPress={() =>
                                            router.push(`/teleconsultation/payment?doctorId=${doctor.id}`)
                                        }
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.bookButtonText}>Book Now</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
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
    searchContainer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
        ...Shadow.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.fontSize.base,
    },
    filtersContainer: {
        marginBottom: Spacing.md,
    },
    filtersContent: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    filterLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    infoBanner: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.md,
    },
    bannerContent: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.xs,
    },
    bannerText: {
        fontSize: Typography.fontSize.sm,
    },
    section: {
        paddingHorizontal: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
    doctorCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadow.md,
    },
    doctorHeader: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    doctorAvatar: {
        width: 64,
        height: 64,
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
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 2,
    },
    doctorSpecialty: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.xs,
    },
    doctorMeta: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: Typography.fontSize.xs,
    },
    divider: {
        height: 1,
        marginBottom: Spacing.md,
    },
    doctorFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    availabilityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    availabilityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    availabilityText: {
        fontSize: Typography.fontSize.sm,
    },
    priceAndButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    price: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    bookButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    bookButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
});
