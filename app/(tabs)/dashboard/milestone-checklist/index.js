import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
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
import { milestoneService } from '@/services/milestoneService';
import { reportService } from '@/services/reportService';

export default function MilestoneChecklist() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme, isDark } = useTheme();
  const { selectedChild, asdScreenings } = useChild();
  const { showAlert } = useAlert();
  const { age } = useLocalSearchParams();

  const [allResponses, setAllResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  // Load all milestone responses on screen focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchResponses = async () => {
        if (!selectedChild?.id) return;
        setLoading(true);
        try {
          const data = await milestoneService.getAllMilestoneResponsesForChild(selectedChild.id, false);
          if (active) {
            setAllResponses(data || []);
          }
        } catch (error) {
          console.error('Error fetching milestone responses:', error);
        } finally {
          if (active) setLoading(false);
        }
      };

      fetchResponses();
      return () => {
        active = false;
      };
    }, [selectedChild?.id, selectedAge])
  );

  // Get age of child in months
  const childAgeInMonths = useMemo(() => {
    if (!selectedChild?.date_of_birth) return 0;
    return calculateAgeHelper(selectedChild.date_of_birth);
  }, [selectedChild?.date_of_birth]);

  const isOver18Months = childAgeInMonths >= 18;

  // Calculate stats for the selected age
  const stats = useMemo(() => {
    const milestoneDataForAge = getMilestonesForAge(selectedAge) || {};
    let totalQuestions = 0;
    let totalAchieved = 0;
    let totalAnswered = 0;

    const categoryStats = MILESTONE_CATEGORIES.reduce((acc, cat) => {
      const milestonesList = milestoneDataForAge[cat.id] || [];
      const savedRow = allResponses.find(r => r.category === cat.id && Number(r.age_months) === Number(selectedAge));
      const catResponses = savedRow?.responses || {};

      let catAchieved = 0;
      let catAnswered = 0;

      milestonesList.forEach((_, idx) => {
        const responseVal = catResponses[idx];
        if (responseVal) {
          catAnswered++;
          if (responseVal === 'yes') {
            catAchieved++;
          }
        }
      });

      totalQuestions += milestonesList.length;
      totalAchieved += catAchieved;
      totalAnswered += catAnswered;

      acc[cat.id] = {
        achieved: catAchieved,
        total: milestonesList.length,
        answered: catAnswered
      };
      return acc;
    }, {});

    return {
      totalQuestions,
      totalAchieved,
      totalAnswered,
      isFinalized: totalQuestions > 0 && totalAnswered === totalQuestions,
      categoryStats
    };
  }, [selectedAge, allResponses]);

  const handleDownloadPDF = async () => {
    if (!selectedChild) return;
    
    // Constraints check
    if (isOver18Months) {
      // Must finish ASD screener to download the report
      const hasAsd = asdScreenings && asdScreenings.length > 0;
      if (!hasAsd) {
        showAlert(
          'Requirements Not Met',
          'Children over 18 months must complete both the Milestones Checklist and the ASD Screener to download the Comprehensive Report.',
          [
            { text: 'Cancel' },
            { text: 'Go to ASD Screener', onPress: () => router.push('/(tabs)/asd-checklist') }
          ],
          'info'
        );
        return;
      }
      
      // If completed ASD, generate comprehensive report
      setDownloading(true);
      try {
        await reportService.generateComprehensiveReport(
          selectedChild,
          selectedAge,
          allResponses,
          asdScreenings[0]
        );
      } catch (err) {
        showAlert('Error', 'Failed to generate comprehensive report PDF.', [], 'error');
      } finally {
        setDownloading(false);
      }
    } else {
      // Under 18 months - can download milestone summary alone
      setDownloading(true);
      try {
        await reportService.generateMilestoneReport(selectedChild, selectedAge, allResponses);
      } catch (err) {
        showAlert('Error', 'Failed to generate milestone summary PDF.', [], 'error');
      } finally {
        setDownloading(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
      <SafeHeader
        title="Milestones Checker"
        showBack={true}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Age Indicator */}
        <View style={[styles.ageSelector, { backgroundColor: colorScheme.primaryLight }]}>
          <Text style={[styles.ageLabel, { color: colorScheme.primary }]}>Age checklist: {selectedAge} months</Text>
        </View>

        {loading && allResponses.length === 0 ? (
          <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colorScheme.primary} />
          </View>
        ) : (
          <>
            {/* Achievement Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: isDark ? colorScheme.surface : '#F5F3FF', borderColor: colorScheme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs }}>
                <MaterialIcons name="emoji-events" size={24} color="#6366F1" />
                <Text style={[styles.summaryTitle, { color: colorScheme.textPrimary }]}>Milestones Summary</Text>
              </View>
              <Text style={[styles.summaryScore, { color: colorScheme.textPrimary }]}>
                {stats.totalAchieved} / {stats.totalQuestions} Achieved
              </Text>
              <Text style={[styles.summaryText, { color: colorScheme.textSecondary }]}>
                {stats.totalAnswered} of {stats.totalQuestions} questions completed for this age.
              </Text>

              {/* Action Buttons */}
              <View style={styles.summaryActions}>
                {/* Download Button */}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#6366F1' }]}
                  onPress={handleDownloadPDF}
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <MaterialIcons name="download" size={18} color="#FFF" />
                      <Text style={styles.actionButtonText}>
                        {isOver18Months ? 'Comprehensive Report' : 'Download Summary PDF'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Next Steps / Directions */}
              {stats.isFinalized && (
                <View style={[styles.directionBox, { backgroundColor: isDark ? '#1E293B' : '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <MaterialIcons name="directions" size={20} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.directionTitle, { color: '#047857' }]}>What's Next?</Text>
                    {isOver18Months ? (
                      <View>
                        <Text style={[styles.directionText, { color: '#065F46', marginBottom: Spacing.sm }]}>
                          Milestone checklist completed! Since your child is over 18 months, please proceed to the ASD Screener to evaluate developmental signs.
                        </Text>
                        <TouchableOpacity
                          style={styles.asdButton}
                          onPress={() => router.push('/(tabs)/asd-checklist')}
                        >
                          <Text style={styles.asdButtonText}>Go to ASD Screener</Text>
                          <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={[styles.directionText, { color: '#065F46' }]}>
                        Excellent! Milestone checklist completed. Check other indicators like Growth, Sleep, or Feeding on the dashboard, or repeat this check as your child grows!
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Category Cards */}
            {MILESTONE_CATEGORIES.map((category) => {
              const catStat = stats.categoryStats[category.id] || { achieved: 0, total: 0, answered: 0 };
              const milestones = getMilestonesForAge(selectedAge)?.[category.id] || [];
              
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryCard, { backgroundColor: colorScheme.surface }]}
                  onPress={() => router.push(`/dashboard/milestone-checklist/${category.id}?age=${selectedAge}`)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                    <MaterialIcons name={category.icon} size={28} color={category.color} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryTitle, { color: colorScheme.textPrimary }]}>{category.title}</Text>
                    <Text style={[styles.milestoneCount, { color: colorScheme.textSecondary }]}>
                      {catStat.achieved} / {catStat.total} Achieved ({catStat.answered} checked)
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colorScheme.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* CDC Attribution */}
        <TouchableOpacity
          style={[styles.whoCard, { backgroundColor: isDark ? '#1E293B' : '#E3F2FD', borderColor: isDark ? '#334155' : '#BBDEFB', marginTop: Spacing.xl }]}
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
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  summaryScore: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    marginVertical: Spacing.xs,
  },
  summaryText: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.md,
  },
  summaryActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadow.sm,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  directionBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  directionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 2,
  },
  directionText: {
    fontSize: Typography.fontSize.xs,
    lineHeight: 16,
  },
  asdButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  asdButtonText: {
    color: '#FFF',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
});

