import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, SafeAreaView, ImageBackground } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Theme colors
  const theme = {
    colors: {
      primary: '#0066CC',
      background: isDark ? '#121212' : '#FFFFFF',
      card: isDark ? '#1E1E1E' : '#F5F7FA',
      text: isDark ? '#F5F5F5' : '#333333',
      subtext: isDark ? '#AAAAAA' : '#666666',
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <View style={[styles.logoIcon, { backgroundColor: theme.colors.primary }]}>
          <MaterialIcons name="medical-services" size={24} color="#FFFFFF" />
        </View>
        <Text style={[styles.logoText, { color: theme.colors.text }]}>
          Beacon Children's Centre
        </Text>
      </View>
      
      <View style={styles.main}>
        {/* Main Image */}
        <View style={[styles.imageContainer, { backgroundColor: theme.colors.primary + '10' }]}>
          <MaterialIcons name="child-care" size={90} color={theme.colors.primary} />
        </View>
        
        {/* Tagline */}
        <Text style={[styles.tagline, { color: theme.colors.text }]}>
          Your trusted partner in children's healthcare and development
        </Text>
        
        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <MaterialIcons name="video-call" size={24} color={theme.colors.primary} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Teleconsultations with specialists
            </Text>
          </View>
          
          <View style={styles.featureRow}>
            <MaterialIcons name="assessment" size={24} color={theme.colors.primary} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Developmental screening tools
            </Text>
          </View>
          
          <View style={styles.featureRow}>
            <MaterialIcons name="event-available" size={24} color={theme.colors.primary} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Easy appointment booking
            </Text>
          </View>
        </View>
      </View>
      
      {/* Buttons */}
      <View style={[styles.buttonsContainer, { borderTopColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push('/auth/signup')}
        >
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.primary }]}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Log In</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.skipContainer}
          onPress={() => router.push('/(tabs)/dashboard')}
        >
          <Text style={[styles.skipText, { color: theme.colors.subtext }]}>
            Skip for now
          </Text>
          <MaterialIcons name="arrow-forward" size={16} color={theme.colors.subtext} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  main: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  imageContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
  },
  buttonsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  button: {
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    marginRight: 4,
  },
});