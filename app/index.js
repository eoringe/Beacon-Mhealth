import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return (
    <ImageBackground
      source={require('../assets/images/LandingPage.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Overlay for better text readability */}
      <View style={styles.overlay} />

      <View style={[
        styles.content,
        {
          paddingTop: insets.top + Spacing.huge,
          paddingBottom: insets.bottom + Spacing.huge,
        }
      ]}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Beacon Children's Centre</Text>
          <Text style={styles.subtitle}>Your neurodevelopmental clinic</Text>
        </View>

        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: Spacing.huge * 1.5,
  },
  title: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  getStartedButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.huge,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.white,
    minWidth: 200,
    alignItems: 'center',
  },
  getStartedText: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
});