import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { MILESTONE_CATEGORIES } from '../../constants/milestones';
import { SafeHeader } from '@/components/SafeHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

// Helper function to calculate age in months
const calculateAgeInMonths = (dateOfBirth) => {
  if (!dateOfBirth) return 12; // Default to 12 months
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
  // Round to nearest milestone age: 2, 3, 5, 6, 10, 12, 15
  const milestoneAges = [2, 3, 5, 6, 10, 12, 15];
  return milestoneAges.reduce((prev, curr) =>
    Math.abs(curr - months) < Math.abs(prev - months) ? curr : prev
  );
};

export default function MilestoneChecklist() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const { selectedChild } = useChild();
  const { age } = useLocalSearchParams();

  // Calculate default age from child's date of birth or use provided age
  const selectedAge = age ? parseInt(age) : (selectedChild?.date_of_birth ? calculateAgeInMonths(selectedChild.date_of_birth) : 12);

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
      <SafeHeader
        title="Milestone Checklist"
        showBack={true}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.lg }}
      >
        <View style={[styles.ageSelector, { backgroundColor: colorScheme.primaryLight }]}>
          <Text style={[styles.ageLabel, { color: colorScheme.primary }]}>Age: {selectedAge} months</Text>
        </View>

        {MILESTONE_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryCard, { backgroundColor: colorScheme.surface }]}
            onPress={() => router.push(`/milestone-checklist/${category.id}?age=${selectedAge}`)}
          >
            <View style={[styles.categoryIcon, { backgroundColor: colorScheme.primaryLight }]}>
              <MaterialIcons name={category.icon} size={28} color={colorScheme.primary} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryTitle, { color: colorScheme.textPrimary }]}>{category.title}</Text>
              <Text style={[styles.milestoneCount, { color: colorScheme.textSecondary }]}>
                {category.milestoneCount || 5} milestones
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colorScheme.textTertiary} />
          </TouchableOpacity>
        ))}
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
    padding: Spacing.lg,
  },
  ageSelector: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  ageLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  milestoneCount: {
    fontSize: Typography.fontSize.base,
  },
});

