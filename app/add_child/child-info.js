import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function ChildInfoScreen() {
  const router = useRouter();
  
  // Static child data - 11 months old
  const childData = {
    name: 'Noella',
    ageMonths: 11,
    gender: 'Girl'
  };

  const [selectedAge, setSelectedAge] = useState(11);

  // Age options for slider
  const ageOptions = [
    { label: '5 mo', value: 5 },
    { label: '1 year', value: 12 },
    { label: '15 mo', value: 15 }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.homeButton}
              onPress={() => router.push('/(tabs)/dashboard')}
            >
              <MaterialIcons name="home" size={24} color="#333333" />
            </TouchableOpacity>
          </View>

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
              style={styles.arrowButton}
              onPress={() => selectedAge > 5 && setSelectedAge(selectedAge - 1)}
            >
              <MaterialIcons name="chevron-left" size={24} color="#333333" />
            </TouchableOpacity>

            <View style={styles.ageOptionsContainer}>
              {ageOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.ageOption,
                    selectedAge === option.value && styles.ageOptionActive
                  ]}
                  onPress={() => setSelectedAge(option.value)}
                >
                  <Text style={[
                    styles.ageOptionText,
                    selectedAge === option.value && styles.ageOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.arrowButton}
              onPress={() => selectedAge < 15 && setSelectedAge(selectedAge + 1)}
            >
              <MaterialIcons name="chevron-right" size={24} color="#333333" />
            </TouchableOpacity>
          </View>

          {/* Milestone Checklist */}
          <TouchableOpacity style={styles.milestoneCard}>
            <View style={styles.milestoneHeader}>
              <Text style={styles.milestoneTitle}>Milestone Checklist</Text>
              <MaterialIcons name="chevron-right" size={24} color="#333333" />
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '0%' }]} />
              </View>
              <Text style={styles.progressText}>10/10 Milestones prepared</Text>
            </View>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/milestones/overview')}
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
    </SafeAreaView>
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
    justifyContent: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  arrowButton: {
    padding: 8,
  },
  ageOptionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
  },
  ageOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    minWidth: 60,
    alignItems: 'center',
  },
  ageOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2E5BFF',
  },
  ageOptionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  ageOptionTextActive: {
    color: '#2E5BFF',
    fontWeight: '600',
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