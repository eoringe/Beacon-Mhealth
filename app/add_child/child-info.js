import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { MILESTONE_AGES, MILESTONE_DATA } from '../../constants/milestones';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChildInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Define child data
  const childData = {
    name: 'Your Child',
    ageMonths: 12
  };

  const handleSaveChild = () => {
    // In a real app, you would save the child data to your database/state here
    console.log('Child data:', childData);

    // Navigate to the milestone overview with the child's age
    router.push({
      pathname: '/milestone-overview',
      params: { age: selectedAge }
    });
  };

  const [selectedAge, setSelectedAge] = useState(12);
  const scrollViewRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const containerWidth = SCREEN_WIDTH - 48; // Account for padding

  // Age options for slider - using predefined ages from constants
  const allAges = [2, 3, 5, 6, 10, 12, 15, 18, 24, 30, 36, 48, 60, 72];
  const scrollViewPadding = 16;

  const scrollToAge = (direction) => {
    if (!scrollViewRef.current) return;

    const scrollAmount = containerWidth * 0.6;
    const newPosition = direction === 'next'
      ? Math.min(scrollPosition + scrollAmount, contentWidth - containerWidth + scrollViewPadding)
      : Math.max(scrollPosition - scrollAmount, 0);

    scrollViewRef.current.scrollTo({ x: newPosition, animated: true });
    setScrollPosition(newPosition);
  };

  const getMilestoneCount = (age) => {
    // Return a default count or implement your logic here
    return 0;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.push('/(tabs)/dashboard')}
          >
            <MaterialIcons name="home" size={24} color="#333333" />
          </TouchableOpacity>

          {/* Child Avatar and Name */}
          <View style={styles.childSection}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="child-care" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.childName}>{childData.name}</Text>
            <Text style={styles.childAge}>is {childData.ageMonths} months old!</Text>
          </View>

          {/* Age Slider */}
          <View style={styles.ageSliderSection}>
            <TouchableOpacity
              style={[styles.arrowButton, !scrollPosition && styles.arrowButtonDisabled]}
              onPress={() => scrollToAge('prev')}
              disabled={!scrollPosition}
            >
              <MaterialIcons name="chevron-left" size={24} color={!scrollPosition ? '#CCCCCC' : '#2E5BFF'} />
            </TouchableOpacity>

            <View style={styles.ageScrollContainer}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ageScrollContent}
                onContentSizeChange={(w) => setContentWidth(w)}
                onScroll={(e) => setScrollPosition(e.nativeEvent.contentOffset.x)}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={containerWidth * 0.3}
                snapToAlignment="center"
              >
                {allAges.map((age) => (
                  <TouchableOpacity
                    key={age}
                    style={[
                      styles.agePill,
                      selectedAge === age && styles.agePillActive,
                    ]}
                    onPress={() => setSelectedAge(age)}
                  >
                    <Text style={[
                      styles.agePillText,
                      selectedAge === age && styles.agePillTextActive,
                    ]}>
                      {age === 12 ? '1 year' : `${age} ${age === 1 ? 'month' : 'months'}`}
                    </Text>
                    <Text style={[
                      styles.milestoneCount,
                      selectedAge === age && styles.milestoneCountActive
                    ]}>
                      {getMilestoneCount(age)} milestones
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

          {/* Milestone Checklist */}
          <TouchableOpacity
            style={styles.milestoneCard}
            onPress={() => router.push(`/milestone-checklist?age=${selectedAge}`)}
          >
            <View style={styles.milestoneHeader}>
              <Text style={styles.milestoneTitle}>Milestone Checker</Text>
              <MaterialIcons name="chevron-right" size={24} color="#333333" />
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '0%' }]} />
              </View>
              <Text style={styles.progressText}>0/10 Milestones completed</Text>
            </View>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push({
                pathname: '/milestone-overview',
                params: { age: selectedAge }
              })}
            >
              <View style={styles.actionIconContainer}>
                <MaterialIcons name="format-list-bulleted" size={28} color="#2E5BFF" />
              </View>
              <Text style={styles.actionText}>Milestone{'\n'}Overview</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/appointments/book')}
            >
              <View style={styles.actionIconContainer}>
                <MaterialIcons name="calendar-today" size={28} color="#2E5BFF" />
              </View>
              <Text style={styles.actionText}>Book{'\n'}Appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/early-action')}
            >
              <View style={styles.actionIconContainer}>
                <MaterialIcons name="error-outline" size={28} color="#FF5252" />
              </View>
              <Text style={styles.actionText}>When to{'\n'}act early</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  homeButton: {
    padding: 8,
  },
  childSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2E5BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  childName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  childAge: {
    fontSize: 16,
    color: '#666666',
  },
  ageSliderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  agePillActive: {
    backgroundColor: '#2E5BFF',
  },
  agePillText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
    marginBottom: 4,
  },
  agePillTextActive: {
    color: '#FFFFFF',
  },
  milestoneCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  milestoneCountActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  arrowButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F5FF',
  },
  arrowButtonDisabled: {
    opacity: 0.5,
  },
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
});