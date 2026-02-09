import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeHeader } from '@/components/SafeHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Spacing, Typography, BorderRadius, Colors } from '@/constants/theme';

export default function HelpScreen() {
    const { colorScheme } = useTheme();

    const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
        <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
            <Text style={[styles.question, { color: colorScheme.textPrimary }]}>{question}</Text>
            <Text style={[styles.answer, { color: colorScheme.textSecondary }]}>{answer}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <SafeHeader title="Help & Support" showBack={true} />
            <ScrollView contentContainerStyle={styles.content}>

                {/* Getting Started */}
                <Text style={[styles.heading, { color: colorScheme.textPrimary }]}>Getting Started</Text>

                <FAQItem
                    question="How do I add my child to the app?"
                    answer="Go to your Profile tab → tap 'Manage Children' → tap 'Add Child'. You can either enter your child's registration number if they're already registered at Beacon Children's Centre, or create a new profile by entering their details manually."
                />

                <FAQItem
                    question="How do I select a different child?"
                    answer="On the Home screen, tap on the child's name at the top of the dashboard. A dropdown will appear showing all your registered children. Simply tap on the child you want to view."
                />

                {/* Milestones */}
                <Text style={[styles.heading, { color: colorScheme.textPrimary, marginTop: Spacing.xl }]}>Tracking Milestones</Text>

                <FAQItem
                    question="How do I track my child's developmental milestones?"
                    answer="Go to the 'Milestones' tab in the bottom navigation. Here you'll see milestone categories organized by age. Tap on any category to view specific milestones and mark them as achieved when your child reaches them."
                />

                <FAQItem
                    question="What are developmental milestones?"
                    answer="Milestones are age-appropriate skills that most children achieve by a certain age. They include physical skills (sitting, walking), communication (first words), social skills (playing with others), and cognitive abilities (problem-solving)."
                />

                <FAQItem
                    question="How do I view my child's growth chart?"
                    answer="From the Home screen, tap 'Growth Chart' in the Quick Actions. You'll see your child's height and weight plotted on WHO growth charts, helping you track their physical development over time."
                />

                {/* Appointments */}
                <Text style={[styles.heading, { color: colorScheme.textPrimary, marginTop: Spacing.xl }]}>Booking Appointments</Text>

                <FAQItem
                    question="How do I book an appointment?"
                    answer="Go to the 'Visits' tab → tap the '+' button → select a doctor → choose your preferred date and time slot → confirm your booking. You'll receive a confirmation with the appointment details."
                />

                <FAQItem
                    question="Can I cancel or reschedule an appointment?"
                    answer="View your upcoming appointments in the 'Visits' tab. Tap on the appointment you want to change and select 'Cancel Appointment'. To reschedule, cancel the existing appointment and book a new one."
                />

                {/* Health Records */}
                <Text style={[styles.heading, { color: colorScheme.textPrimary, marginTop: Spacing.xl }]}>Health Records</Text>

                <FAQItem
                    question="How do I view my child's vaccination records?"
                    answer="From the Home screen, tap 'Vaccinations' in Quick Actions. You'll see a list of all vaccines, with completed ones marked and upcoming ones highlighted."
                />

                <FAQItem
                    question="Where can I find my child's prescriptions?"
                    answer="Tap 'Prescriptions' from the Home screen Quick Actions. This shows all prescriptions issued by doctors at Beacon Children's Centre, including medication details and dosage instructions."
                />

                <FAQItem
                    question="How do I access medical reports?"
                    answer="Tap 'Medical Reports' from the Home screen Quick Actions. Here you can view and download any medical reports, test results, or documentation from your child's visits."
                />

                {/* Account */}
                <Text style={[styles.heading, { color: colorScheme.textPrimary, marginTop: Spacing.xl }]}>Account & Profile</Text>

                <FAQItem
                    question="How do I update my profile?"
                    answer="Go to the Profile tab and tap 'Edit Profile'. You can update your name, phone number, and profile picture."
                />

                <FAQItem
                    question="How do I change my password?"
                    answer="Go to Profile → tap 'Change Password'. For security, you may need to log out and log back in before changing your password."
                />

                <FAQItem
                    question="How do I switch between light and dark mode?"
                    answer="Go to the Profile tab and look for the theme toggle. Tap it to switch between light and dark modes."
                />

                {/* Contact */}
                <Text style={[styles.heading, { color: colorScheme.textPrimary, marginTop: Spacing.xl }]}>Contact Us</Text>
                <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
                    <View style={styles.contactRow}>
                        <MaterialIcons name="email" size={20} color={colorScheme.primary} />
                        <Text style={[styles.contactText, { color: colorScheme.textSecondary }]}>
                            beaconchildrencenter@gmail.com
                        </Text>
                    </View>
                    <View style={styles.contactRow}>
                        <MaterialIcons name="phone" size={20} color={colorScheme.primary} />
                        <Text style={[styles.contactText, { color: colorScheme.textSecondary }]}>
                            +254 115 188 415
                        </Text>
                    </View>
                    <View style={styles.contactRow}>
                        <MaterialIcons name="phone" size={20} color={colorScheme.primary} />
                        <Text style={[styles.contactText, { color: colorScheme.textSecondary }]}>
                            +254 780 626 990
                        </Text>
                    </View>
                    <View style={styles.contactRow}>
                        <MaterialIcons name="location-on" size={20} color={colorScheme.primary} />
                        <Text style={[styles.contactText, { color: colorScheme.textSecondary }]}>
                            Feruzi Towers, 3rd floor, Wing B, Kiambu Road, opposite Quickmart
                        </Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },
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
        lineHeight: 22,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    contactText: {
        fontSize: Typography.fontSize.base,
        flex: 1,
    },
});
