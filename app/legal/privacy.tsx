import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeHeader } from '@/components/SafeHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography } from '@/constants/theme';

export default function PrivacyScreen() {
    const { colorScheme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Privacy Policy" showBack={true} />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.text, { color: colorScheme.textSecondary }]}>
                    This is a placeholder for the Privacy Policy. In a real application, you would outline how user data is collected, used, and protected here.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.lg },
    text: { fontSize: Typography.fontSize.base, lineHeight: 24 }
});
