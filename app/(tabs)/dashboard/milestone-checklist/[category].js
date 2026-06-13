import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import {
  MILESTONE_CATEGORIES,
  MILESTONE_AGES,
  getMilestonesForAge,
  calculateAgeInMonths as calculateAgeHelper
} from '@/constants/milestones';
import { SafeHeader } from '@/components/SafeHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useChild } from '@/contexts/ChildContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { milestoneService } from '@/services/milestoneService';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

// Configure notification handler - how notifications should be displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Helper function to calculate age in months
const calculateAgeInMonths = (dateOfBirth) => {
  if (!dateOfBirth) return 12; // Default to 12 months
  return calculateAgeHelper(dateOfBirth);
};

// Function to schedule a reminder notification
const scheduleReminder = async (ageMonths) => {
  try {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Please enable notifications to receive reminders!');
      return;
    }

    // Schedule notification for 2 days from now
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Milestone Reminder',
        body: `Don't forget to book an appointment to discuss your child's ${ageMonths}-month development milestones.`,
        data: { type: 'milestone_reminder', ageMonths },
        sound: true,
      },
      trigger: {
        type: 'timeInterval',
        seconds: 172800, // 2 days = 2 * 24 * 60 * 60 seconds
      },
    });

    console.log('Reminder notification scheduled for 2 days from now');
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

