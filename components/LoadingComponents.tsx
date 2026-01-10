import React from 'react';
import { View, StyleSheet, Modal, Dimensions } from 'react-native';
import { CustomLoading } from './CustomLoading';
import { useTheme } from '@/contexts/ThemeContext';

interface LoadingOverlayProps {
    visible: boolean;
    text?: string;
    transparent?: boolean;
}

/**
 * Full-screen loading overlay with dimmed background
 * Use for blocking operations like form submissions, data saving
 */
export const LoadingOverlay = ({ visible, text, transparent = false }: LoadingOverlayProps) => {
    const { colorScheme } = useTheme();

    if (!visible) return null;

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            statusBarTranslucent
        >
            <View style={[
                styles.overlay,
                { backgroundColor: transparent ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)' }
            ]}>
                <View style={[styles.container, { backgroundColor: colorScheme.surface }]}>
                    <CustomLoading size={48} text={text} />
                </View>
            </View>
        </Modal>
    );
};

/**
 * Inline loading indicator for sections/cards
 * Use for loading content within a screen
 */
export const LoadingSection = ({ text, size = 32 }: { text?: string; size?: number }) => {
    return (
        <View style={styles.sectionContainer}>
            <CustomLoading size={size} text={text} />
        </View>
    );
};

/**
 * Full-screen loading state for initial screen loads
 */
export const LoadingScreen = ({ text = 'Loading...' }: { text?: string }) => {
    const { colorScheme } = useTheme();

    return (
        <View style={[styles.screenContainer, { backgroundColor: colorScheme.background }]}>
            <CustomLoading size={56} text={text} />
        </View>
    );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
        minWidth: 140,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    sectionContainer: {
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    screenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
