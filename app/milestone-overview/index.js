import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
  MILESTONE_CATEGORIES,
  MILESTONE_AGES,
  WHO_MILESTONES,
  getMilestonesForAge,
  calculateAgeInMonths,
  formatAgeMonths
} from '../../constants/milestones';
import { SafeHeader } from '@/components/SafeHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export default function MilestoneOverview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const { selectedChild } = useChild();
  const { age } = useLocalSearchParams();

  const [selectedAgeIndex, setSelectedAgeIndex] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showAgeModal, setShowAgeModal] = useState(false);

  // Calculate child's age from DOB
  const childAgeMonths = useMemo(() => {
    if (selectedChild?.date_of_birth) {
      return calculateAgeInMonths(selectedChild.date_of_birth);
    }
    return age ? parseInt(age) : 12;
  }, [selectedChild?.date_of_birth, age]);

  // Get current viewing age (Logic standardized with MilestoneChecklist)
  const viewingAge = useMemo(() => {
    if (selectedAgeIndex !== null) {
      return MILESTONE_AGES[selectedAgeIndex].value;
    }

    // Default logic if no manual selection
    if (selectedChild?.date_of_birth) {
      const childAge = calculateAgeInMonths(selectedChild.date_of_birth);
      const allAges = MILESTONE_AGES.map(a => a.value);

      let closest = allAges[0];
      for (const a of allAges) {
        if (childAge >= a) closest = a;
        else break;
      }
      return closest;
    }

    return age ? parseInt(age) : 12;
  }, [selectedAgeIndex, selectedChild?.date_of_birth, age]);

  // Get milestones for selected age
  const milestones = useMemo(() => {
    const data = getMilestonesForAge(viewingAge);
    // Ensure we always return an object even if empty to avoid crashes
    return data || {};
  }, [viewingAge]);

  const childName = selectedChild?.first_name || selectedChild?.fullname || 'Your child';

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
      <SafeHeader
        title="Developmental Milestones"
        showBack={true}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Child Info Card */}
        <View style={[styles.childCard, { backgroundColor: colorScheme.primary }]}>
          <MaterialIcons name="child-care" size={40} color="#FFFFFF" />
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{childName}</Text>
            <Text style={styles.childAge}>Age: {formatAgeMonths(childAgeMonths)}</Text>
          </View>
        </View>

        {/* Age Selector */}
        <TouchableOpacity
          style={[styles.ageSelector, { backgroundColor: colorScheme.surface }]}
          onPress={() => setShowAgeModal(true)}
        >
          <View style={styles.ageSelectorContent}>
            <MaterialIcons name="event" size={24} color={colorScheme.primary} />
            <View style={styles.ageSelectorText}>
              <Text style={[styles.ageSelectorLabel, { color: colorScheme.textSecondary }]}>
                Viewing milestones for
              </Text>
              <Text style={[styles.ageSelectorValue, { color: colorScheme.textPrimary }]}>
                {milestones?.ageLabel || `${viewingAge} months`}
              </Text>
            </View>
          </View>
          <MaterialIcons name="expand-more" size={24} color={colorScheme.textTertiary} />
        </TouchableOpacity>

        {/* WHO Attribution */}
        <View style={[styles.whoCard, { backgroundColor: '#E3F2FD' }]}>
          <MaterialIcons name="verified" size={20} color="#1976D2" />
          <Text style={[styles.whoText, { color: '#1976D2' }]}>
            Based on WHO Child Development Standards
          </Text>
        </View>

        {/* Domain Cards */}
        {MILESTONE_CATEGORIES.map((category) => (
          <View key={category.id} style={styles.categorySection}>
            <TouchableOpacity
              style={[styles.categoryCard, { backgroundColor: colorScheme.surface }]}
              onPress={() => setExpandedCategory(
                expandedCategory === category.id ? null : category.id
              )}
            >
              <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                <MaterialIcons name={category.icon} size={28} color={category.color} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryTitle, { color: colorScheme.textPrimary }]}>
                  {category.title}
                </Text>
                <Text style={[styles.categoryDesc, { color: colorScheme.textSecondary }]}>
                  {category.description}
                </Text>
                {milestones?.[category.id] && (
                  <Text style={[styles.milestoneCount, { color: category.color }]}>
                    {milestones[category.id].length} milestones
                  </Text>
                )}
              </View>
              <MaterialIcons
                name={expandedCategory === category.id ? "expand-less" : "expand-more"}
                size={24}
                color={colorScheme.textTertiary}
              />
            </TouchableOpacity>

            {/* Expanded Milestones */}
            {expandedCategory === category.id && milestones?.[category.id] && (
              <View style={[styles.milestoneList, { backgroundColor: colorScheme.surface }]}>
                {milestones[category.id].map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.milestoneItem,
                      index < milestones[category.id].length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colorScheme.border,
                      }
                    ]}
                  >
                    <View style={[
                      styles.milestoneBullet,
                      { backgroundColor: item.key ? category.color : colorScheme.textTertiary }
                    ]} />
                    <Text style={[
                      styles.milestoneText,
                      { color: colorScheme.textPrimary },
                      item.key && styles.keyMilestone
                    ]}>
                      {item.milestone}
                    </Text>
                    {item.key && (
                      <View style={[styles.keyBadge, { backgroundColor: `${category.color}20` }]}>
                        <Text style={[styles.keyBadgeText, { color: category.color }]}>Key</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Tips Section */}
        <View style={[styles.tipsCard, { backgroundColor: '#FFF8E1' }]}>
          <MaterialIcons name="lightbulb" size={24} color="#F9A825" />
          <View style={styles.tipsContent}>
            <Text style={[styles.tipsTitle, { color: '#F57F17' }]}>Remember</Text>
            <Text style={[styles.tipsText, { color: '#8D6E63' }]}>
              Children develop at their own pace. These milestones are guidelines, not strict rules.
              Contact your healthcare provider if you have concerns.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Age Selection Modal */}
      <Modal
        visible={showAgeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAgeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
            backgroundColor: colorScheme.surface,
            paddingBottom: insets.bottom + Spacing.lg
          }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colorScheme.textPrimary }]}>
                Select Age Group
              </Text>
              <TouchableOpacity onPress={() => setShowAgeModal(false)}>
                <MaterialIcons name="close" size={24} color={colorScheme.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.ageList}>
              {MILESTONE_AGES.map((ageOption, index) => (
                <TouchableOpacity
                  key={ageOption.value}
                  style={[
                    styles.ageOption,
                    viewingAge === ageOption.value && {
                      backgroundColor: `${colorScheme.primary}15`
                    }
                  ]}
                  onPress={() => {
                    setSelectedAgeIndex(index);
                    setShowAgeModal(false);
                  }}
                >
                  <View>
                    <Text style={[
                      styles.ageOptionLabel,
                      { color: colorScheme.textPrimary },
                      viewingAge === ageOption.value && {
                        color: colorScheme.primary,
                        fontWeight: Typography.fontWeight.bold
                      }
                    ]}>
                      {ageOption.label}
                    </Text>
                    <Text style={[styles.ageOptionRange, { color: colorScheme.textSecondary }]}>
                      {ageOption.range}
                    </Text>
                  </View>
                  {viewingAge === ageOption.value && (
                    <MaterialIcons name="check" size={24} color={colorScheme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  childAge: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  ageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  ageSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ageSelectorText: {},
  ageSelectorLabel: {
    fontSize: Typography.fontSize.xs,
  },
  ageSelectorValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  whoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  whoText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  categorySection: {
    marginBottom: Spacing.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  categoryDesc: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  milestoneCount: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    marginTop: 4,
  },
  milestoneList: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  milestoneBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  milestoneText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  keyMilestone: {
    fontWeight: Typography.fontWeight.medium,
  },
  keyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  keyBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.medium,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: Typography.fontSize.xs,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  ageList: {
    paddingHorizontal: Spacing.lg,
  },
  ageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  ageOptionLabel: {
    fontSize: Typography.fontSize.md,
  },
  ageOptionRange: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
});
