import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function AddChildScreen() {
  const router = useRouter();

  const [childName, setChildName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [wasPremature, setWasPremature] = useState(null);
  const [gender, setGender] = useState(null);

  const handleAddChild = () => {
    router.push('/add_child/child-info');
  };

  const handleDone = () => {
    router.push('/(tabs)/dashboard');
  };

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

          <Text style={styles.title}>Add a Child</Text>

          {/* Photo Upload */}
          <View style={styles.photoSection}>
            <View style={styles.photoCircle}>
              <MaterialIcons name="add" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.photoText}>Add a photo</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={childName}
              onChangeText={setChildName}
              placeholder="Child's Name*"
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="Date of Birth*"
              placeholderTextColor="#999"
            />

            {/* Premature Question */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>
                Was your child born pre-maturely?
              </Text>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setWasPremature(true)}
                >
                  <View style={styles.radioCircle}>
                    {wasPremature === true && <View style={styles.radioSelected} />}
                  </View>
                  <Text style={styles.radioLabel}>Yes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setWasPremature(false)}
                >
                  <View style={styles.radioCircle}>
                    {wasPremature === false && <View style={styles.radioSelected} />}
                  </View>
                  <Text style={styles.radioLabel}>No</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Gender Selection */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>Select one*</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setGender('boy')}
                >
                  <View style={styles.radioCircle}>
                    {gender === 'boy' && <View style={styles.radioSelected} />}
                  </View>
                  <Text style={styles.radioLabel}>Boy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setGender('girl')}
                >
                  <View style={styles.radioCircle}>
                    {gender === 'girl' && <View style={styles.radioSelected} />}
                  </View>
                  <Text style={styles.radioLabel}>Girl</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.requiredText}>*Required</Text>

            {/* Buttons */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAddChild}
            >
              <Text style={styles.primaryButtonText}>Add another child</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleDone}
            >
              <Text style={styles.secondaryButtonText}>Done</Text>
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
    marginBottom: 10,
  },
  homeButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 30,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2E5BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoText: {
    fontSize: 14,
    color: '#333333',
  },
  form: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#333333',
    marginBottom: 16,
  },
  questionSection: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 30,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2E5BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E5BFF',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333333',
  },
  requiredText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#2E5BFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#2E5BFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});