import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { MILESTONE_CATEGORIES, calculateAgeInMonths as calculateAgeHelper } from '../../constants/milestones';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { useDrawer } from '@/contexts/DrawerContext';

export default function MilestonesTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const { selectedChild } = useChild();
  const { openDrawer } = useDrawer();

  const selectedAge = selectedChild?.date_of_birth
    ? calculateAgeHelper(selectedChild.date_of_birth)
    : 12;

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: insets.top + Spacing.lg,
        backgroundColor: colorScheme.surface,
        borderBottomColor: colorScheme.border,
      }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={openDrawer} style={{ padding: Spacing.xs }}>
            <MaterialIcons name="menu" size={26} color={colorScheme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colorScheme.textPrimary }]}>
            Milestones
          </Text>
          <View style={{ width: 34 }} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.lg }}
      >
        {selectedChild ? (
          <View style={[styles.ageSelector, { backgroundColor: colorScheme.primaryLight }]}>
            <Text style={[styles.ageLabel, { color: colorScheme.primary }]}>
              {selectedChild.first_name}'s Age: {selectedAge} months
            </Text>
          </View>
        ) : (
          <View style={[styles.ageSelector, { backgroundColor: colorScheme.primaryLight }]}>
            <Text style={[styles.ageLabel, { color: colorScheme.primary }]}>
              Select a child to view personalized milestones
            </Text>
          </View>
        )}

        {MILESTONE_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryCard, { backgroundColor: colorScheme.surface }]}
            onPress={() => router.push(`/milestone-overview/${category.id}?age=${selectedAge}`)}
          >
            <View style={[styles.categoryIcon, { backgroundColor: `${colorScheme.primary}15` }]}>
              <MaterialIcons name={category.icon as any} size={28} color={colorScheme.primary} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryTitle, { color: colorScheme.textPrimary }]}>
                {category.title}
              </Text>
              <Text style={[styles.milestoneCount, { color: colorScheme.textSecondary }]}>
                View developmental milestones
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  ageSelector: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  ageLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '500',
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
    width: 48,
    height: 48,
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
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  milestoneCount: {
    fontSize: Typography.fontSize.base,
  },
});
