import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { MILESTONE_CATEGORIES, MILESTONE_DATA } from '../../constants/milestones';
import { SafeHeader } from '@/components/SafeHeader';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';

export default function MilestoneCategory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { category, age } = useLocalSearchParams();
  const [selectedAge, setSelectedAge] = useState(age ? parseInt(age) : 12);
  const [milestoneResponses, setMilestoneResponses] = useState({});
  const [scrollViewRef, setScrollViewRef] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewPadding = 16;
  const allAges = [2, 3, 5, 6, 10, 12, 15];

  const categoryInfo = MILESTONE_CATEGORIES.find(cat => cat.id === category);
  const milestones = MILESTONE_DATA[selectedAge]?.[category] || [];

  // Update the URL when selectedAge changes
  React.useEffect(() => {
    router.setParams({ age: selectedAge.toString() });
  }, [selectedAge, router]);

  const handleResponse = (milestoneIndex, response) => {
    setMilestoneResponses(prev => ({
      ...prev,
      [milestoneIndex]: response
    }));
  };

  const getResponseCounts = () => {
    const responses = Object.values(milestoneResponses);
    return {
      yes: responses.filter(r => r === 'yes').length,
      no: responses.filter(r => r === 'no').length,
      unsure: responses.filter(r => r === 'unsure').length,
      total: milestones.length
    };
  };

  const { yes, no, unsure, total } = getResponseCounts();

  const scrollToAge = (direction) => {
    if (!scrollViewRef) return;

    const scrollAmount = containerWidth * 0.6;
    const newPosition = direction === 'next'
      ? Math.min(scrollPosition + scrollAmount, contentWidth - containerWidth + scrollViewPadding)
      : Math.max(scrollPosition - scrollAmount, 0);

    scrollViewRef.scrollTo({ x: newPosition, animated: true });
    setScrollPosition(newPosition);
  };

  // Update the selected age when URL params change
  React.useEffect(() => {
    if (age && parseInt(age) !== selectedAge) {
      setSelectedAge(parseInt(age));
    }
  }, [age, selectedAge]);

  const completedCount = Object.values(milestoneResponses).filter(Boolean).length;
  const totalCount = milestones.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Get the category title for the header
  const categoryTitle = categoryInfo?.title || 'Milestones';

  return (
    <View style={styles.container}>
      <SafeHeader
        title={categoryTitle}
        showBack={true}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.lg }}
      >
        <View style={styles.infoCard}>
          <View style={styles.ageSelectorContainer}>
            <TouchableOpacity
              style={[styles.arrowButton, !scrollPosition && styles.arrowButtonDisabled]}
              onPress={() => scrollToAge('prev')}
              disabled={!scrollPosition}
            >
              <MaterialIcons name="chevron-left" size={24} color={!scrollPosition ? '#CCCCCC' : '#2E5BFF'} />
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
                      selectedAge === age && styles.agePillActive,
                    ]}
                    onPress={() => {
                      setSelectedAge(age);
                    }}
                  >
                    <Text style={[
                      styles.agePillText,
                      selectedAge === age && styles.agePillTextActive,
                    ]}>
                      {age === 12 ? '1 year' : `${age} ${age === 1 ? 'month' : 'months'}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[
                styles.arrowButton,
                scrollPosition >= contentWidth - containerWidth - 10 && styles.arrowButtonDisabled
              ]}
              onPress={() => scrollToAge('next')}
              disabled={scrollPosition >= contentWidth - containerWidth - 10}
            >
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={scrollPosition >= contentWidth - containerWidth - 10 ? '#CCCCCC' : '#2E5BFF'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.milestoneCountContainer}>
            <Text style={styles.infoText}>
              {total} milestones for {selectedAge} {selectedAge === 1 ? 'month' : 'months'} old
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: progressPercentage === 100 ? '#4CAF50' : '#2E5BFF'
                  }
                ]}
              />
            </View>
            <View style={styles.responseCounts}>
              <View style={styles.responseCountItem}>
                <Text style={[styles.responseCountText, { color: '#4CAF50' }]}>{yes} Yes</Text>
              </View>
              <View style={styles.responseCountItem}>
                <Text style={[styles.responseCountText, { color: '#FF5252' }]}>{no} No</Text>
              </View>
              <View style={styles.responseCountItem}>
                <Text style={[styles.responseCountText, { color: '#FFA000' }]}>{unsure} Unsure</Text>
              </View>
            </View>
          </View>
        </View>

        {milestones.map((milestone, index) => {
          const currentResponse = milestoneResponses[index];
          return (
            <View key={index} style={styles.milestoneItem}>
              <Text style={styles.milestoneQuestion}>
                Does your child: <Text style={styles.milestoneText}>{milestone}?</Text>
              </Text>
              <View style={styles.responseButtons}>
                <TouchableOpacity
                  style={[
                    styles.responseButton,
                    styles.yesButton,
                    currentResponse === 'yes' && styles.responseButtonActive
                  ]}
                  onPress={() => handleResponse(index, 'yes')}
                >
                  <Text style={[
                    styles.responseButtonText,
                    currentResponse === 'yes' && styles.responseButtonTextActive
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.responseButton,
                    styles.noButton,
                    currentResponse === 'no' && styles.responseButtonActive
                  ]}
                  onPress={() => handleResponse(index, 'no')}
                >
                  <Text style={[
                    styles.responseButtonText,
                    currentResponse === 'no' && styles.responseButtonTextActive
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.responseButton,
                    styles.unsureButton,
                    currentResponse === 'unsure' && styles.responseButtonActive
                  ]}
                  onPress={() => handleResponse(index, 'unsure')}
                >
                  <Text style={[
                    styles.responseButtonText,
                    currentResponse === 'unsure' && styles.responseButtonTextActive
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
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  ageSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  ageScrollContainer: {
    flex: 1,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  ageScrollContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  agePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agePillActive: {
    backgroundColor: '#2E5BFF',
  },
  agePillText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  agePillTextActive: {
    color: '#FFFFFF',
  },
  arrowButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F5FF',
  },
  arrowButtonDisabled: {
    opacity: 0.5,
  },
  milestoneCountContainer: {
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E5BFF',
    textAlign: 'right',
  },
  milestoneItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2E5BFF',
    borderColor: '#2E5BFF',
  },
  milestoneQuestion: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 12,
    lineHeight: 22,
  },
  milestoneText: {
    fontWeight: '500',
    color: '#2E5BFF',
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  responseButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  yesButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  noButton: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  unsureButton: {
    backgroundColor: 'rgba(255, 160, 0, 0.1)',
    borderColor: 'rgba(255, 160, 0, 0.3)',
  },
  responseButtonActive: {
    backgroundColor: 'transparent',
  },
  responseButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  responseButtonTextActive: {
    fontWeight: '600',
  },
  responseCounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  responseCountItem: {
    flex: 1,
    alignItems: 'center',
  },
  responseCountText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
