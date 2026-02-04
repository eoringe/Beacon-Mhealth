import React, { useState, useEffect, useMemo } from 'react';
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
  const { colorScheme } = useTheme();
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
  const [saving, setSaving] = useState(false);
  const [scrollViewRef, setScrollViewRef] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewPadding = 16;

  const categoryInfo = MILESTONE_CATEGORIES.find(cat => cat.id === category);

  // Get milestones using the helper function and map to string array if objects
  const milestones = useMemo(() => {
    const data = getMilestonesForAge(selectedAge);
    const categoryData = data?.[category] || [];
    // Handle both string arrays (legacy) and object arrays (new WHO)
    return categoryData.map(m => typeof m === 'string' ? m : m.milestone);
  }, [selectedAge, category]);

  // Load saved milestone responses when component mounts or age/category changes
  useEffect(() => {
    // Clear responses immediately when age or category changes
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
        setMilestoneResponses(data.responses || {});
      } catch (error) {
        console.error('Error loading milestone responses:', error);
        setMilestoneResponses({});
      } finally {
        setLoading(false);
      }
    };

    loadMilestoneResponses();
  }, [selectedChild?.id, selectedAge, category]);

  // Save milestone responses to database whenever they change
  useEffect(() => {
    const saveMilestoneResponses = async () => {
      // Validate all required parameters before attempting to save
      if (!selectedChild?.id) {
        console.log('[Milestone] No child selected, skipping save');
        return;
      }
      if (!selectedAge && selectedAge !== 0) {
        console.log('[Milestone] No age selected, skipping save');
        return;
      }
      if (!category) {
        console.log('[Milestone] No category selected, skipping save');
        return;
      }
      if (!milestoneResponses || Object.keys(milestoneResponses).length === 0) {
        console.log('[Milestone] No responses to save, skipping');
        return;
      }

      setSaving(true);
      try {
        await milestoneService.saveMilestoneResponses(
          selectedChild.id,
          selectedAge,
          category,
          milestoneResponses
        );
        // Note: Milestone progress warning is now shown on Dashboard instead
      } catch (error) {
        console.error('Error saving milestone responses:', error);
      } finally {
        setSaving(false);
      }
    };

    // Debounce saving to avoid too many API calls
    const timeoutId = setTimeout(saveMilestoneResponses, 500);
    return () => clearTimeout(timeoutId);
  }, [milestoneResponses, selectedChild?.id, selectedAge, category]);

  const handleResponse = (milestoneIndex, response) => {
    const updatedResponses = {
      ...milestoneResponses,
      [milestoneIndex]: response
    };

    setMilestoneResponses(updatedResponses);

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
                {allAges.map((age) => (
                  <TouchableOpacity
                    key={age}
                    style={[
                      styles.agePill,
                      { backgroundColor: colorScheme.border },
                      selectedAge === age && { backgroundColor: colorScheme.primary },
                    ]}
                    onPress={() => {
                      setSelectedAge(age);
                    }}
                  >
                    <Text style={[styles.agePillText, { color: selectedAge === age ? '#FFFFFF' : colorScheme.textPrimary }]}>
                      {age === 12 ? '1 year' : `${age} ${age === 1 ? 'month' : 'months'}`}
                    </Text>
                  </TouchableOpacity>
                ))}
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
              {milestones.length} milestones for {selectedAge} month{selectedAge > 1 ? 's' : ''} old
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBackground, { backgroundColor: colorScheme.border }]}>
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
                >
                  <Text style={[
                    styles.responseButtonText,
                    {
                      color: currentResponse === 'yes' ? '#FFFFFF' : colorScheme.success,
                      fontWeight: currentResponse === 'yes' ? '700' : '500'
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
                >
                  <Text style={[
                    styles.responseButtonText,
                    {
                      color: currentResponse === 'no' ? '#FFFFFF' : colorScheme.error,
                      fontWeight: currentResponse === 'no' ? '700' : '500'
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
                >
                  <Text style={[
                    styles.responseButtonText,
                    {
                      color: currentResponse === 'unsure' ? '#FFFFFF' : colorScheme.warning,
                      fontWeight: currentResponse === 'unsure' ? '700' : '500'
                    }
                  ]}>
                    Not Sure
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
  // Modal styles
});
