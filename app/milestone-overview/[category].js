import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
  MILESTONE_CATEGORIES,
  MILESTONE_AGES,
  getMilestonesForAge
} from '../../constants/milestones';
import { SafeHeader } from '@/components/SafeHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';



export default function MilestoneOverviewCategory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const { category, age } = useLocalSearchParams();

  const allAges = useMemo(() => MILESTONE_AGES.map(a => a.value), []);

  const [selectedAge, setSelectedAge] = useState(() => {
    if (age) {
      const parsedAge = parseInt(age);
      // Find closest valid age if exact match not found
      let closest = allAges[0];
      for (const a of allAges) {
        if (parsedAge >= a) closest = a;
        else break;
      }
      return closest;
    }
    return 12;
  });

  const [scrollViewRef, setScrollViewRef] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Get the category title for the header
  const categoryInfo = MILESTONE_CATEGORIES.find(cat => cat.id === category);
  const categoryTitle = categoryInfo?.title || 'Milestone Overview';

  const milestones = useMemo(() => {
    const data = getMilestonesForAge(selectedAge);
    const categoryData = data?.[category] || [];
    // Support both string array and object array (new WHO format)
    return categoryData.map(m => typeof m === 'string' ? m : m.milestone);
  }, [selectedAge, category]);

  const scrollToAge = (direction) => {
    if (!scrollViewRef) return;

    const scrollAmount = containerWidth * 0.6;
    const newPosition = direction === 'next'
      ? Math.min(scrollPosition + scrollAmount, contentWidth - containerWidth + 16)
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



  return (
    <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
      <SafeHeader
        title={categoryTitle}
        showBack={true}
      />

      <View style={[styles.ageSelectorContainer, { backgroundColor: colorScheme.surface, borderBottomWidth: 1, borderBottomColor: colorScheme.border }]}>
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
            snapToInterval={containerWidth * 0.4}
            snapToAlignment="center"
          >
            {allAges.map((age) => (
              <TouchableOpacity
                key={age}
                style={[
                  styles.agePill,
                  { backgroundColor: colorScheme.background },
                  selectedAge === age && { backgroundColor: colorScheme.primary },
                ]}
                onPress={() => {
                  setSelectedAge(age);
                }}
              >
                <Text
                  style={[
                    styles.agePillText,
                    { color: colorScheme.textSecondary },
                    selectedAge === age && { color: '#FFFFFF' },
                  ]}
                >
                  {age === 12 ? '1 yr' : `${age} mo`}
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.lg }}
      >
        <View style={[styles.card, { backgroundColor: colorScheme.surface }]}>
          <Text style={[styles.sectionTitle, { color: colorScheme.textPrimary }]}>Developmental Milestones</Text>
          <Text style={[styles.sectionSubtitle, { color: colorScheme.textSecondary }]}>
            These are the typical skills children develop around {selectedAge} months of age
          </Text>

          {milestones.length > 0 ? (
            <View style={styles.milestonesList}>
              {milestones.map((milestone, index) => (
                <View key={index} style={styles.milestoneItem}>
                  <View style={styles.milestoneIcon}>
                    <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                  </View>
                  <Text style={[styles.milestoneText, { color: colorScheme.textPrimary }]}>{milestone}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="info-outline" size={48} color="#A0A0A0" />
              <Text style={[styles.emptyStateText, { color: colorScheme.textSecondary }]}>
                No milestone data available for {selectedAge} months
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.infoBox, { backgroundColor: colorScheme.primaryLight }]}>
          <MaterialIcons name="info" size={20} color={colorScheme.primary} style={styles.infoIcon} />
          <Text style={[styles.infoText, { color: colorScheme.textSecondary }]}>
            Remember that every child develops at their own pace. If you have concerns about your child's development, please consult with a healthcare professional.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  ageSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
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
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
  },
  milestonesList: {
    marginTop: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  milestoneIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  milestoneText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#2C3E50',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EBF0FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#2C3E50',
  },
});
