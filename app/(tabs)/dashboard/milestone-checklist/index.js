import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
  MILESTONE_CATEGORIES,
  MILESTONE_AGES,
  getMilestonesForAge,
  calculateAgeInMonths as calculateAgeHelper,
  CDC_SOURCE_URL
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
        title="Milestones Checker"
        showBack={true}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.lg }}
      >
        <View style={[styles.ageSelector, { backgroundColor: colorScheme.primaryLight }]}>
          <Text style={[styles.ageLabel, { color: colorScheme.primary }]}>Age: {selectedAge} months</Text>
        </View>

        {/* CDC Attribution */}
        <TouchableOpacity
          style={[styles.whoCard, { backgroundColor: '#E3F2FD' }]}
          onPress={() => Linking.openURL(CDC_SOURCE_URL)}
        >
          <MaterialIcons name="info" size={24} color="#1976D2" />
          <View style={styles.whoTextContainer}>
            <Text style={[styles.whoTitle, { color: '#1976D2' }]}>
              Source of Milestones Data
            </Text>
            <Text style={[styles.whoText, { color: '#1976D2' }]}>
              These milestones are based on the CDC's "Learn the Signs. Act Early." program (2022).
            </Text>
            <Text style={[styles.whoUrl, { color: '#1565C0', textDecorationLine: 'underline' }]}>
              cdc.gov/act-early/milestones
            </Text>
          </View>
          <MaterialIcons name="open-in-new" size={20} color="#1976D2" />
        </TouchableOpacity>

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
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  whoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  whoTextContainer: {
    flex: 1,
    gap: 2,
  },
  whoTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  whoUrl: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  whoText: {
    fontSize: Typography.fontSize.xs,
    lineHeight: 16,
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

