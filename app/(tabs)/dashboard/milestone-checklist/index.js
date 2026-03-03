import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
  MILESTONE_CATEGORIES,
  MILESTONE_AGES,
  getMilestonesForAge,
  calculateAgeInMonths as calculateAgeHelper
} from '@/constants/milestones';
import { SafeHeader } from '@/components/SafeHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { useAlert } from '@/contexts/AlertContext';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export default function MilestoneChecklist() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const { selectedChild } = useChild();
  const { showAlert } = useAlert();
  const { age } = useLocalSearchParams();

  // Calculate default age from child's date of birth or use provided age
  const selectedAge = useMemo(() => {
    if (age) return parseInt(age);
    if (!selectedChild?.date_of_birth) return 12;

    // Find closest age group to child's actual age
    const childAge = calculateAgeHelper(selectedChild.date_of_birth);
    const allAges = MILESTONE_AGES.map(a => a.value);

    let closest = allAges[0];
    for (const a of allAges) {
      if (childAge >= a) closest = a;
      else break;
    }
    return closest;
  }, [age, selectedChild?.date_of_birth]);

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
      <SafeHeader
        title="Milestone Checker"
        showBack={true}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.lg }}
      >
        <View style={[styles.ageSelector, { backgroundColor: colorScheme.primaryLight }]}>
          <Text style={[styles.ageLabel, { color: colorScheme.primary }]}>Age: {selectedAge} months</Text>
        </View>

        {MILESTONE_CATEGORIES.map((category) => {
          const milestones = getMilestonesForAge(selectedAge)?.[category.id] || [];
          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { backgroundColor: colorScheme.surface }]}
              onPress={() => router.push(`/dashboard/milestone-checklist/${category.id}?age=${selectedAge}`)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: colorScheme.primaryLight }]}>
                <MaterialIcons name={category.icon} size={28} color={colorScheme.primary} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryTitle, { color: colorScheme.textPrimary }]}>{category.title}</Text>
                <Text style={[styles.milestoneCount, { color: colorScheme.textSecondary }]}>
                  {milestones.length} milestones
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colorScheme.textTertiary} />
            </TouchableOpacity>
          );
        })}
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

