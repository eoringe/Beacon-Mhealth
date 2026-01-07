import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeHeader } from '@/components/SafeHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function HelpScreen() {
    const { colorScheme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Help & Support" showBack={true} />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.heading, { color: colorScheme.textPrimary }]}>Frequently Asked Questions</Text>

                <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                    <Text style={[styles.question, { color: colorScheme.textPrimary }]}>How do I book a consultation?</Text>
                    <Text style={[styles.answer, { color: colorScheme.textSecondary }]}>
                        Navigate to the Teleconsultation tab, choose a doctor, and follow the booking steps.
                    </Text>
                </View>

                <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                    <Text style={[styles.question, { color: colorScheme.textPrimary }]}>How do I update my profile?</Text>
                    <Text style={[styles.answer, { color: colorScheme.textSecondary }]}>
                        Go to your Profile tab and click on "Edit Profile".
                    </Text>
                </View>

                <Text style={[styles.heading, { color: colorScheme.textPrimary, marginTop: Spacing.xl }]}>Contact Us</Text>
                <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                    <Text style={[styles.answer, { color: colorScheme.textSecondary }]}>
                        Email: support@beacon-mhealth.com{'\n'}
                        Phone: +250 123 456 789
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.lg },
    heading: {
        fontSize: Typography.fontSize.lg,
        fontWeight: 'bold',
        marginBottom: Spacing.md,
    },
    card: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
    },
    question: {
        fontWeight: '600',
        fontSize: Typography.fontSize.md,
        marginBottom: Spacing.sm,
    },
    answer: {
        fontSize: Typography.fontSize.base,
        lineHeight: 20,
    }
});
