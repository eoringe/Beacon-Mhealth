import 'react-native-get-random-values';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useSegments, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { Platform, AppState, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChildProvider } from '@/contexts/ChildContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AlertProvider } from '@/contexts/AlertContext';
import { Colors } from '@/constants/theme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlertProvider>
          <AuthProvider>
            <NotificationProvider>
              <ChildProvider>
                <NavigationWrapper />
              </ChildProvider>
            </NotificationProvider>
          </AuthProvider>
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function NavigationWrapper() {
  const { isDark, colorScheme } = useTheme();
  const { user, loading, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Don't navigate while still loading or initializing
    if (loading || initializing) return;

    const inAuthGroup = segments[0] === 'auth';
    const inWelcomeScreen = (segments as string[]).length === 0;

    if (!user && !inAuthGroup && !inWelcomeScreen) {
      // Redirect to the welcome page if not logged in and not in a public area
      router.replace('/');
    } else if (user && (inAuthGroup || inWelcomeScreen)) {
      // Only redirect to dashboard if email is verified
      if (user.emailVerified) {
        router.replace('/(tabs)/dashboard');
      } else {
        // If logged in but not verified, valid states are only Auth screens
        if (!inAuthGroup) {
          // Force them back to login if they try to access protected areas
          router.replace('/auth/login');
        }
      }
    }
  }, [user, loading, initializing, segments]);

  // Create custom navigation theme based on current theme
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colorScheme.background,
      card: colorScheme.surface,
      border: colorScheme.border,
      primary: colorScheme.primary,
    },
  };

  // Show loading during initialization or auth state changes
  if (loading || initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <View style={{ flex: 1, backgroundColor: colorScheme.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{
          headerShown: false,
          animation: 'default',
          presentation: 'card',
          contentStyle: { backgroundColor: colorScheme.background },
        }}>
          <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: colorScheme.background } }} />
          <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: colorScheme.background } }} />
          <Stack.Screen name="auth" options={{ contentStyle: { backgroundColor: colorScheme.background } }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
    </NavigationThemeProvider>
  );
}
