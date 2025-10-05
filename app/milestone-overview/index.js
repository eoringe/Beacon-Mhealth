import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { MILESTONE_CATEGORIES } from '../../constants/milestones';

export default function MilestoneOverview() {
  const router = useRouter();
  const { age } = useLocalSearchParams();
  const selectedAge = age ? parseInt(age) : 12; // Default to 12 months if no age provided

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.ageSelector}>
          <Text style={styles.ageLabel}>Age: {selectedAge} months</Text>
        </View>

        {MILESTONE_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => router.push(`/milestone-overview/${category.id}?age=${selectedAge}`)}
          >
            <View style={styles.categoryIcon}>
              <MaterialIcons name={category.icon} size={28} color="#2E5BFF" />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.milestoneCount}>
                View developmental milestones
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  ageSelector: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  milestoneCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
