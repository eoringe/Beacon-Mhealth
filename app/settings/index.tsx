import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeHeader } from '@/components/SafeHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography } from '@/constants/theme';

export default function SettingsScreen() {
    const { colorScheme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Settings" showBack={true} />
            <View style={styles.content}>
                <Text style={{ color: colorScheme.textSecondary, textAlign: 'center' }}>
                    Settings options will appear here.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg
    }
});
