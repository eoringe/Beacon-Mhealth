import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useChild } from '@/contexts/ChildContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useAlert } from '@/contexts/AlertContext';
import { SafeHeader } from '@/components/SafeHeader';
import { LoadingScreen } from '@/components/LoadingComponents';

export default function ChildrenListScreen() {
    const router = useRouter();
    const { from } = useLocalSearchParams();
    const isFromDashboard = from === 'dashboard';
    const insets = useSafeAreaInsets();
    const { colorScheme, isDark } = useTheme();
    const { children, loading, selectChild, selectedChild, refreshChildren, deleteChild } = useChild();
    const { showAlert } = useAlert();
    const [selectingId, setSelectingId] = useState(null);

    useEffect(() => {
        refreshChildren();
    }, []);

    const handleSelectChild = (child) => {
        setSelectingId(child.id);

        // Defer context update and navigation so the spinner renders instantly,
        // and use replace instead of push for a smoother cross-tab transition.
        setTimeout(async () => {
            await selectChild(child);
            router.replace('/');
        }, 50);
    };

    const handleViewProfile = async (child) => {
        // Ensure it's selected first? Or just view?
        // Usually viewing profile implies selecting or passing ID.
        // If we want to view profile WITHOUT selecting, we need to pass ID to route.
        // Current route /child-profile probably uses context.
        // Let's safe-guard by selecting it first if we want consistency, or just navigating?
        // The user said "when I press profile is when I see the child profile".
        // Let's assume /child-profile reads from context selectChild.
        await selectChild(child);
        router.push('/profile/child-profile');
    };

    const handleDelete = (child) => {
        showAlert(
            "Delete Child",
            `Are you sure you want to delete ${child.first_name}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteChild(child.id);
                            showAlert("Success", "Child deleted successfully", [], "success");
                        } catch (error) {
                            showAlert("Error", error.message, [], "error");
                        }
                    }
                }
            ],
            'warning'
        );
    };

    const calculateAge = (dob) => {
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

    const renderPlaceholderCard = (label) => (
        <TouchableOpacity
            style={[
                styles.childCard,
                {
                    backgroundColor: 'transparent',
                    borderColor: colorScheme.border,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    padding: Spacing.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 110,
                    marginBottom: Spacing.md,
                }
            ]}
            onPress={() => router.push('/profile/children/add')}
        >
            <MaterialIcons name="add-circle-outline" size={32} color={colorScheme.textSecondary} />
            <Text style={{ color: colorScheme.textSecondary, marginTop: Spacing.xs, fontWeight: 'bold', fontSize: Typography.fontSize.sm }}>
                Add {label}
            </Text>
            <Text style={{ color: colorScheme.textTertiary, fontSize: 11, marginTop: 2, textAlign: 'center' }}>
                Register more than one child to manage records separately
            </Text>
        </TouchableOpacity>
    );

    const renderChildItem = ({ item }) => (
        <View style={[
            styles.childCard,
            { backgroundColor: colorScheme.surface, borderColor: isDark ? colorScheme.border : '#000000' },
            selectedChild?.id === item.id && { borderColor: colorScheme.primary },
            selectingId === item.id && { opacity: 0.7 }
        ]}>
            <TouchableOpacity
                style={styles.childContent}
                onPress={() => handleSelectChild(item)}
                disabled={selectingId !== null}
            >
                <View style={[styles.avatarContainer, { backgroundColor: `${colorScheme.primary}20`, overflow: 'hidden' }]}>
                    {item.photo_url ? (
                        <Image source={{ uri: item.photo_url }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <MaterialIcons
                            name="face"
                            size={32}
                            color={colorScheme.primary}
                        />
                    )}
                </View>
                <View style={styles.childInfo}>
                    <Text style={[
                        styles.childName,
                        { color: colorScheme.textPrimary }
                    ]}>
                        {item.first_name} {item.last_name}
                    </Text>
                    <Text style={[
                        styles.childDetails,
                        { color: colorScheme.textSecondary }
                    ]}>
                        {calculateAge(item.date_of_birth)} • {item.gender}
                    </Text>
                </View>
                {selectingId === item.id ? (
                    <ActivityIndicator color={colorScheme.primary} size="small" />
                ) : selectedChild?.id === item.id && (
                    <MaterialIcons name="check-circle" size={24} color={colorScheme.primary} />
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                style={{ position: 'absolute', top: Spacing.sm, right: Spacing.sm, zIndex: 1, padding: Spacing.xs, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12 }}
                onPress={() => handleDelete(item)}
            >
                <MaterialIcons name="delete" size={16} color={colorScheme.error} />
            </TouchableOpacity>

            <View style={[styles.actionButtons, { borderTopColor: colorScheme.border }]}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleViewProfile(item)}
                >
                    <MaterialIcons name="person" size={20} color={colorScheme.primary} />
                    <Text style={[styles.actionText, { color: colorScheme.primary }]}>View Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const handleBack = () => {
        if (isFromDashboard) {
            router.replace('/');
        } else {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/profile');
            }
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader 
                title="My Children" 
                showBack 
                backIconName={isFromDashboard ? "close" : "arrow-back"} 
                onBackPress={handleBack} 
                rightComponent={
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                        <TouchableOpacity onPress={() => router.push('/profile/children/lookup')} style={styles.headerButton}>
                            <MaterialIcons name="search" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/profile/children/add')} style={styles.headerButton}>
                            <MaterialIcons name="add" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                } 
            />

            {loading && children.length === 0 ? (
                <LoadingScreen text="Loading children..." />
            ) : children.length === 0 ? (
                <ScrollView contentContainerStyle={styles.emptyContainer}>
                    <FontAwesome5 name="baby-carriage" size={64} color={colorScheme.textSecondary} />
                    <Text style={[styles.emptyText, { color: colorScheme.textSecondary }]}>No children added yet</Text>
                    <Text style={[styles.emptySubtext, { color: colorScheme.textTertiary }]}>
                        Find your child from Beacon Children Center or add manually
                    </Text>

                    <View style={{ width: '100%', marginBottom: Spacing.lg }}>
                        {renderPlaceholderCard("Child 1")}
                        {renderPlaceholderCard("Child 2")}
                    </View>

                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colorScheme.primary }]}
                        onPress={() => router.push('/profile/children/lookup')}
                    >
                        <MaterialIcons name="search" size={20} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>Find Client from Clinic</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: colorScheme.primary }]}
                        onPress={() => router.push('/profile/children/add')}
                    >
                        <MaterialIcons name="edit" size={20} color={colorScheme.primary} />
                        <Text style={[styles.secondaryButtonText, { color: colorScheme.primary }]}>Add Manually</Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <FlatList
                    data={children}
                    renderItem={renderChildItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshing={loading}
                    onRefresh={refreshChildren}
                    ListFooterComponent={() => (
                        <View style={{ marginTop: Spacing.sm }}>
                            {children.length === 1 && renderPlaceholderCard("Child 2")}
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: '700',
    },
    backButton: {
        padding: Spacing.xs,
    },
    listContent: {
        padding: Spacing.md,
    },
    childCard: {
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        overflow: 'hidden',
    },
    childContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    childInfo: {
        flex: 1,
    },
    childName: {
        fontSize: Typography.fontSize.md,
        fontWeight: '700',
    },
    childDetails: {
        fontSize: Typography.fontSize.sm,
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        borderTopWidth: 1,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        gap: Spacing.xs,
    },
    actionText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: '500',
    },
    actionDivider: {
        width: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    emptyText: {
        fontSize: Typography.fontSize.lg,
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: '700',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        marginTop: Spacing.md,
        gap: Spacing.sm,
    },
    secondaryButtonText: {
        fontSize: Typography.fontSize.md,
        fontWeight: '600',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    headerButton: {
        padding: Spacing.xs,
    },
    emptySubtext: {
        fontSize: Typography.fontSize.sm,
        textAlign: 'center',
        marginBottom: Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
});
