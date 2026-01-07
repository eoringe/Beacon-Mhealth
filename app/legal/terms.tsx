import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeHeader } from '@/components/SafeHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography } from '@/constants/theme';

export default function TermsScreen() {
    const { colorScheme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Terms of Service" showBack={true} />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.text, { color: colorScheme.textSecondary }]}>
                    This is a placeholder for the Terms of Service. In a real application, you would list the rules and regulations that users must agree to in order to use the app.
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
