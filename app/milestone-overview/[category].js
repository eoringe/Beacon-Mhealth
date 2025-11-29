import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { MILESTONE_CATEGORIES, MILESTONE_DATA } from '../../constants/milestones';
import { SafeHeader } from '@/components/SafeHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function MilestoneOverviewCategory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const { category, age } = useLocalSearchParams();
  const [selectedAge, setSelectedAge] = useState(age ? parseInt(age) : 12);
  const [activeTab, setActiveTab] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const allAges = [2, 3, 5, 6, 10, 12, 15];
  const categoryInfo = MILESTONE_CATEGORIES.find(cat => cat.id === category);
  const milestones = MILESTONE_DATA[selectedAge]?.[category] || [];

  const scrollToAge = (index) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * (width * 0.6),
        animated: true,
      });
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const inputRange = allAges.map((_, i) => i * (width * 0.6));
  const translateX = scrollX.interpolate({
    inputRange,
    outputRange: allAges.map((_, i) => i * (width * 0.6 / allAges.length)),
  });

  // Get the category title for the header
  const categoryTitle = categoryInfo?.title || 'Milestone Overview';

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
      <SafeHeader
        title={categoryTitle}
        showBack={true}
      />

      <View style={[styles.ageScrollContainer, { backgroundColor: colorScheme.background, borderBottomColor: colorScheme.border }]}>
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.ageScrollContent}
          snapToInterval={width * 0.6}
          decelerationRate="fast"
        >
          {allAges.map((age) => (
            <TouchableOpacity
              key={age}
              style={[
                styles.ageButton,
                { backgroundColor: colorScheme.surface },
                selectedAge === age && { backgroundColor: colorScheme.primary },
              ]}
              onPress={() => {
                setSelectedAge(age);
                scrollToAge(allAges.indexOf(age));
              }}
            >
              <Text
                style={[
                  styles.ageButtonText,
                  { color: colorScheme.textSecondary },
                  selectedAge === age && { color: '#FFFFFF' },
                ]}
              >
                {age} months
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.ScrollView>
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
  ageScrollContainer: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  ageScrollContent: {
    paddingHorizontal: 16,
  },
  ageButton: {
    width: width * 0.55,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageButtonSelected: {
    backgroundColor: '#2E5BFF',
  },
  ageButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  ageButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
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
