import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

const { width } = Dimensions.get('window');

export const CustomAlert = ({
    visible,
    title,
    message,
    type = 'info',
    buttons = [],
    onClose
}) => {
    const { colorScheme } = useTheme();

    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success': return colorScheme.success;
            case 'error': return colorScheme.error;
            case 'warning': return colorScheme.warning;
            default: return colorScheme.primary;
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colorScheme.surface }]}>
                    <View style={[styles.iconContainer, { backgroundColor: `${getColor()}15` }]}>
                        <MaterialIcons name={getIcon()} size={32} color={getColor()} />
                    </View>

                    <Text style={[styles.title, { color: colorScheme.textPrimary }]}>{title}</Text>
                    <Text style={[styles.message, { color: colorScheme.textSecondary }]}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {buttons.length > 0 ? (
                            buttons.map((btn, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        btn.style === 'cancel' ? {
                                            backgroundColor: 'transparent',
                                            borderWidth: 1,
                                            borderColor: colorScheme.border
                                        } : {
                                            backgroundColor: btn.style === 'destructive' ? colorScheme.error : colorScheme.primary
                                        },
                                        buttons.length > 1 && { flex: 1 }
                                    ]}
                                    onPress={() => {
                                        if (btn.onPress) btn.onPress();
                                        // The context handles closing, but we ensure onPress is called
                                    }}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        {
                                            color: btn.style === 'cancel' ? colorScheme.textPrimary : '#FFFFFF'
                                        }
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: colorScheme.primary }]}
                                onPress={onClose}
                            >
                                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>OK</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        ...Shadow.lg,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    message: {
        fontSize: Typography.fontSize.md,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: Spacing.md,
    },
    button: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    buttonText: {
        fontWeight: Typography.fontWeight.semibold,
        fontSize: Typography.fontSize.md,
    },
});
