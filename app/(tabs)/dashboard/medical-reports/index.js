import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking
} from 'react-native';
import { LoadingSection } from '@/components/LoadingComponents';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeHeader } from '@/components/SafeHeader';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { useChild } from '@/contexts/ChildContext';
import { useAlert } from '@/contexts/AlertContext';
import { useRouter } from 'expo-router';
import patientService from '@/services/patientService';

export default function MedicalReportsScreen() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useTheme();
    const { selectedChild } = useChild();
    const { showAlert } = useAlert();
    const router = useRouter();
    const [mediaList, setMediaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load media when child changes
    useEffect(() => {
        if (!selectedChild) return;
        if (selectedChild?.registration_number) {
            fetchMedia();
        } else {
            setLoading(false);
            setError(null); // Clear error because we'll show instructions instead
        }
    }, [selectedChild]);

    const fetchMedia = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await patientService.getMediaList(selectedChild.registration_number);
            setMediaList(data);
        } catch (err) {
            console.error('Error fetching media:', err);
            setError('Could not load medical reports');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReport = async (media) => {
        // Use proxy URL to avoid potential auth issues with direct Laravel access
        const urlToOpen = patientService.getMediaDownloadUrl(media.id);

        try {
            const canOpen = await Linking.canOpenURL(urlToOpen);
            if (canOpen) {
                await Linking.openURL(urlToOpen);
            } else {
                alert('No PDF viewer available');
            }
        } catch (error) {
            console.error('Error opening report:', error);
            // Show error to user
            alert('Unable to open report. Please ensure you have a PDF viewer installed.');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFileIcon = (mimeType) => {
        if (mimeType?.includes('pdf')) return 'picture-as-pdf';
        if (mimeType?.includes('image')) return 'image';
        if (mimeType?.includes('word') || mimeType?.includes('document')) return 'description';
        return 'insert-drive-file';
    };

    const childName = selectedChild?.first_name && selectedChild?.last_name
        ? `${selectedChild.first_name} ${selectedChild.last_name}`
        : selectedChild?.fullname || 'Child';

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Medical Reports" showBack={true} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Info */}
                <View style={[styles.headerCard, { backgroundColor: colorScheme.surface }]}>
                    <MaterialIcons name="folder-open" size={40} color={colorScheme.primary} />
                    <Text style={[styles.headerTitle, { color: colorScheme.textPrimary }]}>
                        {childName}'s Medical Reports
                    </Text>
                    {selectedChild?.registration_number && (
                        <Text style={[styles.headerSubtitle, { color: colorScheme.textSecondary }]}>
                            Reg: {selectedChild.registration_number}
                        </Text>
                    )}
                </View>

                {/* Loading State */}
                {loading && (
                    <LoadingSection text="Loading reports..." />
                )}

                {/* Error State */}
                {error && !loading && (
                    <View style={styles.centerContent}>
                        <MaterialIcons name="error-outline" size={48} color={colorScheme.error} />
                        <Text style={[styles.statusText, { color: colorScheme.textSecondary }]}>
                            {error}
                        </Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: colorScheme.primary }]}
                            onPress={fetchMedia}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Empty State / Missing Reg Number Instructions */}
                {!loading && !error && mediaList.length === 0 && (
                    <View style={styles.centerContent}>
                        {selectedChild?.registration_number ? (
                            <>
                                <MaterialIcons name="folder-off" size={48} color={colorScheme.textTertiary} />
                                <Text style={[styles.statusText, { color: colorScheme.textSecondary }]}>
                                    No medical reports found
                                </Text>
                            </>
                        ) : (
                            <View style={styles.instructionsContainer}>
                                <View style={[styles.instructionIconCircle, { backgroundColor: `${colorScheme.primary}15` }]}>
                                    <MaterialIcons name="info-outline" size={32} color={colorScheme.primary} />
                                </View>
                                <Text style={[styles.instructionTitle, { color: colorScheme.textPrimary }]}>
                                    How to get Medical Reports
                                </Text>
                                <View style={styles.instructionSteps}>
                                    <View style={styles.instructionStep}>
                                        <View style={[styles.stepNumber, { backgroundColor: colorScheme.primary }]}>
                                            <Text style={styles.stepNumberText}>1</Text>
                                        </View>
                                        <Text style={[styles.instructionText, { color: colorScheme.textSecondary }]}>
                                            Ensure your child is registered at Beacon Children's Centre.
                                        </Text>
                                    </View>
                                    <View style={styles.instructionStep}>
                                        <View style={[styles.stepNumber, { backgroundColor: colorScheme.primary }]}>
                                            <Text style={styles.stepNumberText}>2</Text>
                                        </View>
                                        <Text style={[styles.instructionText, { color: colorScheme.textSecondary }]}>
                                            Book an appointment to Beacon Children's Centre through the app.
                                        </Text>
                                    </View>
                                    <View style={styles.instructionStep}>
                                        <View style={[styles.stepNumber, { backgroundColor: colorScheme.primary }]}>
                                            <Text style={styles.stepNumberText}>3</Text>
                                        </View>
                                        <Text style={[styles.instructionText, { color: colorScheme.textSecondary }]}>
                                            A registration number will automatically be assigned for the child after the first physical visit.
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={[styles.updateProfileButton, { borderColor: colorScheme.primary }]}
                                    onPress={() => router.push('/profile/child-profile')}
                                >
                                    <Text style={[styles.updateProfileButtonText, { color: colorScheme.primary }]}>
                                        Go to Child Profile
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Reports List */}
                {!loading && !error && mediaList.length > 0 && (
                    <View style={styles.listContainer}>
                        {mediaList.map((media, index) => (
                            <TouchableOpacity
                                key={media.id || index}
                                style={[styles.reportCard, { backgroundColor: colorScheme.surface }]}
                                onPress={() => handleOpenReport(media)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardContent}>
                                    <View style={[styles.iconContainer, { backgroundColor: `${colorScheme.primary}15` }]}>
                                        <MaterialIcons
                                            name={getFileIcon(media.mimeType)}
                                            size={28}
                                            color={colorScheme.primary}
                                        />
                                    </View>
                                    <View style={styles.fileInfo}>
                                        <Text
                                            style={[styles.fileName, { color: colorScheme.textPrimary }]}
                                            numberOfLines={2}
                                        >
                                            {media.name}
                                        </Text>
                                        <View style={styles.metaRow}>
                                            <Text style={[styles.metaText, { color: colorScheme.textSecondary }]}>
                                                {media.collection}
                                            </Text>
                                            <View style={styles.metaDot} />
                                            <Text style={[styles.metaText, { color: colorScheme.textSecondary }]}>
                                                {media.sizeFormatted}
                                            </Text>
                                        </View>
                                        <Text style={[styles.dateText, { color: colorScheme.textTertiary }]}>
                                            Uploaded: {formatDate(media.uploadedAt)}
                                        </Text>
                                    </View>
                                    <MaterialIcons name="open-in-new" size={20} color={colorScheme.textTertiary} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
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
    },
    headerCard: {
        alignItems: 'center',
        padding: Spacing.xl,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.lg,
        ...Shadow.md,
    },
    headerTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: Typography.fontSize.sm,
        marginTop: Spacing.xs,
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxxl,
    },
    statusText: {
        fontSize: Typography.fontSize.md,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: Typography.fontWeight.semibold,
    },
    listContainer: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
    },
    reportCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        ...Shadow.md,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    metaText: {
        fontSize: Typography.fontSize.sm,
    },
    metaDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#999',
        marginHorizontal: Spacing.sm,
    },
    dateText: {
        fontSize: Typography.fontSize.xs,
    },
    instructionsContainer: {
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
        width: '100%',
    },
    instructionIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    instructionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.xl,
        textAlign: 'center',
    },
    instructionSteps: {
        width: '100%',
        gap: Spacing.lg,
        marginBottom: Spacing.xxl,
    },
    instructionStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    stepNumberText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    instructionText: {
        flex: 1,
        fontSize: Typography.fontSize.md,
        lineHeight: 22,
    },
    updateProfileButton: {
        borderWidth: 1,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        width: '100%',
        alignItems: 'center',
    },
    updateProfileButtonText: {
        fontWeight: Typography.fontWeight.semibold,
        fontSize: Typography.fontSize.md,
    },
});
