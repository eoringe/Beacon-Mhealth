import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useChild } from '@/contexts/ChildContext';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function ChildrenListScreen() {
    const router = useRouter();
    const { children, loading, selectChild, selectedChild, refreshChildren, deleteChild } = useChild();

    useEffect(() => {
        refreshChildren();
    }, []);

    const handleSelectChild = async (child) => {
        await selectChild(child);
        router.back();
    };

    const handleDelete = (child) => {
        Alert.alert(
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
                        } catch (error) {
                            Alert.alert("Error", error.message);
                        }
                    }
                }
            ]
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

    const renderChildItem = ({ item }) => (
        <View style={[
            styles.childCard,
            selectedChild?.id === item.id && styles.selectedCard
        ]}>
            <TouchableOpacity
                style={styles.childContent}
                onPress={() => handleSelectChild(item)}
            >
                <View style={[styles.avatarContainer, { backgroundColor: `${Colors.primary}20` }]}>
                    <FontAwesome5
                        name="baby"
                        size={24}
                        color={Colors.primary}
                    />
                </View>
                <View style={styles.childInfo}>
                    <Text style={[
                        styles.childName,
                        selectedChild?.id === item.id && styles.selectedText
                    ]}>
                        {item.first_name} {item.last_name}
                    </Text>
                    <Text style={[
                        styles.childDetails,
                        selectedChild?.id === item.id && styles.selectedText
                    ]}>
                        {calculateAge(item.date_of_birth)} • {item.gender}
                    </Text>
                </View>
                {selectedChild?.id === item.id && (
                    <MaterialIcons name="check-circle" size={24} color={Colors.primary} />
                )}
            </TouchableOpacity>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push({ pathname: '/children/edit', params: { id: item.id } })}
                >
                    <MaterialIcons name="edit" size={20} color={Colors.textSecondary} />
                    <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <View style={styles.actionDivider} />
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(item)}
                >
                    <MaterialIcons name="delete" size={20} color={Colors.error} />
                    <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Children</Text>
                <TouchableOpacity onPress={() => router.push('/children/add')}>
                    <MaterialIcons name="add" size={28} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {loading && children.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : children.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <FontAwesome5 name="baby-carriage" size={64} color={Colors.textSecondary} />
                    <Text style={styles.emptyText}>No children added yet</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => router.push('/children/add')}
                    >
                        <Text style={styles.addButtonText}>Add Your First Child</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={children}
                    renderItem={renderChildItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshing={loading}
                    onRefresh={refreshChildren}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl + 20,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    listContent: {
        padding: Spacing.md,
    },
    childCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: 'transparent', // Invisible border by default to prevent layout shift
    },
    selectedCard: {
        borderColor: Colors.primary, // Only change color when selected
        backgroundColor: Colors.white,
    },
    childContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        // backgroundColor: Colors.white, // Removed to fix corner clipping
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        // backgroundColor: Colors.background, // Removed in favor of inline style
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    childInfo: {
        flex: 1,
    },
    childName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
    },
    actionButtons: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
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
        fontWeight: Typography.fontWeight.medium,
        color: Colors.textSecondary,
    },
    actionDivider: {
        width: 1,
        backgroundColor: Colors.border,
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
        color: Colors.textSecondary,
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    addButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    addButtonText: {
        color: Colors.white,
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
    },
});
