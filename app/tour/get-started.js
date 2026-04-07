import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function GetStartedTourScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();

  const handleFinish = () => {
    router.push('/add_child');
  };

  return (
    <View style={[styles.container, {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      backgroundColor: colorScheme.background
    }]}>
      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../../assets/images/beacon_hero.jpg')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={[styles.title, { color: colorScheme.primary }]}>Get Expert Advice</Text>
          <Text style={[styles.description, { color: colorScheme.textSecondary }]}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus lacinia libero ut metus convallis tempor. Vestibulum consequat, tortor mattis consequat
          </Text>
        </View>

        {/* Bottom Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.finishButton, { backgroundColor: colorScheme.primary }]}
            onPress={handleFinish}
          >
            <Text style={styles.finishButtonText}>Get Started</Text>
          </TouchableOpacity>

          {/* Empty spacer to match other screens */}
          <View style={styles.skipButton}>
            <Text style={styles.skipButtonText}> </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  illustration: {
    width: '80%',
    height: '100%',
    maxHeight: 300,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#E0E0E0',
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#2E5BFF',
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    marginBottom: Spacing.huge,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  finishButton: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.huge * 2,
    borderRadius: BorderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
  },
  skipButtonText: {
    fontSize: Typography.fontSize.base,
  },
});