export default function MilestoneCategory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme, isDark } = useTheme();
  const { selectedChild } = useChild();
  const { addNotification } = useNotifications();
  const { category, age } = useLocalSearchParams();

  // Get all available ages from the constants
  const allAges = useMemo(() => MILESTONE_AGES.map(a => a.value), []);

  // Calculate default age from child's date of birth or use provided age
  const defaultAge = useMemo(() => {
    if (age) return parseInt(age);
    if (!selectedChild?.date_of_birth) return 12;

    // Find closest age group to child's actual age
    const childAge = calculateAgeHelper(selectedChild.date_of_birth);
    let closest = allAges[0];
    for (const a of allAges) {
      if (childAge >= a) closest = a;
      else break;
    }
    return closest;
  }, [age, selectedChild?.date_of_birth, allAges]);

  const [selectedAge, setSelectedAge] = useState(defaultAge);
  const [milestoneResponses, setMilestoneResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const hasChanges = useRef(false);
  const [scrollViewRef, setScrollViewRef] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewPadding = 16;
  const categoryInfo = MILESTONE_CATEGORIES.find(cat => cat.id === category);

  const nextCategory = useMemo(() => {
    const currentIndex = MILESTONE_CATEGORIES.findIndex(cat => cat.id === category);
    if (currentIndex >= 0 && currentIndex < MILESTONE_CATEGORIES.length - 1) {
      return MILESTONE_CATEGORIES[currentIndex + 1];
    }
    return null;
  }, [category]);
  // Get milestones using the helper function and map to string array if objects
  const milestones = useMemo(() => {
    const data = getMilestonesForAge(selectedAge);
    const categoryData = data?.[category] || [];
    // Handle both string arrays (legacy) and object arrays (new WHO)
    return categoryData.map(m => typeof m === 'string' ? m : m.milestone);
  }, [selectedAge, category]);

  // Determine the child's current "active" milestone bucket
  const currentMilestoneBucket = useMemo(() => {
    if (!selectedChild?.date_of_birth) return null;
    const childAge = calculateAgeHelper(selectedChild.date_of_birth);
    let bucket = null;
    for (const a of allAges) {
      if (childAge >= a) bucket = a;
      else break;
    }
    return bucket;
  }, [selectedChild?.date_of_birth, allAges]);

  const actualChildAge = useMemo(() => {
    if (!selectedChild?.date_of_birth) return 0;
    return calculateAgeHelper(selectedChild.date_of_birth);
  }, [selectedChild?.date_of_birth]);

  const isReadOnly = useMemo(() => {
    // Newborns (0 months) cannot fill any milestones (first start at 2 months)
    if (actualChildAge === 0) return true;
    
    // Only current milestone bucket is editable
    return selectedAge !== currentMilestoneBucket;
  }, [selectedAge, currentMilestoneBucket, actualChildAge]);

  // Load saved milestone responses when component mounts or age/category changes
  useEffect(() => {
    // Clear responses immediately when age or category changes
    hasChanges.current = false;
    setMilestoneResponses({});

    const loadMilestoneResponses = async () => {
      if (!selectedChild?.id) return;

      setLoading(true);
      try {
        const data = await milestoneService.getMilestoneResponses(
          selectedChild.id,
          selectedAge,
          category
        );
        setMilestoneResponses(data?.responses || {});
      } catch (error) {
        console.error('Error loading milestone responses:', error);
        setMilestoneResponses({});
      } finally {
        setLoading(false);
      }
    };

    loadMilestoneResponses();
  }, [selectedChild?.id, selectedAge, category]);

  const handleResponse = (milestoneIndex, response) => {
    if (isReadOnly) return;

    const updatedResponses = {
      ...milestoneResponses,
      [milestoneIndex]: response
    };

    setMilestoneResponses(updatedResponses);

    // Save milestone responses immediately (offline-first local write + background sync queue)
    if (selectedChild?.id && (selectedAge || selectedAge === 0) && category) {
      milestoneService.saveMilestoneResponses(
        selectedChild.id,
        selectedAge,
        category,
        updatedResponses
      ).catch(error => {
        console.error('Error triggered during offline-first saveMilestoneResponses:', error);
      });
    }

    // Check if all milestones are answered - add completion notification (silent, no modal)
    if (Object.keys(updatedResponses).length === milestones.length && Object.keys(milestoneResponses).length < milestones.length) {
      addNotification({
        category: 'milestones',
        title: 'Checklist Completed',
        message: `You've completed the ${selectedAge}-month milestone checklist for ${categoryInfo?.title || 'this category'}.`,
      });
    }
  };

  const getResponseCounts = () => {
    const responses = Object.values(milestoneResponses);
    return {
      yes: responses.filter(r => r === 'yes').length,
      no: responses.filter(r => r === 'no').length,
      unsure: responses.filter(r => r === 'unsure').length,
      answered: responses.length, // How many questions have been answered
      total: milestones.length // Total questions available
    };
  };

  const { yes, no, unsure, answered, total } = getResponseCounts();

  const scrollToAge = (direction) => {
    if (!scrollViewRef) return;

    const scrollAmount = containerWidth * 0.6;
    const newPosition = direction === 'next'
      ? Math.min(scrollPosition + scrollAmount, contentWidth - containerWidth + scrollViewPadding)
      : Math.max(scrollPosition - scrollAmount, 0);

    scrollViewRef.scrollTo({ x: newPosition, animated: true });
    setScrollPosition(newPosition);
  };

  // Auto-scroll to selected age on load
  useEffect(() => {
    if (scrollViewRef && containerWidth > 0 && contentWidth > 0) {
      const ageIndex = allAges.indexOf(selectedAge);
      if (ageIndex !== -1) {
        const itemWidth = contentWidth / allAges.length;
        const scrollX = Math.max(0, (ageIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2));
        scrollViewRef.scrollTo({ x: scrollX, animated: true });
      }
    }
  }, [scrollViewRef, containerWidth, contentWidth, selectedAge, allAges]);



  const completedCount = Object.values(milestoneResponses).filter(Boolean).length;
  const totalCount = milestones.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Get the category title for the header
  const categoryTitle = categoryInfo?.title || 'Milestones';

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
      <SafeHeader
        title={categoryTitle}
        showBack={true}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.lg }}
      >
        <View style={[styles.infoCard, { backgroundColor: colorScheme.surface }]}>
          <View style={styles.ageSelectorContainer}>
            <TouchableOpacity
              style={[styles.arrowButton, { backgroundColor: colorScheme.primaryLight }, !scrollPosition && styles.arrowButtonDisabled]}
              onPress={() => scrollToAge('prev')}
              disabled={!scrollPosition}
            >
              <MaterialIcons name="chevron-left" size={24} color={!scrollPosition ? colorScheme.textTertiary : colorScheme.primary} />
            </TouchableOpacity>

            <View
              style={styles.ageScrollContainer}
              onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            >
              <ScrollView
                ref={setScrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ageScrollContent}
                onContentSizeChange={(w) => setContentWidth(w)}
                onScroll={(e) => setScrollPosition(e.nativeEvent.contentOffset.x)}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={containerWidth * 0.4} // Adjust based on your item width
                snapToAlignment="center"
              >
                {allAges.map((ageVal) => {
                  const ageOption = MILESTONE_AGES.find(a => a.value === ageVal);
                  return (
                    <TouchableOpacity
                      key={ageVal}
                      style={[
                        styles.agePill,
                        selectedAge === ageVal
                          ? { backgroundColor: colorScheme.primary }
                          : isDark
                            ? { backgroundColor: colorScheme.border }
                            : { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#000000' },
                      ]}
                      onPress={() => {
                        setSelectedAge(ageVal);
                      }}
                    >
                      <Text style={[styles.agePillText, { color: selectedAge === ageVal ? '#FFFFFF' : colorScheme.textPrimary }]}>
                        {ageOption?.label ?? `${ageVal} months`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[
                styles.arrowButton,
                { backgroundColor: colorScheme.primaryLight },
                scrollPosition >= contentWidth - containerWidth - 10 && styles.arrowButtonDisabled
              ]}
              onPress={() => scrollToAge('next')}
              disabled={scrollPosition >= contentWidth - containerWidth - 10}
            >
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={scrollPosition >= contentWidth - containerWidth - 10 ? colorScheme.textTertiary : colorScheme.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.milestonesHeader}>
            <Text style={[styles.milestonesTitle, { color: colorScheme.textPrimary }]}>
              {milestones.length} milestones · {MILESTONE_AGES.find(a => a.value === selectedAge)?.label ?? `${selectedAge} months`}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBackground, isDark ? { backgroundColor: colorScheme.border } : { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#000000' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: progressPercentage === 100 ? colorScheme.success : colorScheme.primary
                  }
                ]}
              />
            </View>
            <View style={styles.responseCounts}>
              <View style={styles.responseCountItem}>
                <Text style={[styles.responseCountText, { color: colorScheme.success }]}>{yes} Yes</Text>
              </View>
              <View style={styles.responseCountItem}>
                <Text style={[styles.responseCountText, { color: colorScheme.error }]}>{no} No</Text>
              </View>
              <View style={styles.responseCountItem}>
                <Text style={[styles.responseCountText, { color: colorScheme.warning }]}>{unsure} Unsure</Text>
              </View>
            </View>

            {/* Warning banner if yes responses are concerning - show only when all answered */}
            {answered === total && total > 0 && (yes / total) < 0.5 && (
              <View style={[styles.warningBanner, { backgroundColor: `${colorScheme.warning}15`, borderColor: colorScheme.warning }]}>
                <MaterialIcons name="warning" size={20} color={colorScheme.warning} />
                <Text style={[styles.warningText, { color: colorScheme.warning }]}>
                  Less than half of milestones achieved. Consider booking an appointment.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Read-Only Restriction Banner */}
        {isReadOnly && (
          <View style={[styles.readOnlyBanner, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colorScheme.border }]}>
            <MaterialIcons name="lock-outline" size={20} color={colorScheme.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.readOnlyTitle, { color: colorScheme.textPrimary }]}>
                {actualChildAge === 0 ? "Tracking starts at 2 months" : "View mode only"}
              </Text>
              <Text style={[styles.readOnlySub, { color: colorScheme.textSecondary }]}>
                {actualChildAge === 0 
                  ? "Milestone checks begin at 2 months. Your child is still a newborn!" 
                  : selectedAge < currentMilestoneBucket 
                    ? `This is a past milestone age. Edits are disabled.`
                    : `This checklist is for the future. You can start this at ${selectedAge} months.`}
              </Text>
            </View>
          </View>
        )}

        {milestones.map((milestone, index) => {
          const currentResponse = milestoneResponses[index];
          return (
            <View key={index} style={[styles.milestoneItem, { backgroundColor: colorScheme.surface }]}>
              <Text style={[styles.milestoneQuestion, { color: colorScheme.textSecondary }]}>
                Does your child: <Text style={[styles.milestoneText, { color: colorScheme.primary }]}>{milestone}?</Text>
              </Text>
              <View style={styles.responseButtons}>
                <TouchableOpacity
                  style={[
                    styles.responseButton,
                    {
                      backgroundColor: currentResponse === 'yes' ? colorScheme.success : `${colorScheme.success}20`,
                      borderColor: currentResponse === 'yes' ? colorScheme.success : `${colorScheme.success}50`
                    }
                  ]}
                  onPress={() => handleResponse(index, 'yes')}
                  disabled={isReadOnly}
                >
                  <Text style={[
                    styles.responseButtonText,
                    {
                      color: currentResponse === 'yes' ? '#FFFFFF' : colorScheme.success,
                      fontWeight: currentResponse === 'yes' ? '700' : '500',
                      opacity: isReadOnly && currentResponse !== 'yes' ? 0.3 : 1
                    }
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.responseButton,
                    {
                      backgroundColor: currentResponse === 'no' ? colorScheme.error : `${colorScheme.error}20`,
                      borderColor: currentResponse === 'no' ? colorScheme.error : `${colorScheme.error}50`
                    }
                  ]}
                  onPress={() => handleResponse(index, 'no')}
                  disabled={isReadOnly}
                >
                  <Text style={[
                    styles.responseButtonText,
                    {
                      color: currentResponse === 'no' ? '#FFFFFF' : colorScheme.error,
                      fontWeight: currentResponse === 'no' ? '700' : '500',
                      opacity: isReadOnly && currentResponse !== 'no' ? 0.3 : 1
                    }
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.responseButton,
                    {
                      backgroundColor: currentResponse === 'unsure' ? colorScheme.warning : `${colorScheme.warning}20`,
                      borderColor: currentResponse === 'unsure' ? colorScheme.warning : `${colorScheme.warning}50`
                    }
                  ]}
                  onPress={() => handleResponse(index, 'unsure')}
                  disabled={isReadOnly}
                >
                  <Text style={[
                    styles.responseButtonText,
                    {
                      color: currentResponse === 'unsure' ? '#FFFFFF' : colorScheme.warning,
                      fontWeight: currentResponse === 'unsure' ? '700' : '500',
                      opacity: isReadOnly && currentResponse !== 'unsure' ? 0.3 : 1
                    }
                  ]}>
                    Not Sure
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {nextCategory ? (
          <TouchableOpacity
            style={[styles.nextCategoryButton, { backgroundColor: colorScheme.primary }]}
            onPress={() => router.replace(`/dashboard/milestone-checklist/${nextCategory.id}?age=${selectedAge}`)}
          >
            <Text style={styles.nextCategoryButtonText}>Continue to {nextCategory.title}</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ marginVertical: Spacing.md, paddingHorizontal: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize.sm, color: colorScheme.textSecondary, textAlign: 'center', marginBottom: Spacing.sm, fontStyle: 'italic' }}>
              This is the final category for this age group. Click 'Finish Checklist' below to save responses and view your overall milestones report.
            </Text>
            <TouchableOpacity
              style={[styles.nextCategoryButton, { backgroundColor: colorScheme.success }]}
              onPress={() => router.push('/dashboard/milestone-checklist')}
            >
              <Text style={styles.nextCategoryButtonText}>Finish Checklist</Text>
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
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
  infoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  ageSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    width: '100%',
  },
  ageScrollContainer: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  ageScrollContent: {
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  agePill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xxl,
    marginHorizontal: Spacing.xs,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agePillText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  arrowButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.xxl,
  },
  arrowButtonDisabled: {
    opacity: 0.5,
  },
  milestonesHeader: {
    marginTop: Spacing.sm,
  },
  milestonesTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  milestoneItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  milestoneQuestion: {
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  milestoneText: {
    fontWeight: Typography.fontWeight.medium,
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  responseButton: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
    borderWidth: 1.5,
  },
  responseButtonText: {
    fontSize: Typography.fontSize.sm,
  },
  responseCounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  responseCountItem: {
    flex: 1,
    alignItems: 'center',
  },
  responseCountText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  nextCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  nextCategoryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    flexShrink: 1,
    textAlign: 'center',
  },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
    borderStyle: 'dashed',
  },
  readOnlyTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  readOnlySub: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },
});
